# Contract: Live AI Generation Calls

This app has one external interface: two client-side calls to the Anthropic Messages API (`claude-sonnet-4-6`), per FR-012. Everything else is internal, local state (see data-model.md). This document is the contract between the app's UI layer and the generation function it calls — not a network wire format, since the Anthropic SDK owns that.

## Call 1: Morning follow-up question

**Trigger**: User submits their answer to "What are you avoiding today?" (FR-001 → FR-002).

**Input**:
| Field | Type | Description |
|---|---|---|
| `avoidance` | string | The user's raw answer, non-empty. |
| `recentContext` | array of `{ date, commitment, completionStatus }`, optional | Up to the last 5 resolved `DailyEntry` records, oldest-first, to let the model notice patterns (e.g., repeated blockers) without re-sending full history. |

**Output** (on success):
| Field | Type | Description |
|---|---|---|
| `followupQuestion` | string | Exactly one question intended to shrink `avoidance` into a startable commitment. Must not be empty; must be a single question, not a list. |

**Output (on failure)**: See "Error handling" below.

**Prompt intent** (guidance for prompt construction, not literal wire text): Ask the model to act as a calm, non-judgmental accountability partner; read the user's stated avoidance and respond with exactly one sharpening follow-up question that narrows the task to something completable today, in the tone of "what's a version of this you could finish in 30 minutes?" — reactive to the actual words the user wrote, not a templated fill-in-the-blank.

## Call 2: Missed-check-in acknowledgment prompt

**Trigger**: App opens and detects yesterday has a `commitment` but `completionStatus` is still `"pending"` (i.e., no night check-in happened) — FR-010.

**Input**:
| Field | Type | Description |
|---|---|---|
| `missedDate` | string (`YYYY-MM-DD`) | The day that was skipped. |
| `missedCommitment` | string | That day's recorded `commitment`. |

**Output** (on success):
| Field | Type | Description |
|---|---|---|
| `acknowledgmentPrompt` | string | One question asking what happened, in the same non-judgmental tone. |

**Output (on failure)**: See "Error handling" below.

**Prompt intent**: Acknowledge the gap without shame; ask what happened the prior night, framed as gathering data rather than issuing a penalty, consistent with FR-006's "no shame, just data" requirement for the parallel night-check-in-incomplete path.

## Shared behavior

- **Timeout**: A call that does not resolve within a reasonable client-side timeout (e.g., 15s) is treated as a failure.
- **Error handling**: On any failure (network error, timeout, API error, malformed/empty response), the UI shows an inline error state at the point of the call (not a full-screen blocker, per research.md §5) with a retry action. No partial `DailyEntry` write happens until a valid response is received — the user's raw input (`avoidance`, or the fact that yesterday was missed) is preserved locally so retry does not require re-typing.
- **API key**: Read from local persisted app settings (see data-model.md's `meta` store); if absent, the UI must prompt the user to supply one before any generation call is attempted, rather than failing the call. Never bundled into source.
- **Determinism boundary**: These are the only two points in the app that call the network/LLM. Streak computation, heatmap rendering, and night-outcome branching (yes/no) are pure local logic and must not depend on these calls succeeding.
