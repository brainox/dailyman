# Phase 1 Data Model: Dailyman Daily Accountability Check-in

Derived from spec.md's Key Entities (Daily Entry, Streak) and the FR-001–FR-014 state rules. Storage medium is IndexedDB (see research.md §3); this document defines the object-store schema and in-app state shape, not implementation code.

## Entity: DailyEntry

One record per calendar day, keyed by ISO date string (`YYYY-MM-DD`, user's local device date per spec Assumptions).

| Field | Type | Required | Notes |
|---|---|---|---|
| `date` | string (`YYYY-MM-DD`) | yes | Primary key. One entry per day (Edge Cases: duplicate check-ins guarded by this being the natural key). |
| `avoidance` | string | after morning start | Raw answer to "what are you avoiding today" (FR-001). |
| `morningFollowup` | string | after AI call | The live-generated sharpening question (FR-002, FR-012). |
| `commitment` | string | after morning complete | The user's answer to the follow-up; becomes the day's commitment (FR-003). |
| `morningCompletedAt` | ISO datetime | after morning complete | Timestamp gating night check-in availability (FR-014). |
| `completionStatus` | enum: `"pending" \| "complete" \| "incomplete"` | yes (defaults `"pending"`) | `"pending"` until night check-in resolved; drives streak calc (FR-005/FR-006) and heatmap coloring (FR-009). |
| `reflection` | string | when `completionStatus = "complete"` | Answer to "what did you learn" (FR-005). |
| `blocker` | string | when `completionStatus = "incomplete"` | Answer to "what blocked you" (FR-006). |
| `nightCompletedAt` | ISO datetime | after night complete | Marks the day's check-in pair as closed. |
| `acknowledgedMissedPrior` | boolean | optional | True if this day's morning flow included the FR-010 "what happened last night" step (set on the day the *acknowledgment* is answered, not on the day that was missed). |
| `acknowledgmentResponse` | string | when `acknowledgedMissedPrior = true` | The user's answer to the missed-check-in acknowledgment prompt. |

**Validation rules**:
- `date` is immutable once created (it is the key).
- `commitment` cannot exist without `avoidance` and `morningFollowup` (morning flow is sequential: avoidance → followup → commitment).
- `reflection`/`blocker` are mutually exclusive — exactly one is set once `completionStatus` leaves `"pending"`.
- A `DailyEntry` for "today" is only created once the morning flow starts; there is no pre-created empty row for future/unstarted days (keeps the "no entry" heatmap state truthful per FR-009).

**State transitions** (per-day, matches FR-001–FR-006 and FR-014):

```
(no entry)
   → morning-in-progress (avoidance answered, followup requested)   [FR-001, FR-002]
   → commitment-set (completionStatus = "pending")                  [FR-003]
   → night-in-progress (only reachable if commitment-set)           [FR-014]
   → complete (reflection recorded, completionStatus = "complete")  [FR-005]
      or
   → incomplete (blocker recorded, completionStatus = "incomplete") [FR-006]
```

A day stuck at `morning-in-progress` or `night-in-progress` (app closed mid-flow) is resumed by re-reading the persisted partial `DailyEntry` on next app open (Edge Cases: resume mid-flow).

## Entity: InProgressFlowState

Not part of spec's Key Entities but required to satisfy the Edge Case "resume mid-flow if the user closes the app during a check-in." Stored as a single record in a small `meta` object store (not per-day), since only one flow can be active at a time.

| Field | Type | Notes |
|---|---|---|
| `activeDate` | string (`YYYY-MM-DD`) | Which day's entry is currently being edited. |
| `step` | enum: `"morning-avoidance" \| "morning-followup-wait" \| "morning-commitment" \| "acknowledgment" \| "night-outcome" \| "night-followup-wait" \| "night-detail"` | Exact UI step to resume into. |

Cleared when a day's check-in (morning or night) reaches a terminal state (`commitment-set` or `complete`/`incomplete`).

## Derived value: Streak

Not stored as an independently-updated counter — **computed on read** by walking backward day-by-day from today through `DailyEntry` records, per the plan input's explicit instruction ("compute this by walking backward... not by a stored 'last streak' counter alone, so it self-corrects if the app was closed for multiple days").

| Field | Type | Notes |
|---|---|---|
| `currentLength` | integer ≥ 0 | Count of consecutive days (ending yesterday or today, whichever is the most recent fully-resolved day) where `completionStatus = "complete"`. |
| `startDate` | string (`YYYY-MM-DD`) or null | First day of the current run; null when `currentLength = 0`. |

**Computation rule** (FR-007, FR-013 — hard reset, no grace):
1. Start at the most recent day that has a terminal `completionStatus` (i.e., not `"pending"` and not missing).
2. Walk backward one day at a time. Increment `currentLength` while each consecutive calendar day has `completionStatus = "complete"`.
3. Stop (streak breaks) at the first day that is `"incomplete"`, or a calendar day with no `DailyEntry` at all (a fully-missed day — no morning check-in, no night check-in), per FR-013's "single missed check-in of either kind resets the streak."
4. Today, while still `"pending"` (in progress or not yet started), does not itself break or extend the streak — it is simply excluded from the walk until it resolves.

## Relationship summary

- `DailyEntry` : `InProgressFlowState` — 0-or-1 : 1 (at most one active in-progress entry at a time, referenced by `activeDate`).
- `Streak` has no stored relationship — it is a pure function over the full `DailyEntry` collection, recomputed on every main-screen render.

## Heatmap projection (FR-009)

The 30-day heatmap is a read-only view model derived from `DailyEntry`, not a separate stored entity:

```
for each of the last 30 calendar days (oldest → newest):
  if no DailyEntry exists for that date        → state = "no-entry"
  else if completionStatus === "complete"      → state = "complete"
  else                                          → state = "incomplete"   // covers "incomplete" and abandoned "pending" from a past day
```
