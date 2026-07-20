import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { IDBFactory } from "fake-indexeddb";
import { _resetDBConnectionForTests } from "../../src/storage/db";
import { setApiKey } from "../../src/storage/metaStore";
import { upsertDailyEntry, getDailyEntry } from "../../src/storage/dailyEntryStore";
import { todayISO, yesterdayOf } from "../../src/lib/date";
import { useCheckinFlow } from "../../src/state/useCheckinFlow";

vi.mock("../../src/ai/generateAcknowledgment", () => ({
  generateMissedCheckinAcknowledgment: vi.fn(async () => "What happened last night?"),
}));
vi.mock("../../src/ai/generateFollowup", () => ({
  generateMorningFollowup: vi.fn(async () => "What's a 30-minute version of this?"),
}));

beforeEach(async () => {
  // eslint-disable-next-line no-global-assign -- swapping the fake-indexeddb instance is intentional
  indexedDB = new IDBFactory();
  _resetDBConnectionForTests();
  await setApiKey("test-key");
});

describe("useCheckinFlow: acknowledgment-to-morning handoff (regression, found via live testing)", () => {
  it("allows the morning flow to proceed and preserves acknowledgment fields after acknowledging a missed check-in", async () => {
    const today = todayISO();
    const yesterday = yesterdayOf(today);
    await upsertDailyEntry({
      date: yesterday,
      commitment: "send the invoice",
      completionStatus: "pending",
    });

    const { result } = renderHook(() => useCheckinFlow());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await waitFor(() => expect(result.current.missedCheckin).not.toBeNull());
    await waitFor(() =>
      expect(result.current.acknowledgmentPrompt).toBe("What happened last night?"),
    );

    await act(async () => {
      await result.current.submitAcknowledgment("I forgot to check in");
    });

    await waitFor(() => expect(result.current.missedCheckin).toBeNull());

    // Regression: this must read "no-entry" so the guard below doesn't
    // silently block the next submitAvoidance call.
    expect(result.current.phase).toBe("no-entry");

    await act(async () => {
      await result.current.submitAvoidance("writing the report");
    });

    await waitFor(() => expect(result.current.entry?.morningFollowup).toBeDefined());

    const stored = await getDailyEntry(today);
    expect(stored?.avoidance).toBe("writing the report");
    expect(stored?.morningFollowup).toBe("What's a 30-minute version of this?");
    // Regression: upsert must merge onto the existing entry, not replace it —
    // these acknowledgment fields must survive submitAvoidance's write.
    expect(stored?.acknowledgedMissedPrior).toBe(true);
    expect(stored?.acknowledgmentResponse).toBe("I forgot to check in");
  });
});
