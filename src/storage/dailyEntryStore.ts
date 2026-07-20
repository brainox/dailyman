import { getDB, DAILY_ENTRY_STORE } from "./db";
import type { DailyEntry } from "../lib/types";

export async function getDailyEntry(date: string): Promise<DailyEntry | undefined> {
  const db = await getDB();
  return db.get(DAILY_ENTRY_STORE, date);
}

export async function upsertDailyEntry(entry: DailyEntry): Promise<void> {
  const db = await getDB();
  await db.put(DAILY_ENTRY_STORE, entry);
}

/** Inclusive range lookup by date string, oldest first. Missing days are simply absent. */
export async function listDailyEntriesInRange(
  startDate: string,
  endDate: string,
): Promise<DailyEntry[]> {
  const db = await getDB();
  const range = IDBKeyRange.bound(startDate, endDate);
  return db.getAll(DAILY_ENTRY_STORE, range);
}

/** All entries, oldest first — used by streak computation, which walks backward from today. */
export async function listAllDailyEntries(): Promise<DailyEntry[]> {
  const db = await getDB();
  return db.getAll(DAILY_ENTRY_STORE);
}
