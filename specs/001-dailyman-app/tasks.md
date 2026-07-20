---

description: "Task list template for feature implementation"
---

# Tasks: Dailyman Daily Accountability Check-in

**Input**: Design documents from `/specs/001-dailyman-app/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/ai-generation.md, quickstart.md

**Tests**: Included for the reusable/recurring logic only (state machine, streak computation, heatmap projection, missed-check-in detection), per the constitution's Testing Standards principle and the Vitest + React Testing Library approach locked in by plan.md/research.md. Full per-screen visual/styling coverage is not included as dedicated test tasks — those are validated manually via quickstart.md.

**Organization**: Tasks are grouped by user story (US1/US2/US3 from spec.md, priority order P1 → P2 → P3) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths are included in every description

## Path Conventions

Single frontend-only project at the repository root, per plan.md's Project Structure:

```text
dailyman/
├── src/
│   ├── components/
│   ├── state/
│   ├── storage/
│   ├── ai/
│   └── lib/
└── tests/
    ├── unit/
    └── components/
```

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Scaffold Vite + React + TypeScript project at repository root: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.tsx`
- [ ] T002 [P] Add and pin core runtime dependencies (`react`, `react-dom`, `idb`, `@anthropic-ai/sdk`) in `package.json`
- [ ] T003 [P] Configure Tailwind CSS with a dark theme and single accent-color token per spec Assumptions in `tailwind.config.ts`, `postcss.config.js`, `src/index.css`
- [ ] T004 [P] Configure Vitest + React Testing Library test runner in `vitest.config.ts`, `src/test/setup.ts`, and add a `test` script to `package.json`
- [ ] T005 [P] Configure ESLint + Prettier for TypeScript/React in `.eslintrc.cjs`, `.prettierrc`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 Define shared TypeScript types for `DailyEntry`, `InProgressFlowState`, `Streak`, and heatmap day state per data-model.md in `src/lib/types.ts`
- [ ] T007 [P] Implement local date utilities (today's ISO date, day arithmetic, last-30-days range) per data-model.md and spec Assumptions in `src/lib/date.ts`
- [ ] T008 Implement IndexedDB wrapper using `idb` defining the `DailyEntry` object store (keyed by date) and a `meta` store (API key, `InProgressFlowState`) per data-model.md in `src/storage/db.ts` (depends on T006)
- [ ] T009 [P] Implement `DailyEntry` CRUD functions (get by date, upsert, list-by-date-range) in `src/storage/dailyEntryStore.ts` (depends on T008)
- [ ] T010 [P] Implement `meta` store accessors for the API key and `InProgressFlowState` in `src/storage/metaStore.ts` (depends on T008)
- [ ] T011 Implement the shared Anthropic client wrapper (API-key retrieval, request timeout, error normalization) per contracts/ai-generation.md "Shared behavior" in `src/ai/client.ts` (depends on T010)
- [ ] T012 Implement an App shell skeleton that loads persisted state on mount and defines the routing structure between screens (concrete screens are wired in by later phases) in `src/App.tsx` (depends on T009, T010)
- [ ] T013 [P] Unit tests for date utilities (today's date, last-30-days range boundaries) in `tests/unit/date.test.ts` (depends on T007)

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 - Morning commitment and night reflection loop (Priority: P1) 🎯 MVP

**Goal**: A user can complete a morning check-in (state an avoidance, get one live follow-up question, land on a commitment) and, later, a night check-in (report completion, answer the closing question) — recorded as a single daily entry.

**Independent Test**: Complete one morning check-in and one night check-in in a single day and confirm both are recorded as one `DailyEntry` (FR-001–FR-006, FR-011, FR-014).

### Tests for User Story 1

- [ ] T014 [P] [US1] Unit test for the check-in state machine transitions (no-entry → morning-in-progress → commitment-set → night-in-progress → complete/incomplete) per data-model.md in `tests/unit/checkinStateMachine.test.ts`
- [ ] T015 [P] [US1] Component test for the morning check-in flow (avoidance → live follow-up → commitment saved) in `tests/components/MorningCheckin.test.tsx`
- [ ] T016 [P] [US1] Component test for the night check-in flow (yes → "what did you learn", no → "what blocked you", each persisting the correct `completionStatus`) in `tests/components/NightCheckin.test.tsx`

### Implementation for User Story 1

- [ ] T017 [US1] Implement the morning follow-up generation function (Call 1) per contracts/ai-generation.md in `src/ai/generateFollowup.ts` (depends on T011)
- [ ] T018 [US1] Implement the check-in state machine hook — step transitions, `InProgressFlowState` read/write for mid-flow resume, and the duplicate-check-in guard (Edge Cases) — in `src/state/useCheckinFlow.ts` (depends on T009, T010, T012)
- [ ] T019 [P] [US1] Build the `MorningCheckin` component (avoidance input → follow-up question → commitment confirmation) in `src/components/MorningCheckin.tsx` (depends on T017, T018)
- [ ] T020 [P] [US1] Build the `NightCheckin` component (completion yes/no → learned/blocked prompt; unavailable/redirects to morning flow when no commitment exists per FR-014) in `src/components/NightCheckin.tsx` (depends on T018)
- [ ] T021 [US1] Build a shared inline AI error/retry UI per contracts/ai-generation.md "Error handling" in `src/components/AiErrorState.tsx` (depends on T017)
- [ ] T022 [US1] Wire `MorningCheckin` and `NightCheckin` into the App shell with a minimal entry screen showing today's check-in status (streak/heatmap added in Phase 4) in `src/App.tsx` (depends on T019, T020, T021)

**Checkpoint**: User Story 1 is fully functional and independently testable — a full day's commitment-and-reflection loop works end to end.

---

## Phase 4: User Story 2 - Streak visibility and history (Priority: P2)

**Goal**: A user can see, at a glance, their current consecutive-day streak and a 30-day heatmap of completed/incomplete/no-entry days.

**Independent Test**: Seed several days of entries (directly, without going through the full US1 UI flow) and confirm the displayed streak number and heatmap match the actual completion pattern (FR-007, FR-008, FR-009, FR-013).

### Tests for User Story 2

- [ ] T023 [P] [US2] Unit test for streak computation — walk-backward from the most recent resolved day, hard reset to 0 on any incomplete or missing day, no grace period — in `tests/unit/streak.test.ts`
- [ ] T024 [P] [US2] Unit test for the 30-day heatmap projection (complete / incomplete / no-entry states) in `tests/unit/heatmap.test.ts`

### Implementation for User Story 2

- [ ] T025 [P] [US2] Implement the streak computation function per data-model.md's Streak computation rule in `src/lib/streak.ts` (depends on T009)
- [ ] T026 [P] [US2] Implement the 30-day heatmap projection function in `src/lib/heatmap.ts` (depends on T009, T007)
- [ ] T027 [P] [US2] Build the `StreakCounter` component (large numeral, the dominant visual element per spec Assumptions) in `src/components/StreakCounter.tsx` (depends on T025)
- [ ] T028 [P] [US2] Build the `Heatmap` component with three visually distinct day states in `src/components/Heatmap.tsx` (depends on T026)
- [ ] T029 [US2] Build the `MainScreen` component composing `StreakCounter` + `Heatmap` + today's check-in entry point in `src/components/MainScreen.tsx` (depends on T027, T028)
- [ ] T030 [US2] Replace the App shell's minimal entry screen with `MainScreen` as the default view in `src/App.tsx` (depends on T029, T022)

**Checkpoint**: User Stories 1 AND 2 both work independently — the app now shows streak + history alongside the check-in loop.

---

## Phase 5: User Story 3 - Missed check-in acknowledgment (Priority: P3)

**Goal**: When a user skipped last night's check-in, the app asks what happened before presenting a new day's commitment prompt, instead of silently resetting.

**Independent Test**: Skip a night check-in, then open the app the next morning and confirm the acknowledgment prompt appears before the new day's commitment flow (FR-010).

### Tests for User Story 3

- [ ] T031 [P] [US3] Unit test for missed-check-in detection (yesterday has a commitment but `completionStatus` is still `"pending"`) in `tests/unit/missedCheckin.test.ts`
- [ ] T032 [P] [US3] Component test for the `AcknowledgmentStep` flow (prompt shown → response saved → proceeds to today's morning flow) in `tests/components/AcknowledgmentStep.test.tsx`

### Implementation for User Story 3

- [ ] T033 [US3] Implement the missed-check-in detection function per FR-010 and data-model.md's `acknowledgedMissedPrior` field in `src/lib/missedCheckin.ts` (depends on T009, T007)
- [ ] T034 [US3] Implement the missed-check-in acknowledgment generation function (Call 2) per contracts/ai-generation.md in `src/ai/generateAcknowledgment.ts` (depends on T011)
- [ ] T035 [US3] Build the `AcknowledgmentStep` component in `src/components/AcknowledgmentStep.tsx` (depends on T034)
- [ ] T036 [US3] Wire `AcknowledgmentStep` into the App shell's startup sequence, shown before `MorningCheckin` whenever a missed check-in is detected in `src/App.tsx` (depends on T033, T035, T030)

**Checkpoint**: All three user stories are independently functional — the full spec (FR-001–FR-014) is implemented.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T037 [P] Apply consistent dark-theme spacing/typography across `MainScreen`, `MorningCheckin`, `NightCheckin`, and `AcknowledgmentStep` per constitution UX Consistency in `src/components/*.tsx`
- [ ] T038 [P] Add a loading state for the initial IndexedDB read on app start in `src/App.tsx`
- [ ] T039 Build a first-run API key prompt per contracts/ai-generation.md "API key" behavior in `src/components/ApiKeyPrompt.tsx` (depends on T011)
- [ ] T040 [P] Verify the production build is a static-assets-only bundle of reasonable size (constitution Performance Requirements) by running `npm run build`
- [ ] T041 Run quickstart.md Scenarios 1–3 and the Edge Case spot checks manually in a browser (constitution Testing Standards floor)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational only
- **User Story 2 (Phase 4)**: Depends on Foundational only for its tests/logic (T023–T028 can start in parallel with Phase 3); the final wiring task T030 depends on US1's T022 since both edit `src/App.tsx`
- **User Story 3 (Phase 5)**: Depends on Foundational only for its tests/logic (T031–T035 can start in parallel with Phases 3–4); the final wiring task T036 depends on US2's T030 since both edit `src/App.tsx`
- **Polish (Phase 6)**: Depends on all three user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: No dependency on other stories — the MVP.
- **User Story 2 (P2)**: Logic and components are independently buildable/testable against seeded data; only the last integration task shares a file with US1.
- **User Story 3 (P3)**: Logic and components are independently buildable/testable; only the last integration task shares a file with US2.

### Within Each User Story

- Tests are written alongside/before their corresponding implementation tasks
- Pure logic (`lib/`, `storage/`, `ai/`) before components
- Components before App-shell wiring
- Story complete and checkpointed before the next priority's wiring task lands

### Parallel Opportunities

- All Setup tasks marked [P] (T002–T005) can run in parallel after T001
- Foundational tasks marked [P] (T007, T009, T010, T013) can run in parallel where their dependencies are met
- Once Foundational completes, the three stories' test/logic/component tasks (everything except the `App.tsx` wiring tasks T022, T030, T036) can proceed in parallel
- All tests within a story marked [P] can run in parallel with each other

---

## Parallel Example: User Story 1

```bash
# Launch US1 tests together:
Task: "Unit test for check-in state machine transitions in tests/unit/checkinStateMachine.test.ts"
Task: "Component test for morning check-in flow in tests/components/MorningCheckin.test.tsx"
Task: "Component test for night check-in flow in tests/components/NightCheckin.test.tsx"

# Launch US1 components together once T017/T018 are done:
Task: "Build MorningCheckin component in src/components/MorningCheckin.tsx"
Task: "Build NightCheckin component in src/components/NightCheckin.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: run quickstart.md Scenario 1 in the browser
5. Deploy/demo if ready — this alone delivers the app's core value

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. Add User Story 1 → validate via quickstart.md Scenario 1 → MVP
3. Add User Story 2 → validate via quickstart.md Scenario 2 → streak + history visible
4. Add User Story 3 → validate via quickstart.md Scenario 3 → full spec complete
5. Phase 6 polish → run full quickstart.md pass including Edge Case spot checks

---

## Notes

- [P] tasks touch different files and have no unmet dependencies
- [Story] label maps each task to its user story for traceability
- `src/App.tsx` is intentionally the one file touched sequentially across Foundational (T012) and each story's wiring task (T022, T030, T036) — do not parallelize those four tasks
- Commit after each task or logical group
- Stop at any checkpoint to validate a story independently before moving on
