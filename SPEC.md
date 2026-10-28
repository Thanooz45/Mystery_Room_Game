# AI MYSTERY ROOM
## Spec-Driven Development (SDD) — Master Specification

**Document Type:** Product Requirements + Technical Specification  
**Version:** 1.0  
**Status:** Implementation Baseline  
**Project:** AI Mystery Room  
**Architecture:** MERN Stack + Google Gemini  
**Primary Objective:** Transform user-submitted stories into interactive, AI-generated mystery investigations.

---

# 1. DOCUMENT PURPOSE

This document is the single source of truth for the design, development, testing, and deployment of AI Mystery Room.

All developers and AI coding agents, including Codex, MUST follow this specification.

The specification defines:
- What the application must do.
- How the frontend and backend interact.
- How AI-generated mysteries are created and validated.
- How evidence is represented and presented.
- How the culprit is determined and revealed.
- How application data is stored.
- How security, reliability, and privacy are maintained.
- How features are tested and accepted.

### 1.1 Source-of-Truth Rules

1. This specification takes precedence over assumptions made by an AI coding agent.
2. Do not introduce features that conflict with the defined product scope.
3. Do not silently change API contracts, database schemas, or core business rules.
4. Keep frontend and backend behavior consistent with this document.
5. Validate all AI-generated content before persisting or displaying it.
6. Never trust client-side values for authorization, scoring, or culprit verification.
7. Do not expose Gemini API keys, hidden solutions, or private investigation data to unauthorized clients.
8. If implementation details are unspecified, choose the simplest secure and maintainable solution that preserves the product vision.
9. Update this specification when an approved architectural or behavioral change is made.
10. All implemented features must satisfy their corresponding acceptance criteria.
11. The submission rubric in Section 1.2 is mandatory and takes precedence over generic or future-extension language elsewhere in this document.

## 1.2 Submission Rubric Requirements

The following requirements define the required playable mystery and deployment deliverable:

### Difficulty content

| Difficulty | Suspects | Evidence clues | Hints | Correct accusation base |
|---|---:|---:|---:|---:|
| Easy | 3 | 5 | 2 | 100 |
| Medium | 4 | 7 | 3 | 150 |
| Hard | 5 | 9 | 3 | 200 |

Evidence artifacts are the clues counted for these limits. The backend MUST validate the exact counts in Gemini output before marking a case ready. Hints MUST be progressively useful without revealing the culprit or private solution. Unrequested hints and the solution MUST stay private on the backend.

### Scoring

- Correct accusation: difficulty base shown above.
- Each evidence clue discovered through the authenticated discovery endpoint: +5 points.
- Each hint requested: −10 points.
- Incorrect accusations receive no correct-accusation base.
- The final score MUST be calculated by the backend and MUST never fall below zero.
- The backend MUST record evidence discoveries and hint usage; it MUST NOT trust client-submitted counts or score values.

### Required game flow and acceptance

The deployed application MUST let an authenticated user create a case at every difficulty, wait for generation, inspect the case and suspects, discover clues, request available hints, accuse a suspect, and view the verdict, score, culprit, and explanation. The result endpoint MUST remain unavailable until the accusation is submitted. The user MUST be able to start another case afterward.

### Required API additions

- `POST /api/v1/cases/:caseId/evidence/:evidenceId/discover` records one valid evidence discovery for the case owner.
- `POST /api/v1/cases/:caseId/hints` returns only the next earned hint and records its scoring penalty.

The existing result response MUST include the backend-calculated total and its base, clue, and hint breakdown.

---

# 2. PRODUCT OVERVIEW

## 2.1 Product Vision

AI Mystery Room is an interactive mystery-solving platform where users become investigators in fictional cases generated from their own ideas.

A user submits a short story, scenario, or situation. The application transforms it into a structured investigation containing:

- A mystery title and introduction.
- A fictional crime or unexplained incident.
- A cast of suspects.
- Individual suspect profiles and alibis.
- Evidence collected from different fictional sources.
- Simulated WhatsApp-style conversations.
- AI-generated or simulated photographs.
- Simulated CCTV footage or CCTV-style scenes.
- Witness statements and investigation reports.
- Clues, contradictions, and red herrings.
- A concealed culprit and an explanation of the crime.

Users examine the evidence, compare suspect statements, identify contradictions, and submit their final accusation.

The application then evaluates their answer and reveals the case solution.

**Core experience: Give the user a story. Let AI build the case. Let the user solve it.**

## 2.2 Problem Statement

Traditional mystery games offer predetermined cases and limited replayability.

AI Mystery Room introduces a flexible investigation experience in which the initial scenario comes from the user and the resulting mystery is generated dynamically.

The challenge is to generate mysteries that are not only creative but also logically consistent, solvable, and supported by evidence.

## 2.3 Target Users

### Persona A: Casual Mystery Enthusiast
- Wants an entertaining detective experience.
- Prefers short investigations.
- Needs clear instructions and intuitive navigation.

### Persona B: Puzzle Solver
- Enjoys identifying contradictions and connecting clues.
- Wants several suspects and meaningful evidence.
- Expects a logically defensible solution.

### Persona C: Creative Storyteller
- Wants to turn original stories into interactive mysteries.
- Expects the AI to preserve the premise and tone of the submitted scenario.

### Persona D: Replay-Oriented User
- Wants to investigate different scenarios.
- Expects completed cases to remain accessible through investigation history.

---

# 3. PRODUCT GOALS AND NON-GOALS

## 3.1 Goals

G1. Allow users to submit a short story and generate a playable mystery.

G2. Generate a coherent case with a predetermined culprit, motive, method, timeline, suspects, and evidence.

G3. Provide multiple evidence formats that users can inspect interactively.

G4. Ensure that the mystery is solvable using information available to the player.

G5. Allow users to submit a culprit accusation and receive a result.

G6. Reveal a complete explanation after the investigation is finished.

G7. Persist investigations so users can resume them after refreshing or returning later.

G8. Provide a responsive, accessible interface across desktop, tablet, and mobile.

G9. Protect private solutions and API credentials.

G10. Make AI-generated content sufficiently structured to support automated validation and predictable rendering.

## 3.2 Non-Goals for Version 1

The following are explicitly outside the initial release:

- Real-world criminal investigations.
- Real police, law enforcement, or emergency-service integrations.
- Real WhatsApp account access or message retrieval.
- Real CCTV system integration.
- Uploading or processing actual surveillance footage as a core feature.
- Live multiplayer investigations.
- Public user-generated case marketplaces.
- User-created evidence editors.
- Payments, subscriptions, or in-game purchases.
- Voice-controlled investigation.
- Real-time AI-generated video streaming.
- A complex XP, ranking, or competitive leaderboard system.

These may be considered in future versions but must not delay the core investigation experience.

---

# 4. CORE PRODUCT PRINCIPLES

## 4.1 Every Mystery Must Have a Solution

The system must establish the culprit before presenting the investigation to the user.

The culprit cannot be selected randomly when the user submits an answer.

## 4.2 Evidence Must Support the Solution

Every decisive conclusion must be supported by evidence.

The user must be able to determine the culprit through reasonable deduction rather than guessing.

## 4.3 Red Herrings Must Be Fair

Red herrings may initially implicate innocent suspects, but they must have a logical explanation.

They must not contradict established facts without explanation.

## 4.4 AI Output Is Untrusted Input

Gemini-generated content must be treated as untrusted until validated.

The application must validate structure, references, required fields, evidence relationships, and solution consistency before making a case playable.

## 4.5 Simulated Evidence Must Be Clearly Identified

The platform must never imply that fictional conversations, images, recordings, or reports are authentic evidence from real people or actual investigations.

Every investigation must be clearly labeled as fictional.

## 4.6 Discovery Before Revelation

The application must not reveal the culprit or complete solution before the user submits an accusation or explicitly chooses to reveal the answer.

---

# 5. USER JOURNEYS

