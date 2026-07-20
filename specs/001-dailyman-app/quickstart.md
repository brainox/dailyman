# Quickstart: Dailyman Daily Accountability Check-in

Validation guide for the feature described in [spec.md](./spec.md), designed per [plan.md](./plan.md), [data-model.md](./data-model.md), and [contracts/ai-generation.md](./contracts/ai-generation.md).

## Prerequisites

- Node.js 20+ and a package manager (npm/pnpm) installed.
- An Anthropic API key (personal, single-user use per research.md §4 — never commit it).
- A modern evergreen browser (Chrome, Firefox, Safari, or Edge) with IndexedDB support.

## Setup

```bash
npm install
npm run dev
```

Open the printed local URL. On first run, the app should prompt for an Anthropic API key (contracts/ai-generation.md, "API key" behavior) before any check-in flow that needs generation.

## Scenario 1: Morning commitment → night reflection (User Story 1, P1)

1. Open the app with no prior entries today.
2. Confirm the main screen offers a "start morning check-in" entry point (no commitment exists yet today).
3. Enter an answer to "what are you avoiding today?" and submit.
   - **Expect**: a single live-generated follow-up question appears (contracts/ai-generation.md Call 1). If the network is unavailable, expect an inline error with retry, not a blocked app.
4. Answer the follow-up; submit.
   - **Expect**: today's `DailyEntry.commitment` is set; the app returns to the main screen; the night check-in entry point becomes available (FR-014).
5. Reopen the app (simulate closing/reopening the browser tab).
   - **Expect**: today's commitment is still shown (FR-011 persistence); the app does not re-ask the morning question.
6. Start the night check-in and answer "yes, I completed it."
   - **Expect**: the app asks "what did you learn?"; after submitting, `completionStatus = "complete"`, `reflection` is saved (FR-005).
7. Repeat steps 1–4 on a fresh simulated day, then at night answer "no."
   - **Expect**: the app asks "what blocked you?" in a neutral tone; after submitting, `completionStatus = "incomplete"` (FR-006).

**Pass criteria**: SC-001 (morning flow completable quickly), SC-002 (night flow completable quickly), both entries correctly persisted and retrievable after reopening the app (SC-004).

## Scenario 2: Streak and 30-day heatmap (User Story 2, P2)

1. Seed several consecutive days of `"complete"` entries (via the flow in Scenario 1, or by directly inserting test `DailyEntry` records for local testing).
2. View the main screen.
   - **Expect**: the streak counter equals the number of consecutive complete days, displayed as the dominant visual element (FR-008).
3. Insert or produce one `"incomplete"` day, or leave one calendar day with no entry at all, then reload.
   - **Expect**: the streak counter resets to 0 starting from the day after the break (FR-013, hard reset — data-model.md's Streak computation rule).
4. View the calendar heatmap.
   - **Expect**: the last 30 days render with three visually distinct states — complete, incomplete, no-entry (FR-009).

**Pass criteria**: SC-003 (streak + history visible on one screen, no navigation).

## Scenario 3: Missed check-in acknowledgment (User Story 3, P3)

1. Complete a morning check-in for "yesterday" (commitment set) but do not complete the night check-in.
2. Open the app on the next calendar day.
   - **Expect**: before the new "what are you avoiding today?" prompt appears, the app asks what happened last night (contracts/ai-generation.md Call 2, FR-010).
3. Answer the acknowledgment prompt.
   - **Expect**: the app then proceeds to today's normal morning flow; the missed day remains recorded as a broken streak point (not silently skipped).
4. As a control, complete both check-ins on a given day, then open the app the next morning.
   - **Expect**: no acknowledgment step appears; the app goes straight to today's commitment prompt.

**Pass criteria**: SC-005 (every missed night check-in produces an acknowledgment prompt on next open; zero silent resets).

## Edge case spot checks

- **Duplicate check-in**: attempt to start a second morning check-in on a day that already has a commitment — expect the app to prevent/ignore this rather than overwrite (Edge Cases, data-model.md's immutable-`date`-key note).
- **Night check-in with no commitment**: attempt to reach the night check-in flow directly on a day with no morning commitment — expect it to redirect to the morning flow (FR-014).
- **Mid-flow resume**: close the app mid-morning-flow (after avoidance is submitted but before the follow-up is answered) and reopen — expect the app to resume at the same step rather than restarting (data-model.md `InProgressFlowState`).
- **First-ever day**: on a completely fresh install with zero entries, confirm the main screen renders sensibly (streak = 0, heatmap shows 30 "no-entry" days, no acknowledgment step).

## Automated test coverage (per research.md §6)

Run:

```bash
npm run test
```

Expect unit/component coverage (Vitest + React Testing Library) for: streak computation (including the walk-backward/hard-reset rule), heatmap state derivation, and the check-in state machine transitions — these are the deterministic, non-AI-dependent parts of the app and should be fully covered without needing a live network call.
