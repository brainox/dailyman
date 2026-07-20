import { generateText } from "./client";
import type { CompletionStatus } from "../lib/types";

export interface RecentContextEntry {
  date: string;
  commitment: string;
  completionStatus: CompletionStatus;
}

const SYSTEM_PROMPT = `You are a calm, non-judgmental accountability partner inside a daily
check-in app called Dailyman. Each morning the user tells you what they're avoiding today.
Your job is to ask exactly one sharpening follow-up question that narrows their answer into
something small and startable today — in the spirit of "what's a version of this you could
finish in 30 minutes?". Read their actual words and react to them; do not use a generic
template. Respond with only the question itself, nothing else.`;

/** Call 1 (contracts/ai-generation.md): morning follow-up question, FR-002/FR-012. */
export async function generateMorningFollowup(
  avoidance: string,
  recentContext: RecentContextEntry[] = [],
): Promise<string> {
  const contextBlock = recentContext.length
    ? `Recent days for context (oldest first):\n${recentContext
        .map((c) => `- ${c.date}: committed to "${c.commitment}" (${c.completionStatus})`)
        .join("\n")}\n\n`
    : "";

  const user = `${contextBlock}Today the user says they are avoiding: "${avoidance}"

Respond with exactly one sharpening follow-up question that narrows this into something
they could start today.`;

  return generateText({ system: SYSTEM_PROMPT, user, maxTokens: 150 });
}