## 5.1 Journey A: Generate a Mystery

1. User opens the home page.
2. User selects **Create a Mystery**.
3. Application displays a scenario submission form.
4. User enters a short story or scenario.
5. User optionally selects difficulty, tone, and investigation length.
6. User submits the form.
7. Frontend validates the input.
8. Backend validates the request and applies rate limits.
9. Backend creates an investigation-generation job.
10. Gemini generates a structured mystery.
11. Backend validates the mystery and its internal references.
12. If necessary, the backend attempts a bounded repair or regeneration.
13. Backend stores the validated case and its private solution.
14. Frontend displays the investigation introduction.
15. User enters the investigation workspace.

**Expected outcome:** A playable mystery with a concealed solution and accessible evidence.

## 5.2 Journey B: Investigate a Case

1. User opens an investigation.
2. User reads the incident summary.
3. User reviews the suspect list.
4. User opens evidence files.
5. User examines messages, images, reports, or CCTV-style scenes.
6. User compares evidence with suspect statements.
7. User reviews the timeline.
8. User optionally records personal notes.
9. User returns to previously viewed evidence.
10. User selects the suspected culprit.
11. User confirms the accusation.
12. Backend evaluates the answer.
13. Application displays the result and solution explanation.

**Expected outcome:** The user completes the investigation and understands why the accusation is correct or incorrect.

## 5.3 Journey C: Resume an Investigation

1. User opens their investigation history.
2. Application lists saved cases.
3. User selects an active case.
4. Application retrieves the case's public investigation data and saved progress.
5. User continues investigating.

The application must not regenerate an existing case merely because the user refreshes the page.

## 5.4 Journey D: Review a Completed Case

1. User opens a completed investigation.
2. Application displays the final result.
3. User can inspect the solution explanation.
4. User can revisit the evidence.
5. User can return to the home page or start another case.

---

# 6. FUNCTIONAL REQUIREMENTS

Requirements are assigned identifiers to support implementation and testing.

## 6.1 Scenario Submission

**FR-001:** The application MUST provide a scenario submission form.

**FR-002:** The scenario MUST be between 50 and 3,000 characters after trimming whitespace.

**FR-003:** The form MUST reject empty submissions.

**FR-004:** The form MUST allow a difficulty selection:
- Easy
- Medium
- Hard

**FR-005:** The form MUST allow a tone selection:
- Classic Detective
- Psychological Mystery
- Thriller
- Lighthearted Mystery

**FR-006:** The form MUST allow an investigation-length selection:
- Short
- Standard
- Extended

**FR-007:** The application MUST provide sensible defaults.

Default configuration:
- Difficulty: Medium
- Tone: Classic Detective
- Length: Standard

**FR-008:** The application MUST show a loading state while a case is generated.

**FR-009:** Repeated submissions caused by double-clicking MUST NOT create duplicate generation jobs for the same idempotency key.

**FR-010:** The backend MUST reject oversized or invalid payloads.

## 6.2 Mystery Generation

**FR-011:** Each generated mystery MUST contain a title, premise, incident, setting, timeline, suspects, evidence, and private solution.

**FR-012:** The culprit MUST reference an existing suspect.

**FR-013:** Every evidence item MUST have a unique identifier within the case.

**FR-014:** Evidence references to suspects and events MUST be valid.

**FR-015:** The mystery MUST contain at least two plausible suspects.

**FR-016:** The standard mystery MUST contain at least four evidence items.

**FR-017:** The system MUST support multiple evidence categories.

**FR-018:** The solution MUST explain how the decisive clues establish the culprit.

**FR-019:** A generated case MUST NOT become playable until validation succeeds.

**FR-020:** The system MUST fail gracefully if the AI cannot produce a valid case within the configured retry limit.

## 6.3 Investigation Workspace

**FR-021:** The application MUST display the case title and incident summary.

**FR-022:** The application MUST display the suspect list.

**FR-023:** The application MUST provide an evidence collection interface.

**FR-024:** The user MUST be able to open and close evidence details.

**FR-025:** The user MUST be able to filter evidence by category.

**FR-026:** The application MUST display timestamps where relevant.

**FR-027:** The application MUST support reviewing evidence multiple times.

**FR-028:** The application MUST distinguish confirmed facts from suspect claims and unresolved questions.

**FR-029:** The user SHOULD be able to record private investigation notes.

**FR-030:** Evidence inspection MUST NOT automatically reveal the private solution.

## 6.4 Accusation and Resolution

**FR-031:** The application MUST allow the user to select a suspect as the culprit.

**FR-032:** The user MUST explicitly confirm the final accusation.

**FR-033:** The backend MUST evaluate the accusation against the stored solution.

**FR-034:** The backend MUST prevent repeated submissions from creating duplicate completion records.

**FR-035:** The application MUST display whether the accusation was correct.

**FR-036:** The completed investigation MUST reveal the culprit, motive, method, timeline, and supporting evidence.

**FR-037:** The user MUST be able to revisit the completed case.

**FR-038:** The application MUST NOT accept accusations for cases that do not belong to the requesting user.

## 6.5 Persistence

**FR-039:** Investigations MUST be stored in MongoDB.

**FR-040:** Investigation progress MUST survive browser refreshes.

**FR-041:** Completed cases MUST remain available in the user's history.

**FR-042:** The system MUST distinguish active, generating, failed, and completed cases.

**FR-043:** The application MUST preserve the generated mystery instead of silently replacing it during subsequent visits.

---

# 7. INFORMATION ARCHITECTURE AND PAGES

## 7.1 Home Page — `/`

Purpose: Introduce the product and initiate mystery creation.

Required elements:
- Product logo and navigation.
- Hero heading.
- Short product description.
- Primary CTA: Create a Mystery.
- Example evidence preview.
- Short explanation of how the experience works.
- Fictional-content disclaimer.
- Footer.

Primary interaction:
Clicking **Create a Mystery** navigates to `/create`.

## 7.2 Create Mystery Page — `/create`

Required elements:
- Scenario textarea.
- Character counter.
- Difficulty selector.
- Tone selector.
- Length selector.
- Generate Mystery button.
- Inline validation messages.
- Loading and error states.

States:
- Empty form.
- Valid input.
- Invalid input.
- Submitting.
- Generation queued.
- Generation failed.
- Generation succeeded.

## 7.3 Generation Status Page — `/cases/:caseId/generating`

Purpose: Communicate progress during generation.

Required elements:
- Loading indicator.
- Progress messages.
- Case title when available.
- Retry guidance when generation fails.

The frontend MUST NOT invent progress percentages unless the backend provides meaningful progress information.

## 7.4 Investigation Page — `/cases/:caseId`

Required layout:

**Header**
- Case title.
- Case status.
- Back-to-history navigation.

**Main workspace**
- Incident summary.
- Suspect panel.
- Evidence collection.
- Investigation timeline.
- Optional notes panel.

**Evidence detail panel**
- Evidence title.
- Evidence type.
- Source label.
- Timestamp.
- Evidence content.
- Associated suspects.
- Associated events.
- Fictional-content label.

**Accusation panel**
- Suspect selection.
- Confirmation action.
- Validation messages.

On smaller screens, the layout MUST collapse into a single-column interface.

## 7.5 Results Page — `/cases/:caseId/result`

Required elements:
- Correct or incorrect result.
- Revealed culprit.
- Motive.
- Method.
- Chronological explanation.
- Decisive clues.
- Explanation of misleading evidence.
- Return-to-case action.
- Create-another-mystery action.

The backend MUST enforce completion authorization before returning private solution data.

## 7.6 Investigation History — `/history`

Required elements:
- List of the user's cases.
- Case title.
- Difficulty.
- Creation date.
- Status.
- Continue Investigation or View Results action.

Empty state:
Explain that the user has not created any investigations yet and provide a Create a Mystery CTA.

## 7.7 Not Found — `*`

Display a clear not-found message and a link to the home page.

