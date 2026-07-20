# Feature Specification: Dailyman Daily Accountability Check-in

**Feature Branch**: `001-dailyman-app`

**Created**: 2026-07-20

**Status**: Draft

**Input**: User description: "App: Dailyman — a two-check-in-a-day accountability loop tied to a running streak. Morning: the app asks what the user is avoiding today, the user answers, and the app responds with one sharpening follow-up question to shrink the task into something startable — this becomes the day's commitment. Night: the app asks if the user did it. If yes, it asks what they learned (closes the loop, banks the streak). If no, it asks what blocked them (no shame, just data). Streak counts consecutive days with both a completed morning and night check-in; a missed night check-in is acknowledged the next morning rather than silently resetting. Visual streak counter plus a 30-day calendar heatmap. Single user, no backend, local persistent storage. Look: dark, minimal, one accent color, big legible streak number, moody/serious tone rather than cheerful/gamified."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Morning commitment and night reflection loop (Priority: P1)

A user opens the app in the morning, states what they're avoiding today, receives one sharpening follow-up question, and ends up with a small, startable commitment for the day. Later that night, they return to report whether they did it, and answer a short closing question (what they learned, or what blocked them).

**Why this priority**: This is the atomic unit of the entire app — without the paired morning/night check-in, there is no product. It must work end-to-end before anything else matters.

**Independent Test**: Can be fully tested by completing one morning check-in and one night check-in in a single day and confirming both are recorded as a single daily entry — delivers the app's core value on its own, even without streaks or history.

**Acceptance Scenarios**:

1. **Given** the user has not checked in yet today, **When** they open the morning check-in and describe what they're avoiding, **Then** the app asks one follow-up question intended to narrow the task, and the user's resulting answer is saved as today's commitment.
2. **Given** the user has a commitment recorded for today and has not yet done their night check-in, **When** they open the night check-in and confirm they completed the commitment, **Then** the app asks what they learned and saves the response, marking today's entry complete.
3. **Given** the user has a commitment recorded for today and has not yet done their night check-in, **When** they open the night check-in and report they did not complete the commitment, **Then** the app asks what blocked them and saves the response, marking today's entry as incomplete without judgmental messaging.

---

### User Story 2 - Streak visibility and history (Priority: P2)

A user wants to see, at a glance, how many consecutive days they've completed both check-ins, and to spot patterns in when their streak breaks by viewing recent history.

**Why this priority**: Streak visibility is what turns the daily loop into an ongoing habit; it's the primary motivator for returning, but the app is still usable without it on day one.

**Independent Test**: Can be fully tested by completing check-ins across several simulated days and confirming the displayed streak number and history view match the actual completion pattern — delivers value independently of the AI-driven questioning behavior.

**Acceptance Scenarios**:

1. **Given** the user has completed both check-ins on each of the last N consecutive days, **When** they view the main screen, **Then** the streak counter displays N.
2. **Given** the user missed a full day's pair of check-ins, **When** they view the main screen, **Then** the streak counter reflects the break rather than continuing to count through the gap.
3. **Given** the user has at least one day of history, **When** they view the calendar heatmap, **Then** the last 30 days are shown with a visual distinction between completed, incomplete, and no-entry days.

---

### User Story 3 - Missed check-in acknowledgment (Priority: P3)

A user who skipped their night check-in returns the next morning and, before starting a new commitment, is asked what happened the previous night — turning the break into a recorded data point instead of a silent reset.

**Why this priority**: This softens the accountability loop and is core to the app's non-punitive tone, but the app functions without it — a user could still see their streak break even without an explicit acknowledgment prompt.

**Independent Test**: Can be fully tested by skipping a night check-in and then opening the app the next morning, confirming the acknowledgment prompt appears before the new day's commitment flow — delivers value independently of streak-display work.

**Acceptance Scenarios**:

1. **Given** the user completed a morning check-in yesterday but never completed the matching night check-in, **When** they open the app this morning, **Then** the app asks what happened before presenting the new day's "what are you avoiding" prompt.
2. **Given** the user completed both check-ins yesterday, **When** they open the app this morning, **Then** the app proceeds directly to the new day's commitment prompt with no acknowledgment step.

