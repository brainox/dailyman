import { useEffect, useState } from "react";
import { useCheckinFlow } from "./state/useCheckinFlow";
import { canStartNightCheckin } from "./state/checkinPhase";
import { listAllDailyEntries } from "./storage/dailyEntryStore";
import { setApiKey } from "./storage/metaStore";
import { computeStreak } from "./lib/streak";
import { computeHeatmap } from "./lib/heatmap";
import { MainScreen } from "./components/MainScreen";
import { MorningCheckin } from "./components/MorningCheckin";
import { NightCheckin } from "./components/NightCheckin";
import { AcknowledgmentStep } from "./components/AcknowledgmentStep";
import { ApiKeyPrompt } from "./components/ApiKeyPrompt";
import type { DailyEntry } from "./lib/types";

function statusLabelFor(phase: ReturnType<typeof useCheckinFlow>["phase"]): string {
  switch (phase) {
    case "no-entry":
      return "Start your morning check-in";
    case "morning-in-progress":
      return "Continue this morning's check-in";
    case "commitment-set":
      return "Check in tonight";
    default:
      return "Today's check-in is done. See you tomorrow.";
  }
}

function App() {
  const flow = useCheckinFlow();
  const [showCheckinFlow, setShowCheckinFlow] = useState(false);
  const [entries, setEntries] = useState<DailyEntry[]>([]);

  useEffect(() => {
    if (!flow.loading) {
      void listAllDailyEntries().then(setEntries);
    }
    // Re-read whenever today's entry changes (i.e. after any write) so streak/heatmap stay in sync.
  }, [flow.loading, flow.entry]);

  if (flow.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg text-muted">
        Loading…
      </div>
    );
  }

  if (flow.isApiKeyMissing) {
    const handleSaveApiKey = async (key: string) => {
      await setApiKey(key);
      flow.clearError();
      if (flow.missedCheckin) {
        await flow.retryAcknowledgment();
      } else if (flow.pendingAvoidance) {
        await flow.retryFollowup();
      }
    };
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg p-6 text-text">
        <ApiKeyPrompt onSave={(key) => void handleSaveApiKey(key)} />
      </div>
    );
  }

  // FR-010: block on the acknowledgment before any new-day interaction (main
  // screen or morning check-in) whenever last night's check-in was missed.
  if (flow.missedCheckin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg p-6 text-text">
        <AcknowledgmentStep
          missedCommitment={flow.missedCheckin.commitment}
          prompt={flow.acknowledgmentPrompt}
          generating={flow.ackGenerating}
          error={flow.ackError}
          onRetry={flow.retryAcknowledgment}
          onSubmit={flow.submitAcknowledgment}
        />
      </div>
    );
  }

  if (!showCheckinFlow) {
    const streak = computeStreak(entries, flow.today);
    const heatmapDays = computeHeatmap(entries, flow.today);
    const canEnterCheckin = flow.phase !== "complete" && flow.phase !== "incomplete";

    return (
      <div className="flex min-h-screen items-center justify-center bg-bg p-6">
        <MainScreen
          streak={streak}
          heatmapDays={heatmapDays}
          todayStatusLabel={statusLabelFor(flow.phase)}
          canEnterCheckin={canEnterCheckin}
          onEnterCheckin={() => setShowCheckinFlow(true)}
        />
      </div>
    );
  }

  const isNightPhase = flow.phase === "commitment-set";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg p-6 text-text">
      {isNightPhase ? (
        <NightCheckin
          entry={flow.entry}
          canStart={canStartNightCheckin(flow.entry)}
          onSubmitOutcome={(completed, detail) => {
            void flow.submitNightOutcome(completed, detail).then(() => setShowCheckinFlow(false));
          }}
        />
      ) : (
        <MorningCheckin
          entry={flow.entry}
          generating={flow.generating}
          error={flow.error}
          isApiKeyMissing={flow.isApiKeyMissing}
          pendingAvoidance={flow.pendingAvoidance}
          onSubmitAvoidance={flow.submitAvoidance}
          onRetry={flow.retryFollowup}
          onSubmitCommitment={(commitment) => {
            void flow.submitCommitment(commitment).then(() => setShowCheckinFlow(false));
          }}
        />
      )}
    </div>
  );
}

export default App;
