# Implementation Plan: Dailyman Daily Accountability Check-in

**Branch**: `001-dailyman-app` | **Date**: 2026-07-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-dailyman-app/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Dailyman is a single-page, single-user web app implementing a twice-daily accountability loop: a morning check-in that narrows a stated avoidance into a small commitment via one live AI-generated follow-up question, and a night check-in that closes the loop (learned/blocked) and updates a hard-reset streak. Technical approach (fully specified by the user's `/speckit-plan` input, confirmed non-conflicting with spec.md): React + Vite + TypeScript frontend, Tailwind CSS for a dark/minimal single-accent-color UI, IndexedDB (via `idb`) for local persistence of Daily Entries and in-progress flow state, and two direct client-side calls to the Anthropic Messages API for the only two points requiring genuine reactivity (FR-012). No backend server, database, or auth — see research.md for rationale and two flagged risks (API key exposure, framework-vs-constitution tension).

## Technical Context

**Language/Version**: TypeScript (ES2022 target) on Node.js 20+ for tooling

**Primary Dependencies**: React 18, Vite, Tailwind CSS, `idb`, `@anthropic-ai/sdk` (browser usage)

**Storage**: IndexedDB (via `idb`) — see data-model.md

**Testing**: Vitest + React Testing Library (unit/component), manual browser verification via quickstart.md (per constitution Testing Standards)

**Target Platform**: Modern evergreen browsers (desktop + mobile web), deployed as a static single-page app

**Project Type**: Single-page web application, frontend-only (no backend project)

**Performance Goals**: UI interactions <100ms; network-bound only at the two AI generation calls (target <15s with visible loading state, see contracts/ai-generation.md); meets SC-001 (<2 min morning flow) and SC-002 (<1 min night flow) as user-time budgets, not raw latency SLAs

**Constraints**: No server-side runtime (constitution Technical Constraints); must remain usable (main screen, history, past entries) with no network — only the two live-generation points require connectivity (spec Assumptions); Anthropic API key is user-supplied and stored locally, never bundled into source (research.md §4)

**Scale/Scope**: Single user; ~365 Daily Entries/year accumulating indefinitely in IndexedDB; UI surfaces a rolling 30-day window (spec Assumptions); 4 views (main screen, morning flow, night flow, acknowledgment step)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / Constraint | Status | Notes |
|---|---|---|
| I. Code Quality First | PASS | TypeScript + component structure (src/components, src/state, src/storage, src/ai, src/lib — see Project Structure) keeps intent obvious and avoids duplication; enforced via consistent naming per area. |
| II. Testing Standards | PASS | Vitest + RTL cover reusable/recurring logic (streak calc, heatmap projection, state machine — the recurring flows); quickstart.md is the manual-browser-check floor required for every scenario. |
| III. UX Consistency | PASS | Single Tailwind theme (dark, one accent color) shared across all 4 views; streak number is the consistent visual anchor per spec Assumptions. |
| IV. Performance Requirements | PASS (watch) | Vite production build is a static bundle with no unnecessary scripts beyond the chosen dependencies; core content (main screen, history) remains usable under limited/no network — only the two AI calls are network-dependent (research.md §5). Bundle size should be spot-checked during implementation, not re-litigated here. |
| Technical Constraints — component framework criteria (amended in constitution v1.2.0) | PASS | React is warranted per the amended Technical Constraints: the feature has multiple interdependent views and non-trivial client-side state (state machine, async data loading, mid-flow resume) per data-model.md. Previously tracked as a justified violation against the pre-amendment constraint; the constitution was updated via `/speckit-constitution` (v1.1.0 → v1.2.0) specifically to codify this criteria after `/speckit-analyze` flagged the mismatch, so this now passes outright rather than requiring a standing exception. |
| Technical Constraints — "deployable as a static web app, no server-side runtime dependency" | PASS | Vite build output is static assets; the app calls an external third-party API directly from the client rather than running its own server. |

Re-checked post-Phase-1: data-model.md's state machine (7 in-progress steps, 3 terminal states per day, cross-day acknowledgment lookahead) and contracts/ai-generation.md's async error/retry handling confirm the framework choice remains warranted under the amended constitution — this is not incidental complexity, it is the feature's actual shape.

## Project Structure

### Documentation (this feature)

```text
specs/001-dailyman-app/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── ai-generation.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
dailyman/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/          # MainScreen, StreakCounter, Heatmap, MorningCheckin,
│   │                         # NightCheckin, AcknowledgmentStep
│   ├── state/                # check-in state machine (data-model.md transitions),
│   │                         # InProgressFlowState read/write hooks
│   ├── storage/               # idb wrapper: DailyEntry store, meta/settings store
│   ├── ai/                     # Anthropic client + the two generation functions
│   │                         # (contracts/ai-generation.md Call 1 and Call 2)
│   └── lib/                    # pure functions: streak computation (data-model.md),
│                             # heatmap projection, date utilities
└── tests/
    ├── unit/                 # streak calc, heatmap projection, state machine
    └── components/           # RTL: check-in flows, gating (FR-014), acknowledgment (FR-010)
```

**Structure Decision**: Single frontend-only project at the repository root (no `backend/` directory — there is no backend; the app calls the external Anthropic API directly per research.md §4). This is the "single project" shape adapted for a web SPA: `src/` split by responsibility (components / state / storage / ai / lib) rather than by MVC layer, since the four views map cleanly onto the state machine in data-model.md.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No unresolved violations. The React framework choice was originally tracked here as a justified violation of
the pre-amendment "plain HTML/CSS/JS first" constraint; constitution v1.2.0 (2026-07-20) codified the
underlying reasoning — multi-view UIs with non-trivial client-side state warrant a component framework — as
an explicit criterion in Technical Constraints, so this is now a straightforward PASS in the Constitution
Check above rather than a standing exception.
