import { getDB, META_STORE } from "./db";
import type { InProgressFlowState } from "../lib/types";

export async function getApiKey(): Promise<string | undefined> {
  const db = await getDB();
  const record = await db.get(META_STORE, "apiKey");
  return typeof record?.value === "string" ? record.value : undefined;
}

export async function setApiKey(apiKey: string): Promise<void> {
  const db = await getDB();
  await db.put(META_STORE, { key: "apiKey", value: apiKey });
}

export async function getInProgressFlow(): Promise<InProgressFlowState | undefined> {
  const db = await getDB();
  const record = await db.get(META_STORE, "inProgressFlow");
  return record && typeof record.value !== "string"
    ? (record.value as InProgressFlowState)
    : undefined;
}

export async function setInProgressFlow(state: InProgressFlowState): Promise<void> {
  const db = await getDB();
  await db.put(META_STORE, { key: "inProgressFlow", value: state });
}

export async function clearInProgressFlow(): Promise<void> {
  const db = await getDB();
  await db.delete(META_STORE, "inProgressFlow");
}
