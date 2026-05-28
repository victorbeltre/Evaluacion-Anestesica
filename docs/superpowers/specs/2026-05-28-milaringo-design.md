# Milaringo Design Specification

Date: 2026-05-28

## Product Summary

Milaringo is an original, advanced anesthesiology learning app for senior residents, fellows, and practicing anesthesiologists. It uses a gamified learning path plus board-style practice and short clinical cases to support deliberate review across the public topic scope of Miller's Anesthesia.

Milaringo must not copy Duolingo's protected product design, branding, illustrations, sounds, or exact interaction patterns. It also must not reproduce Miller's Anesthesia text, figures, tables, or proprietary explanations. The MVP uses publicly visible topic names as curriculum scaffolding and original educational prompts, summaries, and sample cases.

Reference source used for curriculum scope: Elsevier's public listing for Miller's Anesthesia, 10th Edition, which lists 87 chapters across introduction, physiology, anesthesia management, adult subspecialties, pediatrics, postoperative care, critical care, and ancillary responsibilities.

## Audience

Primary users are advanced anesthesiology residents and anesthesiologists. The tone should be clinically serious, fast, and high-yield rather than introductory. The app should feel appropriate for board review, oral board practice, perioperative decision-making refreshers, and daily spaced repetition.

## Core Experience

The first screen is a balanced A+C design:

- A central gamified path with unlockable nodes and visible progress.
- A clinical practice rail with daily XP, streak, hearts, mastery, weak areas, flashcards due, a quick case, and weekly simulation.
- A left curriculum navigation organized by major anesthesiology domains.
- A lesson flow that mixes knowledge recall, sequencing, matching, and applied clinical reasoning.

The first usable version should be a polished interactive MVP rather than a static mockup. It should include enough real local state to demonstrate lesson selection, answer checking, progress, XP, hearts, mastery, and review queue behavior.

## Curriculum Model

The MVP curriculum should be inspired by the public table of contents of Miller's Anesthesia, 10th Edition, summarized into high-level domains suitable for navigation:

- Foundations, safety, ethics, informatics, quality, and simulation.
- Applied anesthetic physiology.
- Pharmacology and delivery systems.
- Preoperative evaluation, risk, monitoring, positioning, airway, regional anesthesia, fluids, electrolytes, acid-base, transfusion, and coagulation.
- Adult subspecialty anesthesia, including thoracic, cardiac, vascular, neuro, bariatric, renal/genitourinary, transplant, obstetric, orthopedic, trauma, ambulatory, non-operating-room anesthesia, and extreme environments.
- Pediatric anesthesia and pediatric/neonatal critical care.
- Post-anesthesia care, acute pain, and perioperative neurocognitive disorders.
- Critical care, ECMO/cardiac devices, CPR, and ACLS.
- Burns, occupational safety, infection control, substance use disorders, emergency preparedness, clinical research, and medical literature interpretation.

Each domain can contain sample nodes in the MVP. The data structure must allow later expansion to many chapters and lessons without rewriting the UI.

## Exercise Types

The MVP should implement representative versions of the major exercise families:

- Board-style multiple choice question with immediate feedback.
- Matching exercise, such as drug-to-effect or monitor-to-interpretation.
- Ordering exercise, such as airway or crisis algorithm steps.
- Fill-in or short recall prompt, implemented in a way that can be validated locally for the MVP.
- Flashcard review with known/needs-review states.
- Mini clinical case with sequential decisions and feedback.

The app may use original sample content for a limited number of lessons. It should avoid implying that the entire copyrighted book content has been imported.

## Gamification And Learning State

Milaringo should include:

- XP gained from correct answers and completed lessons.
- Daily streak indicator.
- Hearts or attempts to add mild pressure without blocking exploration completely.
- Mastery percentage by domain or node.
- Locked and unlocked nodes on the path.
- Review queue for errors and due flashcards.
- Weekly simulation entry point.

For the MVP, state can live in React local state and optionally `localStorage`. No backend is required.

## Visual Direction

The UI should be inspired by the habit-building clarity of language-learning apps but should have its own identity:

- Name: Milaringo.
- Audience: advanced clinical learners.
- Feel: precise, energetic, medical, trustworthy, and practice-oriented.
- Layout: three-column app shell on desktop, collapsing cleanly on mobile.
- Color: avoid a one-hue green clone. Use a distinctive palette with medical teal, warm amber, crisp white, charcoal text, and a restrained accent color.
- Components: compact path nodes, status rail, domain navigation, lesson card, answer controls, progress meters, and case panels.
- Icons: use professional outline icons where useful for navigation and controls.

The app should not use Duolingo's mascot, logo style, exact green palette, exact hearts/streak visuals, exact typography, or exact screen compositions.

## Safety And Legal Boundaries

Milaringo is an educational study aid, not a clinical decision support system. It should include a visible medical education disclaimer. Content should be original and should invite expert review before real-world educational deployment.

The product may reference Miller's Anesthesia as an inspiration/source for public topic scope, but it should not present itself as an official Elsevier, Miller, or Duolingo product.

## Architecture

Use React + Vite for the MVP unless the existing project dictates otherwise. The repository is currently empty except for git metadata, so a new Vite app is appropriate.

Suggested module boundaries:

- `src/data/curriculum`: curriculum domains, nodes, and original sample exercises.
- `src/components/layout`: app shell, navigation, practice rail, header.
- `src/components/path`: skill path and node states.
- `src/components/exercises`: multiple choice, matching, ordering, recall, flashcard, and case components.
- `src/state`: progress helpers and local persistence.
- `src/styles`: global tokens and responsive layout.

## Error Handling

The MVP should handle:

- No selected lesson by showing a useful default.
- Failed localStorage read/write by falling back to in-memory state.
- Answer submission without a selected answer by prompting the user inside the exercise panel.
- Completed lesson state without available next item by returning to the path.

## Testing And Verification

Minimum verification:

- Install/build succeeds.
- Core lesson flow works in browser: select node, answer a question, gain XP, lose heart on wrong answer, complete a lesson, update mastery/review state.
- Desktop and mobile layouts do not overflow.
- Text remains readable and controls do not overlap.
- The final rendered UI is visually inspected against the approved direction in the brainstorming mockup.