### Edge Cases

- What happens when the user completes the morning check-in but never returns for the night check-in that same day?
- What happens when the user reopens the app after partially completing a check-in (e.g., mid-follow-up)? Does it resume where they left off?
- What happens if the user attempts a second morning check-in or a second night check-in on a day where one is already recorded?
- What happens on the very first day, before any streak or history exists?
- How does the system behave if the user does a night check-in on a day with no recorded morning commitment?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow the user to start one morning check-in per day, prompting them to describe what they are avoiding.
- **FR-002**: The system MUST respond to the user's morning answer with exactly one follow-up question intended to narrow the stated task into a small, startable commitment.
- **FR-003**: The system MUST record the user's response to the follow-up question as that day's commitment.
- **FR-004**: The system MUST allow the user to start one night check-in per day, asking whether they completed that day's commitment.
- **FR-005**: When the user reports they completed the commitment, the system MUST ask what they learned and record the response, and MUST count that day toward the streak.
- **FR-006**: When the user reports they did not complete the commitment, the system MUST ask what blocked them, record the response neutrally (no shaming language), and MUST NOT count that day toward the streak.
- **FR-007**: The system MUST maintain a streak count representing the number of consecutive days with both a completed morning and a completed night check-in.
- **FR-008**: The system MUST display the current streak count prominently as the primary visual element of the main screen.
- **FR-009**: The system MUST display a calendar-style view of the last 30 days, visually distinguishing completed days, incomplete days, and days with no entry.
- **FR-010**: When the user opens the app for a new morning check-in and the previous day's night check-in was never completed, the system MUST first ask what happened before presenting the new commitment prompt.
- **FR-011**: The system MUST persist all daily entries (commitment, follow-up response, completion status, reflection or blocker) across app restarts and sessions without requiring an account or login.
- **FR-012**: The system MUST generate the morning follow-up question and the missed-check-in acknowledgment prompt live, in real time, based on the user's actual input for that check-in — not from a fixed, repeating script or pre-written question bank.
- **FR-013**: A single missed check-in (morning or night) MUST reset the streak to zero immediately; there is no grace allowance.
- **FR-014**: The night check-in MUST be unavailable until the user has completed that day's morning check-in; if no commitment exists for the day, the system MUST direct the user to complete the morning check-in first rather than allowing a night check-in or recording an automatic outcome.

### Key Entities

- **Daily Entry**: Represents one day's check-in pair. Attributes: date, commitment text, morning follow-up question and response, completion status (complete/incomplete/no entry), reflection text (when completed) or blocker text (when not completed), timestamps for morning and night check-in.
- **Streak**: A derived value representing the count of consecutive qualifying Daily Entries. Attributes: current streak length, date the current streak began.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can complete a full morning check-in (state what they're avoiding, receive the follow-up, land on a commitment) in under 2 minutes.
- **SC-002**: A user can complete a full night check-in (report the outcome, answer the closing question) in under 1 minute.
- **SC-003**: A user can see their current streak and their last 30 days of history without navigating away from the main screen.
- **SC-004**: 100% of completed daily entries remain available and correctly displayed after closing and reopening the app.
- **SC-005**: Every missed night check-in is followed by an acknowledgment prompt the next time the user opens the app, with zero silent streak resets.

## Assumptions

- This is a single-user application: no accounts, login, or multi-device sync are required for v1.
- The app runs entirely on the user's device with local persistent storage; there is no shared backend across multiple users.
- "Today" and "the last 30 days" are determined by the user's local device date/time.
- Visual tone is dark and minimal with a single accent color and a large, legible streak number as the primary visual anchor — not a badge/confetti-style gamified interface.
- A 30-day rolling view is sufficient history depth for v1; longer-term history (e.g., full year) is out of scope.
- Generating follow-up and acknowledgment prompts live requires the app to have network access at check-in time; check-ins are not expected to be usable fully offline.