## 7.8 Loading and Error States

Every page that depends on network requests MUST support:
- Loading state.
- Empty state where applicable.
- Error state.
- Retry action where appropriate.
- Unauthorized state.
- Not-found state.

Never display raw server stack traces or Gemini error messages to the user.

---

# 8. UI AND EXPERIENCE REQUIREMENTS

## 8.1 Visual Direction

The application SHOULD feel like a premium digital detective workspace.

Recommended design:
- Dark charcoal or deep navy backgrounds.
- Muted neutral surfaces.
- Restrained amber or red accents.
- Clear typography.
- Evidence cards resembling organized investigation files.
- Strong visual distinction between suspects, evidence, and conclusions.
- Subtle transitions.
- Minimal decorative animation.

The visual design must support investigation rather than distract from it.

## 8.2 Core Components

Implement reusable React components for:
- `Navbar`
- `HeroSection`
- `ScenarioForm`
- `DifficultySelector`
- `GenerationStatus`
- `CaseHeader`
- `IncidentSummary`
- `SuspectList`
- `SuspectCard`
- `EvidenceList`
- `EvidenceCard`
- `EvidenceDetailModal`
- `InvestigationTimeline`
- `InvestigationNotes`
- `AccusationPanel`
- `ResultSummary`
- `EmptyState`
- `ErrorState`
- `LoadingSkeleton`
- `ConfirmDialog`

Components MUST have clear responsibilities and MUST NOT contain duplicated API business logic.

## 8.3 Responsive Behavior

Breakpoints may follow these defaults:
- Mobile: below 640px.
- Tablet: 640–1023px.
- Desktop: 1024px and above.

Requirements:
- No horizontal overflow.
- Touch targets SHOULD be at least 44 × 44 CSS pixels.
- Dialogs MUST fit within the viewport.
- Long evidence content MUST wrap safely.
- Images MUST scale responsively.
- Navigation MUST remain usable on mobile.

## 8.4 Accessibility

Target WCAG 2.2 AA where practical.

Requirements:
- Semantic HTML.
- Keyboard-accessible controls.
- Visible focus indicators.
- Appropriate text contrast.
- Accessible form labels.
- Error messages associated with inputs.
- Meaningful alternative text for images.
- Keyboard-operable dialogs.
- Focus restoration after closing dialogs.
- Reduced-motion support.
- Status announcements for asynchronous operations.

Do not communicate correctness or evidence status through color alone.

---

# 9. MYSTERY GENERATION PIPELINE

## 9.1 Architecture

The generation pipeline MUST run on the backend.

```text
User submits scenario
        |
        v
React scenario form
        |
        v
POST /api/v1/cases
        |
        v
Express request validation
        |
        v
Authentication / rate limiting
        |
        v
Create case record
(status = generating)
        |
        v
Build constrained Gemini prompt
        |
        v
Gemini structured generation
        |
        v
Parse and validate output
        |
        +---- Invalid ----> Bounded repair / retry
        |                         |
        |                         v
        |                  Validation failure
        |                         |
        |                         v
        |                    status = failed
        |
        v
Validate mystery logic
        |
        v
Store public case and private solution
        |
        v
status = ready
        |
        v
Frontend opens investigation
```

## 9.2 Generation Stages

### Stage 1: Input Normalization

The backend MUST:
- Trim whitespace.
- Validate the scenario length.
- Normalize difficulty, tone, and length.
- Reject invalid enum values.
- Preserve the user's original premise where possible.
- Treat the submitted story as untrusted content.

### Stage 2: Generation Planning

Gemini MUST determine:
- The incident.
- The actual sequence of events.
- The culprit.
- The motive.
- The method.
- The suspects.
- The timeline.
- The decisive evidence.
- The red herrings.
- The final explanation.

The actual solution must be established before evidence is authored.

### Stage 3: Suspect Construction

Each suspect MUST have:
- Unique ID.
- Name.
- Role.
- Relationship to the incident.
- Publicly presented background.
- Alibi.
- Initial suspicion level.
- Relevant knowledge.
- A reason the investigator might suspect them.

Every suspect must be meaningfully distinguishable from the others.

### Stage 4: Timeline Construction

The system MUST construct a consistent chronological sequence.

Timeline events SHOULD identify:
- Event ID.
- Timestamp.
- Description.
- Related suspects.
- Related evidence.
- Whether the event is an established fact or an unverified claim.

### Stage 5: Evidence Construction

Evidence MUST be generated against the established timeline and solution.

Every decisive clue must have a clear logical relationship to the culprit or the sequence of events.

### Stage 6: Consistency Validation

The backend MUST check:
- Schema validity.
- Unique identifiers.
- Valid cross-references.
- Timeline consistency.
- Culprit existence.
- Evidence sufficiency.
- Solution-to-evidence consistency.
- Presence of meaningful suspects.
- Absence of unauthorized real-person impersonation.
- Absence of unsafe or deceptive evidence presentation.

### Stage 7: Publication

Only a successfully validated mystery may enter the `ready` state.

The backend MUST store:
- Public investigation data.
- Private solution data.
- Generation metadata.
- Schema version.
- Validation results.

The frontend MUST receive only the public investigation projection until the case is completed.

## 9.3 Difficulty Rules

### Easy
- Exactly 3 suspects, 5 evidence clues, and 2 hints.
- Correct-accusation base score: 100 points.
- Obvious but nontrivial contradictions.
- Minimal red herrings.

### Medium
- Exactly 4 suspects, 7 evidence clues, and 3 hints.
- Correct-accusation base score: 150 points.
- Multiple plausible motives.
- At least two useful contradictions or corroborating clues.
- One or more explainable red herrings.

### Hard
- Exactly 5 suspects, 9 evidence clues, and 3 hints.
- Correct-accusation base score: 200 points.
- Interconnected evidence.
- More subtle contradictions.
- Multiple deductions required to identify the culprit.

These counts are mandatory, not targets. The backend MUST reject generated output that does not match the selected difficulty exactly.

## 9.4 Investigation Length

- Short: compact narrative and concise descriptions.
- Standard: balanced narrative and evidence descriptions.
- Extended: richer narrative and more interconnected timeline details.

All lengths MUST preserve the exact suspect, clue, and hint counts for the selected difficulty.

## 9.5 Retry Strategy

Recommended defaults:
- Maximum initial generation attempts: 1.
- Maximum repair attempts: 1.
- Maximum total Gemini generation calls per case: 2.
- Per-request generation timeout: configurable.
- Maximum total generation duration: configurable.

If validation fails after the retry budget is exhausted:
- Set the case status to `failed`.
- Store a safe error code.
- Log diagnostic details server-side.
- Do not expose a partial mystery as playable.

---

# 10. GEMINI INTEGRATION

## 10.1 Integration Rules

Use the official Google GenAI SDK supported by the installed Node.js environment.

The implementation MUST:
- Keep the Gemini API key on the server.
- Read the key from environment variables.
- Request structured JSON output when supported by the selected model.
- Validate output using a server-side schema.
- Avoid relying on prompt instructions as the only validation mechanism.
- Pin or explicitly configure the model name.
- Log model and schema versions.
- Handle quota, timeout, malformed-output, and safety errors.
- Avoid logging API keys or unnecessary raw user content.

## 10.2 Structured Output Contract

The model MUST produce a single structured object with the following conceptual shape:

```json
{
  "schemaVersion": "1.0",
  "title": "The Last Message",
  "difficulty": "medium",
  "tone": "classic_detective",
  "length": "standard",
  "premise": "A fictional mystery based on the submitted scenario.",
  "incident": {
    "summary": "A valuable prototype disappeared from a locked office.",
    "location": "Northbridge Research Lab",
    "discoveredAt": "2026-10-20T09:00:00Z",
    "incidentType": "theft"
  },
  "suspects": [
    {
      "id": "suspect_01",
      "name": "Alex Morgan",
      "role": "Research Assistant",
      "background": "Worked in the lab during the previous evening.",
      "motive": "Wanted recognition for an unfinished project.",
      "alibi": {
        "statement": "Claims to have left at 18:00.",
        "verified": false
      },
      "initialSuspicion": "medium"
    }
  ],
  "timeline": [
    {
      "id": "event_01",
      "timestamp": "2026-10-20T17:30:00Z",
      "description": "The prototype was last confirmed inside the office.",
      "suspectIds": ["suspect_01"],
      "evidenceIds": ["evidence_01"],
      "eventType": "observed_fact"
    }
  ],
  "evidence": [
    {
      "id": "evidence_01",
      "title": "Conversation Excerpt",
      "type": "chat",
      "category": "digital",
      "description": "A simulated fictional conversation.",
      "createdAt": "2026-10-20T18:15:00Z",
      "sourceLabel": "Fictional simulated chat",
      "suspectIds": ["suspect_01"],
      "timelineEventIds": ["event_01"],
      "content": {
        "messages": [
          {
            "sender": "Alex",
            "timestamp": "2026-10-20T18:15:00Z",
            "text": "I thought the office was already locked."
          }
        ]
      },
      "clueRole": "corroborating",
      "fictional": true
    }
  ],
  "solution": {
    "culpritId": "suspect_01",
    "motive": "The culprit wanted to conceal unauthorized work.",
    "method": "The culprit used a previously issued access card.",
    "chronology": [
      {
        "timestamp": "2026-10-20T17:30:00Z",
        "description": "The culprit entered the office."
      }
    ],
    "decisiveEvidenceIds": ["evidence_01"],
    "reasoning": "The combined evidence establishes the culprit.",
    "redHerringExplanations": [
      {
        "evidenceId": "evidence_02",
        "explanation": "The evidence initially suggests another suspect but has an innocent explanation."
      }
    ]
  }
}
```

**Important:** This is an illustrative shape, not a hardcoded mystery. The actual schema MUST include all fields and constraints required by the implementation.

The sample values MUST NOT be treated as universal requirements.

## 10.3 Canonical Enums

Difficulty:
- `easy`
- `medium`
- `hard`

Tone:
- `classic_detective`
- `psychological_mystery`
- `thriller`
- `lighthearted`

Length:
- `short`
- `standard`
- `extended`

Evidence type:
- `chat`
- `image`
- `cctv`
- `document`
- `witness_statement`
- `forensic_report`

Clue role:
- `decisive`
- `corroborating`
- `red_herring`
- `contextual`

Timeline event type:
- `observed_fact`
- `suspect_claim`
- `inferred_event`

All enum values MUST be validated by the backend.

## 10.4 Output Validation

Use a runtime schema-validation library such as Zod.

Validation MUST include:
- Required fields.
- String length limits.
- Array length limits.
- Enum validation.
- Date parsing.
- Unique IDs.
- Reference integrity.
- Valid culprit reference.
- Valid evidence references.
- Correct evidence content shape.
- Maximum total payload size.
- Solution/evidence consistency checks.

The application MUST reject unexpected fields where appropriate and MUST NOT assume Gemini always returns valid JSON.

## 10.5 Separating Public and Private Output

The generated result MUST be separated before persistence or response serialization.

Recommended internal representation:

```text
GeneratedMystery
    |
    +-- publicCase
    |      |
    |      +-- title
    |      +-- premise
    |      +-- incident
    |      +-- suspects
    |      +-- timeline
    |      +-- evidence
    |
    +-- privateSolution
           |
           +-- culpritId
           +-- motive
           +-- method
           +-- chronology
           +-- decisiveEvidenceIds
           +-- reasoning
           +-- redHerringExplanations
```

The private solution MUST NEVER be embedded in a public API response.

---

# 11. EVIDENCE ARTIFACT SYSTEM

## 11.1 Supported Evidence Types

### A. Simulated Chat Messages

Display:
- Fictional conversation participants.
- Message text.
- Timestamps.
- Optional delivery/read indicators.
- Relevant message context.

Rules:
- Use fictional identities.
- Do not connect to real messaging accounts.
- Do not imply messages were retrieved from an actual phone.
- Label the artifact as simulated.

### B. AI-Generated Images

Examples:
- A fictional room.
- A missing object.
- A scene associated with the incident.
- A simulated photograph of an item.

Rules:
- Use an image-generation provider only when configured.
- Store generated image files or provider references through a controlled storage layer.
- Never assume a model-generated image URL is permanent.
- Validate MIME type and file size.
- Provide alternative text.
- Label images as AI-generated or simulated.
- Do not present generated images as authentic forensic photographs.

If image generation is unavailable, the case MAY use a text-based scene description or a clearly labeled illustrative placeholder.

### C. Simulated CCTV

For Version 1, CCTV MUST be implemented as a simulated recording experience.

Supported representations:
- A sequence of fictional still frames.
- A timestamped event transcript.
- A sequence of scene descriptions.
- A simulated camera log.

Example:

```text
CAMERA 03 — EAST CORRIDOR

18:04:12 — A figure enters the corridor.
18:05:03 — The office door opens.
18:07:41 — The figure leaves carrying a rectangular object.

SIMULATED CCTV TRANSCRIPT
FICTIONAL INVESTIGATION — NOT REAL FOOTAGE
```

Actual video generation is optional and MUST NOT be a release dependency.

### D. Documents

Examples:
- Access logs.
- Inventory records.
- Fictional emails.
- Incident reports.
- Laboratory notes.

All documents MUST be fictional and labeled accordingly.

### E. Witness Statements

Statements MUST distinguish between:
- What a witness claims.
- What is independently corroborated.
- What remains uncertain.

A witness statement MUST NOT automatically be treated as an established fact.

## 11.2 Evidence Provenance

Each evidence item MUST include provenance metadata.

Minimum fields:

```json
{
  "provenance": {
    "origin": "ai_generated",
    "provider": "gemini",
    "model": "configured-model-name",
    "createdAt": "2026-10-25T00:00:00Z",
    "fictional": true,
    "displayLabel": "Fictional AI-generated evidence"
  }
}
```

Allowed origins:
- `ai_generated`
- `simulated`
- `template_generated`

Provenance MUST reflect the actual creation process.

If an image is generated by another provider, record that provider instead of claiming Gemini generated it.

## 11.3 Evidence Integrity Rules

1. Evidence IDs MUST be unique within a case.
2. Every referenced suspect MUST exist.
3. Every referenced timeline event MUST exist.
4. Evidence timestamps MUST be chronologically plausible.
5. Decisive clues MUST support the private solution.
6. Red herrings MUST have explicit explanations.
7. Evidence MUST NOT change after publication without an explicit versioned operation.
8. The frontend MUST render evidence according to its validated type.
9. Unknown evidence types MUST fail safely.
10. No evidence artifact may contain hidden solution data in client-visible metadata.

## 11.4 Optional Image Generation Architecture

If image generation is implemented:

```text
Mystery generation
        |
        v
Evidence identifies image requirement
        |
        v
Backend creates image-generation job
        |
        v
Image provider generates fictional image
        |
        v
Backend validates output
        |
        v
Controlled object storage
        |
        v
Evidence references stored asset
```

Image generation SHOULD be asynchronous and subject to its own rate limits.

The application MUST remain playable if image generation fails.

---

# 12. TECHNICAL ARCHITECTURE

## 12.1 Technology Stack

### Frontend
- React.
- Vite.
- JavaScript or TypeScript.
- React Router.
- Standard CSS or CSS modules.
- Fetch API or an established HTTP client.

### Backend
- Node.js.
- Express.
- JavaScript or TypeScript.
- MongoDB.
- Mongoose.
- Official Google GenAI SDK.
- Zod or equivalent runtime validation.

### Testing
- Vitest.
- React Testing Library.
- Supertest.
- Node.js test runner or Jest for backend tests, where appropriate.
- Playwright for end-to-end testing.

