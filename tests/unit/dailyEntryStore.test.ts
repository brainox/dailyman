import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";
import { _resetDBConnectionForTests } from "../../src/storage/db";
import {
  getDailyEntry,
  upsertDailyEntry,
  listDailyEntriesInRange,
  listAllDailyEntries,
} from "../../src/storage/dailyEntryStore";
import { getApiKey, setApiKey, getInProgressFlow, setInProgressFlow, clearInProgressFlow } from "../../src/storage/metaStore";
import type { DailyEntry } from "../../src/lib/types";

function entry(date: string, overrides: Partial<DailyEntry> = {}): DailyEntry {
  return { date, completionStatus: "pending", ...overrides };
}

beforeEach(() => {
  // Fresh database per test, simulating a real app restart/reload.
  indexedDB = new IDBFactory();
  _resetDBConnectionForTests();
});

describe("dailyEntryStore persistence (FR-011, SC-004)", () => {
  it("round-trips a written entry after a simulated reload", async () => {
    await upsertDailyEntry(entry("2026-07-20", { commitment: "write the report" }));
    const reloaded = await getDailyEntry("2026-07-20");
    expect(reloaded).toEqual(
      entry("2026-07-20", { commitment: "write the report" }),
    );
  });

  it("returns undefined for a date with no entry", async () => {
    expect(await getDailyEntry("2026-01-01")).toBeUndefined();
  });

  it("upsert overwrites the existing record for the same date", async () => {
    await upsertDailyEntry(entry("2026-07-20", { completionStatus: "pending" }));
    await upsertDailyEntry(
      entry("2026-07-20", { completionStatus: "complete", reflection: "done" }),
    );
    const result = await getDailyEntry("2026-07-20");
    expect(result?.completionStatus).toBe("complete");
    expect(result?.reflection).toBe("done");
  });

  it("lists entries within an inclusive date range", async () => {
    await upsertDailyEntry(entry("2026-07-18"));
    await upsertDailyEntry(entry("2026-07-19"));
    await upsertDailyEntry(entry("2026-07-20"));
    await upsertDailyEntry(entry("2026-07-21"));

    const results = await listDailyEntriesInRange("2026-07-19", "2026-07-20");
    expect(results.map((e) => e.date)).toEqual(["2026-07-19", "2026-07-20"]);
  });

  it("lists all entries for streak computation", async () => {
    await upsertDailyEntry(entry("2026-07-18"));
    await upsertDailyEntry(entry("2026-07-19"));
    const results = await listAllDailyEntries();
    expect(results).toHaveLength(2);
  });
});

describe("metaStore persistence", () => {
  it("round-trips the API key", async () => {
    expect(await getApiKey()).toBeUndefined();
    await setApiKey("sk-test-key");
    expect(await getApiKey()).toBe("sk-test-key");
  });

  it("round-trips and clears in-progress flow state", async () => {
    expect(await getInProgressFlow()).toBeUndefined();
    await setInProgressFlow({ activeDate: "2026-07-20", step: "morning-commitment" });
    expect(await getInProgressFlow()).toEqual({
      activeDate: "2026-07-20",
      step: "morning-commitment",
    });
    await clearInProgressFlow();
    expect(await getInProgressFlow()).toBeUndefined();
  });
});
