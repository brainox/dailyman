# Phase 0 Research: Dailyman Daily Accountability Check-in

All Technical Context items were supplied directly by the user's `/speckit-plan` input. No `[NEEDS CLARIFICATION]` markers remain. This document records the rationale and alternatives for each decision, plus two risks the user's stack directions raised that the spec itself is silent on.

## 1. Frontend framework: React (Vite) + TypeScript

- **Decision**: React 18+ via Vite, written in TypeScript.
- **Rationale**: The app is a multi-view state machine (main screen, morning flow, night flow, acknowledgment step) with conditional rendering driven by persisted async state (IndexedDB reads) and live network calls. Component-local state + effects map directly onto the check-in flows; TypeScript gives the Daily Entry/Streak schema compile-time enforcement across the app.
- **Alternatives considered**: Plain HTML/CSS/JS (the constitution's stated default) — rejected because the state machine (5+ mutually exclusive screen states, async data loading, mid-flow resume) would require hand-rolling a view-diffing/state layer that a component framework provides for free. This is a documented constitution exception; see Constitution Check in plan.md.

## 2. Styling: Tailwind CSS

- **Decision**: Tailwind CSS utility classes, dark theme via a single CSS custom-property-driven accent color.
- **Rationale**: Fast to keep visually consistent (spacing/typography scale) across four distinct views without hand-writing a design system, satisfying the constitution's UX Consistency principle.
- **Alternatives considered**: Hand-written CSS — viable but slower to keep consistent across views for a single developer; rejected only on velocity grounds, not a hard blocker.

## 3. Persistence: IndexedDB via `idb`

- **Decision**: Use the `idb` package (thin Promise wrapper over the native IndexedDB API) with one object store for Daily Entries keyed by ISO date string, and a small settings/meta store for in-progress flow state.
- **Rationale**: Entries accumulate daily and the 30-day heatmap needs a range query (last 30 dates) — IndexedDB supports indexed range queries; `localStorage` would require manual JSON parse/stringify of a growing blob on every read/write, which doesn't scale well and has no query support.
- **Alternatives considered**: `localStorage` (rejected: no structured querying, full-blob rewrite cost); a remote database (rejected: spec Assumptions explicitly rule out a shared backend).

## 4. AI integration: direct client-side Anthropic Messages API calls

- **Decision**: Call the Anthropic Messages API (`claude-sonnet-4-6`) directly from the browser for exactly two generation points: the morning follow-up question (FR-002/FR-012) and the missed-check-in acknowledgment prompt (FR-010/FR-012). All streak math, entry state transitions, and heatmap rendering remain deterministic client code.
- **Rationale**: Matches FR-012's requirement that these two prompts be genuinely reactive to the user's actual input rather than scripted.
- **Risk flagged (not resolved by this plan)**: Calling the Anthropic API directly from a browser requires embedding or locally storing an API key that the client-side JavaScript can read, which means it is extractable by anyone with access to the browser/device. This is only acceptable because the spec's Assumptions confirm this is a **single-user, local-first, personal-use app** with no multi-user or public-deployment goal — the "attacker" and the key owner are the same person. Recommendation carried into data-model.md: the API key is supplied by the user at first run and stored in the same local IndexedDB store, never hardcoded into source or committed to the repo. If this app is ever exposed to other users or hosted publicly, this decision must be revisited (a server-side proxy would then be required).
- **Alternatives considered**: A minimal backend proxy to hide the API key — rejected per explicit user instruction ("no backend server... local-first, single-user app") and consistent with the constitution's "no server-side runtime dependency" constraint.

## 5. Network dependency / offline behavior

- **Decision**: The app requires network access at the two live-generation points (morning follow-up, missed-check-in acknowledgment). All other views (main screen, heatmap, viewing past entries) work fully offline since they only read persisted IndexedDB data.
- **Rationale**: Directly stated in spec Assumptions: "check-ins are not expected to be usable fully offline." A failed AI call must not block the rest of the app — surfaced as an inline retry-capable error state at the point of failure, not a full-screen blocker.
- **Alternatives considered**: Blocking the whole app on network failure — rejected, contradicts the spec's intent that only the two live-generation points require network.

## 6. Testing approach

- **Decision**: Vitest + React Testing Library for component/unit tests (state machine transitions, streak calculation, heatmap rendering); manual browser check for each user story's acceptance scenarios, per the constitution's Testing Standards principle.
- **Rationale**: Vitest integrates natively with the Vite toolchain already chosen; React Testing Library tests behavior (what the user sees/does) rather than implementation details, matching the acceptance-scenario style already used in spec.md.
- **Alternatives considered**: Playwright/Cypress end-to-end tests — deferred as out of scope for this plan (no non-goal was stated either way, but the constitution only requires "manual browser check" as the floor); may be added later if regressions in multi-day flows become hard to catch manually.

## Summary of resolved unknowns

| Item | Resolution |
|---|---|
| Language/Version | TypeScript (ES2022 target), Node 20+ for tooling |
| Primary Dependencies | React, Vite, Tailwind CSS, `idb`, `@anthropic-ai/sdk` (client-safe usage with `dangerouslyAllowBrowser: true`) |
| Storage | IndexedDB (via `idb`) |
| Testing | Vitest + React Testing Library; manual browser verification |
| Target Platform | Modern evergreen browsers (desktop + mobile web), single-page app |
| Project Type | Single-page web application (frontend-only, no backend) |
| Performance Goals | Meet SC-001/SC-002 (check-in flows under 2 min / 1 min of user time); UI interactions <100ms, network-bound only at the two AI calls |
| Constraints | No server-side runtime; must work with intermittent network (see §5); local-first storage |
| Scale/Scope | Single user, ~365 entries/year accumulating indefinitely, 30-day rolling view surfaced in UI |