### Deployment
- Static frontend hosting.
- Node-compatible backend hosting.
- MongoDB Atlas or another managed MongoDB deployment.
- Optional object storage for generated images.

Versions MUST be selected from currently supported releases and pinned in lockfiles.

## 12.2 High-Level Architecture

```text
+---------------------------+
|       React Client        |
|                           |
| Home / Create / History   |
| Investigation / Results   |
+-------------+-------------+
              |
              | HTTPS / JSON
              v
+---------------------------+
|      Express API          |
|                           |
| Routes                    |
| Controllers               |
| Authentication            |
| Validation                |
| Services                  |
| Error handling            |
+-------------+-------------+
              |
       +------+------+
       |             |
       v             v
+-------------+ +----------------+
|  MongoDB    | | Gemini Service  |
|             | |                |
| Cases       | | Generation     |
| Users       | | Structured JSON|
| Progress    | | Validation     |
+-------------+ +----------------+
```

## 12.3 Suggested Repository Structure

```text
ai-mystery-room/
|
+-- client/
|   +-- src/
|       +-- api/
|       +-- assets/
|       +-- components/
|       +-- features/
|       |   +-- cases/
|       |   +-- evidence/
|       |   +-- investigation/
|       +-- hooks/
|       +-- layouts/
|       +-- pages/
|       +-- routes/
|       +-- styles/
|       +-- utils/
|       +-- App.jsx
|       +-- main.jsx
|
+-- server/
|   +-- src/
|       +-- config/
|       +-- controllers/
|       +-- middleware/
|       +-- models/
|       +-- routes/
|       +-- schemas/
|       +-- services/
|       |   +-- gemini/
|       |   +-- mystery/
|       |   +-- evidence/
|       +-- utils/
|       +-- app.js
|       +-- server.js
|   +-- tests/
|
+-- docs/
|   +-- SDD.md
|   +-- API.md
|   +-- ARCHITECTURE.md
|
+-- .gitignore
+-- README.md
```

The structure may be adapted to an existing repository, but responsibilities MUST remain clearly separated.

---

# 13. DATA MODELS

## 13.1 User Model

Authentication is required for persistent private investigations.

Fields:

```text
User
- _id
- email
- passwordHash
- displayName
- createdAt
- updatedAt
```

Rules:
- Email MUST be normalized.
- Passwords MUST be hashed using an established password-hashing library.
- Passwords MUST never be stored in plaintext.
- Secrets MUST never be returned in API responses.

Guest mode is not part of the initial implementation unless explicitly approved.

## 13.2 Case Model

```text
Case
- _id
- ownerId
- title
- scenario
- difficulty
- tone
- length
- status
- publicCase
- privateSolution
- schemaVersion
- generationMetadata
- validationMetadata
- createdAt
- updatedAt
- completedAt
```

Status values:

```text
generating
ready
completed
failed
```

Rules:
- `ownerId` MUST reference the owning user.
- `publicCase` MUST contain only player-visible data.
- `privateSolution` MUST be excluded from normal API serialization.
- `failed` cases MUST NOT be playable.
- `completedAt` MUST be populated only after successful completion.

## 13.3 Public Case Structure

```text
publicCase
- premise
- incident
- suspects[]
- timeline[]
- evidence[]
```

Public case data MUST NOT contain:
- Culprit identity.
- Private motive explanation.
- Hidden solution chronology.
- Private clue mapping.
- Internal generation prompts.
- Provider API credentials.
- Private validation diagnostics.

The fact that a user has completed a case does not authorize exposing the solution in unrelated API responses.

## 13.4 Private Solution Structure

```text
privateSolution
- culpritId
- motive
- method
- chronology[]
- decisiveEvidenceIds[]
- reasoning
- redHerringExplanations[]
```

The backend MUST store the solution independently from public case data.

## 13.5 Investigation Progress Model

```text
InvestigationProgress
- _id
- caseId
- userId
- viewedEvidenceIds[]
- notes
- selectedSuspectId
- status
- accusation
- result
- startedAt
- completedAt
- updatedAt
```

Rules:
- One progress record per user and case.
- Create a unique compound index on `{ userId, caseId }`.
- Validate every evidence and suspect ID against the associated case.
- The saved notes field MUST have a configured size limit.
- A user MUST NOT access another user's progress record.

## 13.6 Generation Metadata

```text
generationMetadata
- provider
- model
- promptVersion
- startedAt
- completedAt
- attemptCount
- generationDurationMs
```

Do not persist API keys or sensitive request headers.

## 13.7 Database Indexes

Minimum indexes:
- Unique user email.
- Cases by owner and creation date.
- Cases by owner and status.
- Unique progress record on `{ userId, caseId }`.

Add indexes for frequently queried fields after reviewing actual query patterns.

---

# 14. API CONTRACTS

Base path:

`/api/v1`

All request and response bodies MUST use JSON unless an endpoint explicitly supports another content type.

All protected endpoints MUST require valid authentication.

## 14.1 Authentication

### POST `/auth/register`

Request:

```json
{
  "displayName": "Alex",
  "email": "alex@example.com",
  "password": "example-password"
}
```

Behavior:
- Validate fields.
- Normalize email.
- Hash password.
- Create user.
- Return safe user information.
- Establish authentication according to the selected secure session strategy.

### POST `/auth/login`

Request:

```json
{
  "email": "alex@example.com",
  "password": "example-password"
}
```

Behavior:
- Validate credentials.
- Establish authentication.
- Return safe user information.

### POST `/auth/logout`

Behavior:
- Invalidate or clear the authentication session.

### GET `/auth/me`

Behavior:
- Return the authenticated user's safe profile.

## 14.2 Create a Case

### POST `/cases`

Authentication: Required.

Headers:

```text
Idempotency-Key: <unique-client-generated-key>
Content-Type: application/json
```

Request:

```json
{
  "scenario": "A prototype disappears from a locked laboratory.",
  "difficulty": "medium",
  "tone": "classic_detective",
  "length": "standard"
}
```

Response:

```json
{
  "caseId": "case_123",
  "status": "generating",
  "statusUrl": "/api/v1/cases/case_123/status"
}
```

Expected HTTP status: `202 Accepted`.

The case ID format in examples is illustrative. Use MongoDB IDs or another consistent internal identifier.

Behavior:
- Validate the request.
- Check authorization and rate limits.
- Apply idempotency.
- Create the generation record.
- Start the generation process.
- Return immediately rather than blocking for the entire generation duration.

## 14.3 Get Generation Status

### GET `/cases/:caseId/status`

Authentication: Required.

Response:

```json
{
  "caseId": "case_123",
  "status": "ready",
  "retryable": false
}
```

Allowed statuses:
- `generating`
- `ready`
- `completed`
- `failed`

For failures, return a safe error code.

## 14.4 Get a Case

### GET `/cases/:caseId`

Authentication: Required.

Returns:
- Case ID.
- Title.
- Difficulty.
- Tone.
- Length.
- Status.
- Public investigation data.
- Hints already earned by this user for this case only.
- Hint usage limit.
- Progress, including server-recorded discovered evidence and hints used.
- Creation and update timestamps.

The response MUST NOT include the private solution or unrequested hints.

## 14.5 List Cases

### GET `/cases?page=1&limit=10&status=ready`

Authentication: Required.

Returns:
- Paginated case summaries.
- Total count.
- Current page.
- Page size.

The backend MUST enforce ownership.

## 14.6 Save Progress

### PUT `/cases/:caseId/progress`

Authentication: Required.

Request:

```json
{
  "notes": "The timeline conflicts with the suspect's statement.",
  "selectedSuspectId": "suspect_02"
}
```

Behavior:
- Validate case ownership.
- Validate the selected suspect ID.
- Enforce notes length.
- Update progress.
- Do not accept client-submitted discovered evidence, hints used, or scores.
- Return saved progress without private solution fields.

