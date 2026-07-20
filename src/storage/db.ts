import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { DailyEntry, InProgressFlowState } from "../lib/types";

const DB_NAME = "dailyman";
const DB_VERSION = 1;

export const DAILY_ENTRY_STORE = "dailyEntries";
export const META_STORE = "meta";

export interface MetaRecord {
  key: "apiKey" | "inProgressFlow";
  value: string | InProgressFlowState;
}

interface DailymanDB extends DBSchema {
  [DAILY_ENTRY_STORE]: {
    key: string;
    value: DailyEntry;
  };
  [META_STORE]: {
    key: MetaRecord["key"];
    value: MetaRecord;
  };
}

let dbPromise: Promise<IDBPDatabase<DailymanDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<DailymanDB>> {
  if (!dbPromise) {
    dbPromise = openDB<DailymanDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(DAILY_ENTRY_STORE)) {
          db.createObjectStore(DAILY_ENTRY_STORE, { keyPath: "date" });
        }
        if (!db.objectStoreNames.contains(META_STORE)) {
          db.createObjectStore(META_STORE, { keyPath: "key" });
        }
      },
    });
  }
  return dbPromise;
}

/** Test-only: drops the cached connection so a fresh IDBFactory is picked up on next getDB(). */
export function _resetDBConnectionForTests(): void {
  dbPromise = null;
}
