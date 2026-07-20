import { generateText } from "./client";

const SYSTEM_PROMPT = `You are a calm, non-judgmental accountability partner inside a daily
check-in app called Dailyman. The user did not check back in last night to say whether they
completed a commitment they had made. Acknowledge the gap without shame — frame it as
gathering data, not issuing a penalty — and ask what happened. Respond with only the
question itself, nothing else.`;

/** Call 2 (contracts/ai-generation.md): missed-check-in acknowledgment prompt, FR-010/FR-012. */
export async function generateMissedCheckinAcknowledgment(
  missedCommitment: string,
): Promise<string> {
  const user = `Yesterday's commitment was: "${missedCommitment}"

The user never checked back in last night to say whether they did it. Ask what happened.`;

  return generateText({ system: SYSTEM_PROMPT, user, maxTokens: 150 });
}