### POST `/cases/:caseId/evidence/:evidenceId/discover`

Authentication: Required.

Records discovery of one evidence item after validating case ownership, active case status, and evidence membership. Discovery is unique per case and user and is recorded on the server for scoring.

### POST `/cases/:caseId/hints`

Authentication: Required.

Returns only the next unearned hint, increments the server-recorded hint count once, and returns the usage limit and remaining hint count. Requests after the case is completed or the hint limit is reached MUST fail.

## 14.7 Submit an Accusation

### POST `/cases/:caseId/accusation`

Authentication: Required.

Request:

```json
{
  "suspectId": "suspect_01"
}
```

Behavior:
1. Validate the case ID.
2. Verify ownership.
3. Verify that the case is ready for accusation.
4. Verify that the suspect exists.
5. Compare the selected suspect with the stored culprit.
6. Persist the result.
7. Mark the case completed.
8. Return the result.

Response:

```json
{
  "caseId": "case_123",
  "status": "completed",
  "correct": true,
  "resultUrl": "/api/v1/cases/case_123/result"
}
```

The server MUST perform the comparison.

## 14.8 Get the Result

### GET `/cases/:caseId/result`

Authentication: Required.

Behavior:
- Verify case ownership.
- Verify completion.
- Return the solution and explanation.

Response:

```json
{
  "result": {
    "caseId": "case_123",
    "correct": true,
    "score": 160,
    "scoreBreakdown": {
      "total": 160,
      "base": 150,
      "cluePoints": 20,
      "hintPenalty": 10,
      "discoveredClues": 4,
      "hintsUsed": 1
    },
    "culprit": {
      "id": "suspect_01",
      "name": "Alex Morgan"
    },
    "motive": "The culprit wanted to conceal unauthorized work.",
    "method": "The culprit used an existing access card.",
    "reasoning": "The decisive evidence contradicts the alibi.",
    "decisiveEvidenceIds": ["evidence_01"],
    "redHerringExplanations": []
  }
}
```

The response MUST NOT be available before the case is completed.

## 14.9 API Error Format

Use a consistent error envelope:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please correct the highlighted fields.",
    "requestId": "req_123",
    "details": []
  }
}
```

Do not expose stack traces, database internals, authentication tokens, or provider secrets.

---

# 15. BACKEND RESPONSIBILITIES

## 15.1 Routes

Routes MUST:
- Declare endpoint paths.
- Apply authentication middleware.
- Apply appropriate rate limits.
- Invoke controllers.
- Avoid embedding business logic.

## 15.2 Controllers

Controllers MUST:
- Extract and validate request data.
- Call service-layer functions.
- Set HTTP status codes.
- Return consistent response envelopes.

## 15.3 Services

Suggested services:
- `authService`
- `caseService`
- `mysteryGenerationService`
- `geminiService`
- `evidenceValidationService`
- `investigationProgressService`
- `accusationService`
- `storageService`, if image storage is implemented.

Services MUST encapsulate business logic and external provider interactions.

## 15.4 Middleware

Implement:
- Authentication.
- Request validation.
- Centralized error handling.
- Request ID generation.
- Rate limiting.
- Security headers.
- Request-size limits.
- Ownership checks through the appropriate service or middleware.

## 15.5 Asynchronous Generation

The backend MUST NOT rely on an untracked in-memory promise as its only durable generation mechanism.

For the initial implementation, a persisted case status and a controlled background execution mechanism may be used.

If deployment requires reliable execution across process restarts or multiple instances, use a durable job queue.

A worker SHOULD:
1. Claim a generation job.
2. Check that it has not already been completed.
3. Execute the generation pipeline.
4. Persist the result atomically where possible.
5. Update status.
6. Record safe failure information.

The system MUST avoid publishing incomplete results.

---

# 16. FRONTEND ARCHITECTURE

## 16.1 Routing

Implement routes for:
- `/`
- `/create`
- `/history`
- `/cases/:caseId`
- `/cases/:caseId/generating`
- `/cases/:caseId/result`
- Authentication routes.

Protected routes MUST redirect unauthenticated users to the login page.

## 16.2 API Layer

All backend communication MUST pass through a shared API layer.

Suggested modules:
- `authApi`
- `casesApi`
- `progressApi`
- `resultsApi`

Components MUST NOT construct inconsistent API URLs throughout the codebase.

## 16.3 State Management

Use local React state for isolated UI interactions.

Use a consistent shared mechanism for:
- Authentication state.
- Case metadata.
- Investigation progress.
- Loading and error state.

A dedicated state-management library is optional unless application complexity justifies it.

## 16.4 Data Fetching

The frontend MUST:
- Handle failed requests.
- Prevent stale asynchronous responses from overwriting current state.
- Avoid duplicate requests where practical.
- Show meaningful loading states.
- Refresh generation status until a terminal state is reached.
- Stop polling after `ready`, `completed`, or `failed`.
- Clean up timers when components unmount.

## 16.5 Solution Protection

The frontend MUST NOT:
- Store the private solution in local storage.
- Include the culprit in hidden DOM elements.
- Fetch the result endpoint before completion.
- Infer correctness from client-side comparisons.
- Trust client-provided completion flags.

---

# 17. SECURITY AND PRIVACY

## 17.1 Authentication

Use a secure authentication strategy suitable for the deployment architecture.

Preferred browser-session approach:
- Secure, HttpOnly cookies.
- `Secure` enabled in production.
- Appropriate `SameSite` policy.
- Server-side session validation or securely verified tokens.
- CSRF protection where required by the selected cookie strategy.

Do not store authentication tokens in local storage by default.

## 17.2 Authorization

Every private case operation MUST verify ownership on the server.

Never rely on:
- Hidden buttons.
- React route protection alone.
- Client-supplied user IDs.
- Client-supplied roles.
- Client-supplied case status.

## 17.3 Gemini Key Protection

- Store the Gemini API key in server environment variables.
- Never use a `VITE_` prefix for the secret.
- Never expose the key in frontend bundles.
- Never return the key through an API.
- Redact credentials from logs.

## 17.4 Input Security

The backend MUST:
- Validate all request bodies.
- Enforce request-size limits.
- Sanitize data where required by the output context.
- Avoid constructing unsafe MongoDB queries from user input.
- Prevent NoSQL injection.
- Avoid unsafe HTML rendering.
- Avoid arbitrary file paths and untrusted remote image URLs.

## 17.5 Prompt Injection

The user's scenario MUST be treated as untrusted narrative input.

The generation prompt MUST explicitly separate:
- System instructions.
- Application requirements.
- User-provided story content.

The model MUST be instructed not to follow instructions embedded in the story that attempt to override system requirements, expose secrets, change the output schema, or bypass fictional-content restrictions.

Prompt instructions alone are insufficient. Server-side validation remains mandatory.

## 17.6 Fictional Identity and Content

The application MUST:
- Prefer fictional names and settings.
- Avoid presenting generated accusations against real identifiable people as factual.
- Reject or safely transform scenarios targeting identifiable private individuals.
- Avoid fabricated evidence intended to deceive third parties.
- Clearly identify simulated communications and recordings.
- Avoid using real company branding to imply authentic records.
- Keep fictional evidence within the context of the game.

## 17.7 Data Minimization

Persist only information required to operate the product.

Do not collect:
- Real contact lists.
- Real private messages.
- Unnecessary location data.
- Unnecessary personal identifiers.

Users MUST be able to delete their investigations through an authorized deletion mechanism.

## 17.8 Logging

Logs MAY contain:
- Request ID.
- Endpoint.
- Status code.
- Duration.
- Error code.
- Provider latency.
- Generation attempt count.

Logs MUST NOT contain:
- API keys.
- Passwords.
- Session tokens.
- Full authentication cookies.
- Private solutions in routine production logs.
- Unnecessary copies of user-submitted narratives.

---

# 18. ERRORS, RETRIES, AND RATE LIMITS

## 18.1 Standard Error Categories

| Condition | HTTP Status | Error Code |
|---|---:|---|
| Invalid request | 400 | VALIDATION_ERROR |
| Unauthenticated | 401 | UNAUTHORIZED |
| Unauthorized resource access | 403 | FORBIDDEN |
| Missing case | 404 | CASE_NOT_FOUND |
| Duplicate or conflicting operation | 409 | CONFLICT |
| Rate limit exceeded | 429 | RATE_LIMIT_EXCEEDED |
| AI provider unavailable | 502 | AI_PROVIDER_ERROR |
| Generation timed out | 504 | GENERATION_TIMEOUT |
| Unexpected server error | 500 | INTERNAL_ERROR |

Use `404` rather than disclosing another user's case existence when appropriate.

## 18.2 Retry Rules

Retry only transient failures, including:
- Temporary provider errors.
- Rate-limit responses when a retry window is available.
- Network interruptions.
- Timeouts where the operation can safely be retried.

Use bounded exponential backoff with jitter.

Do not automatically retry:
- Invalid input.
- Authentication failures.
- Authorization failures.
- Invalid structured output indefinitely.
- Non-retryable safety failures.

## 18.3 Idempotency

Case creation and accusation submission MUST be protected against duplicate operations.

For case creation:
- Accept an idempotency key.
- Scope the key to the authenticated user.
- Store the operation result.
- Return the existing result for a repeated request with the same key and equivalent payload.

For accusations:
- Make completion transactional or otherwise safe against duplicate requests.
- Do not create multiple completion records.
- Return the existing completed result for repeated equivalent requests.

## 18.4 Rate Limits

Use configurable limits rather than hardcoding arbitrary production assumptions.

Apply separate limits to:
- Authentication.
- Case generation.
- Progress updates.
- Accusation submissions.
- General API requests.

Case generation limits SHOULD account for:
- Requests per user.
- Concurrent generation jobs.
- Provider quotas.
- Estimated generation cost.

Return `429` with a safe message and retry guidance where appropriate.

---

# 19. CONFIGURATION AND ENVIRONMENT VARIABLES

Provide `.env.example` files with placeholders only.

## 19.1 Backend Environment

```dotenv
NODE_ENV=development
PORT=5000

