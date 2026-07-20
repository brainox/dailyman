import { useCallback, useEffect, useRef, useState } from "react";
import { getDailyEntry, upsertDailyEntry, listAllDailyEntries } from "../storage/dailyEntryStore";
import { getInProgressFlow, setInProgressFlow, clearInProgressFlow } from "../storage/metaStore";
import { todayISO, yesterdayOf } from "../lib/date";
import type { DailyEntry } from "../lib/types";
import {
  deriveCheckinPhase,
  canStartMorningCheckin,
  canStartNightCheckin,
  type CheckinPhase,
} from "./checkinPhase";
import { detectMissedCheckin, type MissedCheckin } from "../lib/missedCheckin";
import { generateMorningFollowup, type RecentContextEntry } from "../ai/generateFollowup";
import { generateMissedCheckinAcknowledgment } from "../ai/generateAcknowledgment";
import { ApiKeyMissingError } from "../ai/client";

async function getRecentContext(beforeDate: string, limit = 5): Promise<RecentContextEntry[]> {
  const all = await listAllDailyEntries();
  return all
    .filter((e) => e.date < beforeDate && e.commitment && e.completionStatus !== "pending")
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .slice(-limit)
    .map((e) => ({
      date: e.date,
      commitment: e.commitment!,
      completionStatus: e.completionStatus,
    }));
}

export interface UseCheckinFlowResult {
  loading: boolean;
  today: string;
  entry: DailyEntry | undefined;
  phase: CheckinPhase;
  generating: boolean;
  error: string | undefined;
  isApiKeyMissing: boolean;
  pendingAvoidance: string | undefined;
  submitAvoidance: (avoidance: string) => Promise<void>;
  retryFollowup: () => Promise<void>;
  clearError: () => void;
  submitCommitment: (commitment: string) => Promise<void>;
  submitNightOutcome: (completed: boolean, detail: string) => Promise<void>;
  missedCheckin: MissedCheckin | null;
  acknowledgmentPrompt: string | undefined;
  ackGenerating: boolean;
  ackError: string | undefined;
  retryAcknowledgment: () => Promise<void>;
  submitAcknowledgment: (response: string) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Drives the daily check-in flow: loads/resumes today's entry, calls the live
 * morning-followup generation, and persists each transition per data-model.md.
 * Night flow's learned/blocked question is static (FR-005/FR-006 do not
 * require live generation, unlike FR-002), so it needs no AI call or retry
 * state; if interrupted between the yes/no and detail questions the UI simply
 * restarts the night check-in on reload (entry stays at "commitment-set").
 */
