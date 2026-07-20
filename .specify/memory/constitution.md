<!--
Sync Impact Report
- Version change: 1.0.0 → 1.1.0
- Modified principles: None; new principles added for code quality, testing, UX, and performance
- Added sections: None
- Removed sections: None
- Templates requiring updates: [.specify/templates/plan-template.md](.specify/templates/plan-template.md) ⚠ pending, [.specify/templates/spec-template.md](.specify/templates/spec-template.md) ⚠ pending, [.specify/templates/tasks-template.md](.specify/templates/tasks-template.md) ⚠ pending
- Follow-up TODOs: None
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
Use plain HTML, CSS, and JavaScript first. Introduce a framework or build tooling only when the scope clearly requires it. The site must remain deployable as a static web app with no server-side runtime dependency.

## Development Workflow
Changes must be reviewed for code quality, test coverage, UX consistency, and performance impact. Before merge, the app must be verified in a browser and checked for broken links, missing assets, and obvious regressions.

## Governance
This constitution supersedes ad-hoc shortcuts for this project. Any exception to these principles requires explicit documentation, a clear reason, and a mitigation plan. Amendments must be recorded with a version bump and a dated change log.

**Version**: 1.1.0 | **Ratified**: 2026-07-20 | **Last Amended**: 2026-07-20