MONGODB_URI=mongodb://127.0.0.1:27017/ai_mystery_room

GEMINI_API_KEY=
GEMINI_MODEL=

CLIENT_ORIGIN=http://localhost:5173

SESSION_SECRET=
COOKIE_SECURE=false

GENERATION_TIMEOUT_MS=60000
GENERATION_MAX_ATTEMPTS=2

RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=

MAX_SCENARIO_LENGTH=3000
MAX_CASE_PAYLOAD_BYTES=

LOG_LEVEL=info
```

Values MUST be validated at startup.

The application MUST fail clearly when required configuration is missing.

`SESSION_SECRET` is a placeholder for the selected authentication implementation; its necessity depends on that implementation.

## 19.2 Frontend Environment

```dotenv
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

Frontend environment variables MUST NOT contain server secrets.

## 19.3 Optional Image Storage

If generated images are implemented, configure the chosen storage provider through server-side environment variables.

Do not commit storage credentials.

## 19.4 Environment Management

- Commit `.env.example`.
- Exclude `.env` from Git.
- Never place production secrets in the repository.
- Use the hosting platform's secret manager in production.
- Document the required setup steps in the README.

---

# 20. TESTING STRATEGY

## 20.1 Unit Tests

Test:
- Input validation.
- Enum validation.
- Structured-output validation.
- ID uniqueness.
- Evidence-reference integrity.
- Culprit-reference integrity.
- Timeline consistency checks.
- Public/private solution separation.
- Accusation evaluation.
- Ownership checks.
- Idempotency logic.

## 20.2 Backend Integration Tests

Test:
- User registration and login.
- Case creation.
- Generation success.
- Generation failure.
- Case status retrieval.
- Case retrieval.
- Progress persistence.
- Accusation submission.
- Result retrieval.
- Unauthorized access.
- Cross-user case access.
- Rate-limit behavior.

Use a test database and mock Gemini responses where practical.

Tests MUST NOT depend on live Gemini availability unless explicitly categorized as integration or smoke tests.

## 20.3 Frontend Tests

Test:
- Scenario form validation.
- Loading states.
- Generation polling.
- Suspect rendering.
- Evidence filtering.
- Evidence detail display.
- Progress saving.
- Accusation confirmation.
- Correct and incorrect result states.
- Authentication redirects.
- Empty and error states.

## 20.4 End-to-End Tests

Required end-to-end journey:

```text
Register / Log in
       |
       v
Create Mystery
       |
       v
Wait for Generation
       |
       v
Open Investigation
       |
       v
Inspect Evidence
       |
       v
Submit Accusation
       |
       v
View Result
       |
       v
Refresh and Reopen Completed Case
```

Also test:
- Invalid scenario.
- Generation failure.
- Expired session.
- Another user attempting to access the case.
- Repeated accusation requests.
- Browser refresh during generation.

## 20.5 AI Quality Tests

Maintain a set of representative scenarios.

Evaluate:
- Structural validity.
- Correct suspect references.
- Valid evidence references.
- Solution consistency.
- Evidence sufficiency.
- Fairness of red herrings.
- Preservation of the scenario premise.
- Appropriate difficulty.
- Fictional-content labeling.

AI quality testing SHOULD use deterministic fixtures for automated validation and a separate evaluation set for probabilistic content quality.

## 20.6 Security Tests

Verify:
- No solution leakage in public endpoints.
- No cross-user access.
- No API key leakage.
- No password exposure.
- No unsafe HTML injection.
- No arbitrary remote resource loading.
- No unbounded generation retries.
- No unauthorized result access.
- No insecure production cookie configuration.

---

# 21. ACCEPTANCE CRITERIA

The initial release is accepted only when the following requirements are satisfied.

## AC-001: Scenario Creation
A user can submit a valid scenario and receives a case identifier.

## AC-002: Input Validation
Invalid scenarios are rejected with useful validation errors.

## AC-003: Successful Generation
A valid AI-generated case reaches the `ready` state.

## AC-004: Structured Data
Every playable case passes schema validation and reference-integrity checks.

## AC-005: Concealed Solution
The public case endpoint does not reveal the culprit or private solution.

## AC-006: Suspect Integrity
The culprit corresponds to a valid suspect in the case.

## AC-007: Evidence Inspection
The user can open, inspect, filter, and revisit evidence.

## AC-008: Fictional Evidence
Simulated chats, images, CCTV-style scenes, and documents are clearly labeled.

## AC-009: Solvability
The final explanation connects the culprit to the decisive evidence without relying on undisclosed facts.

## AC-010: Correct Accusation
Selecting the actual culprit produces a correct result.

## AC-011: Incorrect Accusation
Selecting another suspect produces an incorrect result without corrupting the stored solution.

## AC-012: Result Authorization
The solution endpoint refuses access before completion.

## AC-013: Persistence
A user can refresh and resume an active investigation.

## AC-014: History
A user can reopen previous cases.

## AC-015: Authorization
A user cannot read or modify another user's private cases.

## AC-016: Failure Handling
AI provider failures do not leave cases permanently stuck in an unexplained generating state.

## AC-017: Idempotency
Repeated equivalent requests do not create duplicate cases or completion records.

## AC-018: Responsive Interface
All required pages work at mobile, tablet, and desktop sizes.

## AC-019: Accessibility
Core journeys can be completed using keyboard navigation and accessible controls.

## AC-020: Deployment
The application runs using documented environment configuration without exposing secrets.

## AC-021: Automated Testing
Core business rules, API behavior, and the primary user journey are covered by automated tests.

## AC-022: Documentation
A new developer can configure, run, test, and deploy the application using the repository documentation.

---

# 22. IMPLEMENTATION PHASES

## Phase 1 — Foundation