export function useCheckinFlow(): UseCheckinFlowResult {
  const today = todayISO();
  const [loading, setLoading] = useState(true);
  const [entry, setEntry] = useState<DailyEntry | undefined>();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(false);
  const [pendingAvoidance, setPendingAvoidance] = useState<string | undefined>();
  const [yesterdayEntry, setYesterdayEntry] = useState<DailyEntry | undefined>();
  const [acknowledgmentPrompt, setAcknowledgmentPrompt] = useState<string | undefined>();
  const [ackGenerating, setAckGenerating] = useState(false);
  const [ackError, setAckError] = useState<string | undefined>();

  const refresh = useCallback(async () => {
    const [loadedEntry, flow, loadedYesterday] = await Promise.all([
      getDailyEntry(today),
      getInProgressFlow(),
      getDailyEntry(yesterdayOf(today)),
    ]);
    setEntry(loadedEntry);
    setYesterdayEntry(loadedYesterday);
    if (
      flow?.activeDate === today &&
      flow.step === "morning-commitment" &&
      loadedEntry?.avoidance
    ) {
      setPendingAvoidance(loadedEntry.avoidance);
    }
    setLoading(false);
  }, [today]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const missedCheckin = detectMissedCheckin(yesterdayEntry, entry);
  const missedDate = missedCheckin?.date;
  const missedCommitment = missedCheckin?.commitment;

  // FR-010: as soon as a missed check-in is detected, generate the acknowledgment
  // prompt automatically (there's no separate user-initiated trigger for this call).
  // Note: `ackGenerating` is deliberately NOT a dependency here, even though the
  // effect sets it — including it would make the effect clean itself up (and
  // discard the in-flight result via `cancelled`) as soon as that state update
  // lands, before the real async response ever arrives. The ref-based guard
  // below prevents duplicate calls instead. `ackAttempt` is bumped explicitly by
  // retryAcknowledgment() to re-trigger this effect after a failure — `ackError`
  // itself is deliberately NOT a dependency, since a plain state change there
  // (undefined -> message) would otherwise immediately re-fire the same call and
  // loop, instead of waiting for the user to press Retry.
  const ackInFlightRef = useRef(false);
  const [ackAttempt, setAckAttempt] = useState(0);
  useEffect(() => {
    if (!missedDate || !missedCommitment) return;
    if (acknowledgmentPrompt || ackInFlightRef.current) return;
    let cancelled = false;
    ackInFlightRef.current = true;
    setAckGenerating(true);
    setAckError(undefined);
    generateMissedCheckinAcknowledgment(missedCommitment)
      .then((prompt) => {
        if (!cancelled) setAcknowledgmentPrompt(prompt);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiKeyMissingError) {
          setIsApiKeyMissing(true);
        } else {
          setAckError(err instanceof Error ? err.message : "Something went wrong.");
        }
      })
      .finally(() => {
        ackInFlightRef.current = false;
        if (!cancelled) setAckGenerating(false);
      });
    return () => {
      cancelled = true;
    };
  }, [missedDate, missedCommitment, acknowledgmentPrompt, ackAttempt]);

  const retryAcknowledgment = useCallback(async () => {
    setAcknowledgmentPrompt(undefined);
    setAckError(undefined);
    setAckAttempt((n) => n + 1);
  }, []);

  const submitAcknowledgment = useCallback(
    async (response: string) => {
      if (!missedCheckin) return;
      const base: DailyEntry = entry ?? { date: today, completionStatus: "pending" };
      const updated: DailyEntry = {
        ...base,
        acknowledgedMissedPrior: true,
        acknowledgmentResponse: response,
      };
      await upsertDailyEntry(updated);
      setEntry(updated);
      setAcknowledgmentPrompt(undefined);
      setAckError(undefined);
    },
    [entry, missedCheckin, today],
  );

  const submitAvoidance = useCallback(
    async (avoidance: string) => {
      if (!canStartMorningCheckin(entry)) return;
      setPendingAvoidance(avoidance);
      setError(undefined);
      setIsApiKeyMissing(false);
      setGenerating(true);
      try {
        const recentContext = await getRecentContext(today);
        const followupQuestion = await generateMorningFollowup(avoidance, recentContext);
        const newEntry: DailyEntry = {
          date: today,
          avoidance,
          morningFollowup: followupQuestion,
          completionStatus: "pending",
        };
        await upsertDailyEntry(newEntry);
        await setInProgressFlow({ activeDate: today, step: "morning-commitment" });
        setEntry(newEntry);
        setPendingAvoidance(undefined);
      } catch (err) {
        if (err instanceof ApiKeyMissingError) {
          setIsApiKeyMissing(true);
        } else {
          setError(err instanceof Error ? err.message : "Something went wrong.");
        }
      } finally {
        setGenerating(false);
      }
    },
    [entry, today],
  );

  const retryFollowup = useCallback(async () => {
    if (pendingAvoidance) {
      await submitAvoidance(pendingAvoidance);
    }
  }, [pendingAvoidance, submitAvoidance]);

  const clearError = useCallback(() => {
    setError(undefined);
    setIsApiKeyMissing(false);
  }, []);

  const submitCommitment = useCallback(
    async (commitment: string) => {
      if (!entry || entry.commitment) return;
      const updated: DailyEntry = {
        ...entry,
        commitment,
        morningCompletedAt: new Date().toISOString(),
      };
      await upsertDailyEntry(updated);
      await clearInProgressFlow();
      setEntry(updated);
    },
    [entry],
  );

  const submitNightOutcome = useCallback(
    async (completed: boolean, detail: string) => {
      if (!entry || !canStartNightCheckin(entry)) return;
      const updated: DailyEntry = {
        ...entry,
        completionStatus: completed ? "complete" : "incomplete",
        reflection: completed ? detail : undefined,
        blocker: completed ? undefined : detail,
        nightCompletedAt: new Date().toISOString(),
      };
      await upsertDailyEntry(updated);
      await clearInProgressFlow();
      setEntry(updated);
    },
    [entry],
  );

  return {
    loading,
    today,
    entry,
    phase: deriveCheckinPhase(entry),
    generating,
    error,
    isApiKeyMissing,
    pendingAvoidance,
    submitAvoidance,
    retryFollowup,
    clearError,
    submitCommitment,
    submitNightOutcome,
    missedCheckin,
    acknowledgmentPrompt,
    ackGenerating,
    ackError,
    retryAcknowledgment,
    submitAcknowledgment,
    refresh,
  };
}
