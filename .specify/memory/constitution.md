<!--
Sync Impact Report
- Version change: 1.1.0 → 1.2.0
- Modified principles: None (Core Principles I-IV unchanged)
- Modified sections: Technical Constraints — replaced the unconditional "plain HTML/CSS/JS first" default
  with explicit criteria for when a component framework/build tooling is warranted (multi-view UIs,
  non-trivial client-side state such as state machines, async data loading, or mid-flow resume).
  Motivated by /speckit-analyze flagging the Dailyman feature's React/Vite stack as a constitution
  conflict (specs/001-dailyman-app/plan.md Constitution Check) despite a documented Complexity Tracking
  justification — this amendment resolves that conflict prospectively for this and future features
  rather than leaving it as a one-off exception.
- Added sections: None
- Removed sections: None
- Templates requiring updates: [.specify/templates/plan-template.md](.specify/templates/plan-template.md) ✅ no change needed (gates derive from constitution dynamically), [.specify/templates/spec-template.md](.specify/templates/spec-template.md) ✅ no change needed, [.specify/templates/tasks-template.md](.specify/templates/tasks-template.md) ✅ no change needed
- Follow-up TODOs: specs/001-dailyman-app/plan.md's Constitution Check table should be updated to reflect this amendment (tracked as a manual follow-up, not auto-edited by this command)
-->

# Static Web App Constitution

## Core Principles

### I. Code Quality First
All code must be clear, readable, and maintainable. Functions, styles, and markup must be organized in a way that makes intent obvious, avoids duplication, and follows consistent naming and structure.

### II. Testing Standards
Changes to behavior, layout, or content must be validated before release. At minimum, every meaningful change requires a manual browser check, and automated tests must be added when the change affects reusable logic or recurring user flows.

### III. User Experience Consistency
The interface must feel cohesive across pages and interactions. Shared patterns for spacing, typography, navigation, components, and feedback states must be used consistently to reduce confusion and improve trust.

### IV. Performance Requirements
Pages must remain fast, lightweight, and resilient under normal usage. Asset sizes should be kept reasonable, unnecessary scripts should be avoided, and core content must remain usable even when network conditions are limited.

## Technical Constraints
Choose the simplest stack that fits the feature's actual complexity. Plain HTML, CSS, and JavaScript remain
the default for content-focused pages and simple interactions. A component framework and build tooling
(e.g., React with Vite) are warranted when a feature involves multiple interdependent views, non-trivial
client-side state (state machines, async data loading, mid-flow resume), or comparable complexity that
hand-written script would otherwise have to reimplement. Whichever stack is chosen, the site must remain
deployable as a static web app with no server-side runtime dependency.

## Development Workflow
Changes must be reviewed for code quality, test coverage, UX consistency, and performance impact. Before merge, the app must be verified in a browser and checked for broken links, missing assets, and obvious regressions.

## Governance
This constitution supersedes ad-hoc shortcuts for this project. Any exception to these principles requires explicit documentation, a clear reason, and a mitigation plan. Amendments must be recorded with a version bump and a dated change log.

**Version**: 1.2.0 | **Ratified**: 2026-07-20 | **Last Amended**: 2026-07-20