Implement:
- Repository setup.
- React/Vite frontend.
- Express backend.
- MongoDB connection.
- Environment validation.
- Centralized error handling.
- Authentication.
- Base routing.
- Shared UI components.

**Exit condition:** Application starts locally and authentication works.

## Phase 2 — Mystery Generation

Implement:
- Scenario submission.
- Generation API.
- Gemini integration.
- Structured output schema.
- Validation pipeline.
- Bounded retries.
- Case persistence.
- Generation status polling.
- Public/private solution separation.

**Exit condition:** Valid mysteries can be generated and retrieved without leaking the solution.

## Phase 3 — Investigation Workspace

Implement:
- Case introduction.
- Suspect cards.
- Evidence collection.
- Evidence detail views.
- Timeline.
- Evidence filtering.
- Progress persistence.
- Investigation notes.

**Exit condition:** Users can investigate and resume a case.

## Phase 4 — Accusation and Results

Implement:
- Suspect selection.
- Confirmation dialog.
- Server-side accusation evaluation.
- Completion persistence.
- Solution reveal.
- Decisive evidence explanation.
- Red-herring explanations.

**Exit condition:** The complete investigation journey works end to end.

## Phase 5 — Evidence Enrichment

Implement:
- Rich chat rendering.
- Document presentation.
- CCTV-style transcripts.
- Optional AI-generated images.
- Provenance metadata.
- Fallback evidence representations.

**Exit condition:** Evidence types render safely and consistently.

## Phase 6 — Hardening

Implement:
- Authorization audits.
- Rate limiting.
- Idempotency.
- Security headers.
- Accessibility improvements.
- Responsive refinements.
- Automated tests.
- Failure-state testing.
- Production logging.

**Exit condition:** Acceptance criteria are satisfied.

## Phase 7 — Deployment

Implement:
- Production environment configuration.
- Database deployment.
- Frontend hosting.
- Backend hosting.
- CORS and cookie configuration.
- Health checks.
- Logging.
- Deployment documentation.

**Exit condition:** The application is deployable using documented configuration.

---

# 23. DEPLOYMENT ASSUMPTIONS

## 23.1 Development

Expected local services:
- Frontend development server.
- Express API server.
- MongoDB local instance or development cluster.
- Gemini API credentials.

## 23.2 Production

Expected services:
- HTTPS-enabled frontend hosting.
- HTTPS-enabled Node.js backend.
- Managed MongoDB.
- Secure secret management.
- Optional object storage for generated images.
- Optional durable job queue.

## 23.3 Production Requirements

The deployed application MUST:
- Use HTTPS.
- Configure allowed frontend origins explicitly.
- Use secure cookie settings.
- Validate environment variables at startup.
- Use production database credentials.
- Avoid exposing debug endpoints.
- Avoid returning stack traces.
- Provide health checks.
- Apply generation rate limits.
- Monitor provider failures and generation duration.

## 23.4 Health Endpoint

### GET `/api/v1/health`

Return a minimal service status.

The endpoint MUST NOT disclose secrets, internal infrastructure details, database credentials, or private case data.

---

# 24. OBSERVABILITY AND OPERATIONAL REQUIREMENTS

Record structured operational events for:
- Case generation started.
- Case generation completed.
- Case generation failed.
- Schema validation failed.
- Repair attempt started.
- Provider timeout.
- Rate limit triggered.
- Accusation submitted.
- Investigation completed.

Each event SHOULD include:
- Request ID.
- Case ID when available.
- Event type.
- Timestamp.
- Duration when relevant.
- Safe error code.

Do not record the private solution in general operational logs.

Monitor:
- Generation success rate.
- Average generation duration.
- AI provider error rate.
- Validation failure rate.
- Retry frequency.
- Cost per generated case where measurable.
- Case completion rate.
- API error rate.

These metrics support reliability improvements without changing the core gameplay.

---

# 25. PERFORMANCE REQUIREMENTS

Initial targets:

- Typical non-AI API requests SHOULD complete within 500 ms at the 95th percentile under the expected initial workload, excluding database cold starts and external infrastructure delays.
- Generation requests SHOULD return an acknowledgment promptly rather than waiting for the complete AI response.
- Generation completion time MUST be measured and monitored.
- Evidence views SHOULD render without unnecessary full-case reloads.
- Images MUST use responsive sizing and appropriate caching.
- Investigation history MUST use pagination.
- The frontend MUST avoid unnecessary rerenders of large evidence collections.

AI generation latency depends on provider performance and is not guaranteed to meet a fixed response time.

---

# 26. FUTURE EXTENSIONS

Potential future capabilities include:
- Actual generated video clips.
- Multiple investigation endings.
- More complex branching investigations.
- Dynamic follow-up questioning.
- Cooperative multiplayer investigations.
- Difficulty adaptation.
- Case sharing.
- User-created mystery templates.
- Advanced branching or multi-stage hint systems beyond the required difficulty-based hints.
- Performance analytics.
- Additional evidence-generation providers.

These extensions MUST NOT be implemented as part of the initial release unless explicitly approved.

The architecture SHOULD make it possible to add new evidence types without rewriting the entire investigation workspace.

---

# 27. CODEX IMPLEMENTATION RULES

These rules are mandatory for any AI coding agent working on the project.

## 27.1 Before Editing

1. Inspect the existing repository structure.
2. Read this specification.
3. Read the existing README and package manifests.
4. Identify the current framework, dependencies, routes, models, and implemented features.
5. Determine which requirements already exist.
6. Avoid replacing working implementations without a reason.

## 27.2 During Implementation

1. Implement requirements in the defined phase order unless dependencies require otherwise.
2. Use small, logically separated modules.
3. Keep controllers thin.
4. Keep business logic in services.
5. Validate all external input.
6. Keep secrets on the server.
7. Preserve public/private solution separation.
8. Use the canonical enum values and API contracts.
9. Reuse existing dependencies when appropriate.
10. Avoid unnecessary packages.
11. Avoid hardcoded credentials and production URLs.
12. Avoid placeholder implementations that appear complete but do not work.
13. Do not silently substitute mocked AI output for the real Gemini integration in production.
14. Use deterministic mocks only in tests or explicitly identified development fixtures.
15. Do not introduce additional product features without approval.

## 27.3 Before Declaring a Feature Complete

1. Run the relevant tests.
2. Verify schema validation.
3. Verify API request and response contracts.
4. Verify authorization.
5. Verify public/private solution separation.
6. Verify loading, empty, and error states.
7. Check responsive behavior.
8. Update documentation.
9. Report any remaining limitations explicitly.

## 27.4 Handling Specification Conflicts

If repository behavior conflicts with this specification:
- Identify the conflict.
- Prefer this specification for product behavior.
- Preserve unrelated working functionality.
- Make the smallest safe change.
- Document significant deviations.

If a requirement cannot be implemented as written, explain the constraint and propose the smallest compliant alternative rather than silently omitting it.

## 27.5 Definition of Done

A feature is complete only when:
- The implementation exists.
- Validation is present.
- Relevant tests pass.
- Authorization is enforced.
- Error handling is implemented.
- The UI communicates its states.
- The feature follows the API contract.
- Documentation is updated where necessary.

---

# 28. FINAL PRODUCT DEFINITION

AI Mystery Room is a fictional investigation platform powered by generative AI.

The user supplies the premise. The backend constructs a mystery with a predetermined solution. The application presents suspects, timelines, and simulated evidence. The user investigates and accuses a suspect. The backend evaluates the accusation and reveals the solution with a clear explanation.

The essential product promise is:

**Every mystery must be interactive, every decisive conclusion must be supported by evidence, and every generated artifact must remain clearly fictional.**

The first release succeeds when a user can complete this journey reliably:

**Submit a Story → Generate a Mystery → Inspect Evidence → Compare Suspects → Identify the Culprit → Reveal the Solution.**

All implementation decisions must preserve that experience.