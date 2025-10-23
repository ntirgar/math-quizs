<div align="center">
	<h1>Maths Wizard</h1>
	<p><strong>An AI-powered adaptive maths learning platform</strong> for mastering addition and multiplication through personalized practice, staged progression, and real-time analytics.</p>
	<p>
		Adaptive fact targeting · Carry & place value diagnostics · Staged progression · Multiplication table mastery · Unified growth analytics
	</p>
	<hr />
</div>

## Platform Overview

Maths Wizard blends domain-specific diagnostic engines with lightweight per-digit input to slow thinking just enough to reinforce place value and fact recall. An adaptive strategy continuously surfaces weak facts, carry positions, or table anchors until mastery thresholds are met. All activity is persisted client-side, enabling fast iteration and privacy-friendly usage without a backend.

Key capabilities:

- AI-informed adaptive queues (rule-based now, ML-ready later)
- Dual staged progressions (single‑digit addition → multi‑digit, tables 2–9 → full facts)
- Root-cause mistake analysis (missed carry, place swap, fact recall, distributive hints)
- Unified cross-operation timeline & growth dashboard
- Exportable attempt history (CSV / JSON) for teacher review
- Resilient localStorage synchronization with custom event bus

---

## Quiz Modes

The app currently supports two fact-based quiz modes with a unified UI:

| Mode | Route | Operator | Hook Source | Storage Prefixes |
|------|-------|----------|-------------|------------------|
| Addition | `/` | `+` | `useQuizLogic` (legacy) / `useQuizApp` (planned) | `progress`, `mistakes`, `subskillProgress` |
| Multiplication | `/multiplication` | `×` | `useMultiplicationQuizLogic` (legacy) / `useQuizApp` (planned) | `mult_progress`, `mult_mistakes`, `mult_subskills` |
| Growth & Learning (Unified) | `/growth` | — | Aggregates both | reads all above |

Both modes render through the same presentational components (`MathProblem` + `QuizForm`) by passing an `operator` prop (`'+'` or `'×'`). This eliminates duplicated layout code and ensures consistent accessibility and celebration feedback.

### Unified Components

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `MathProblem` | Displays vertical operand alignment + operator + result area | `a`, `b`, `operator`, optional `heading`, `resultValue` |
| `QuizForm` | Encapsulates per-digit answer input, submit/reset, streak & adaptive toggles | `operator`, `onSubmit`, `digits`, `answerDigits`, `setAnswerDigit` |
| `DigitSelector` | Dropdown digit entry for each column allowing focused numeric selection | `value`, `onChange`, `highlightState` |
| `Statistics` | Shows progress counts, accuracy, streak, and mastery hints | Data object from respective hook |
| `MistakeAnalysis` | Breaks down historical mistakes into categories (carry, alignment, fact gaps) | Normalized mistake list |

Deprecated component `MultiplicationProblem.tsx` was removed after `MathProblem` gained an `operator` prop. If you still see it in your local branch, you can safely delete it.

### Adaptive Logic & Subskills

Addition adaptive strategy targets weak carry positions and sums the learner struggles with. Multiplication adaptive strategy focuses on fact families (e.g. 6×7), squares, and commutative pairs not yet mastered. Each mistake updates a subskill progress map; generation functions prioritize low-confidence facts until they reach a threshold (e.g. 80% recent correctness).

Planned consolidation: both strategies will converge into domain services under `application/adaptive/` so the facade can serve any operation through a single hook.

### Persistence Keys

LocalStorage is currently namespaced by mode:

| Concern | Addition Key | Multiplication Key |
|---------|--------------|--------------------|
| Progress summary | `progress` | `mult_progress` |
| Mistake history | `mistakes` | `mult_mistakes` |
| Subskill mastery | `subskillProgress` | `mult_subskills` |
| Adaptive mode toggle | `adaptiveMode` | `mult_adaptive` |
| Audio enabled toggle | `audioEnabled` | `mult_audio` |
| Attempt history (all tries) | `attempts` | `mult_attempts` |

Normalization step on history pages ensures legacy entries that stored `questionKey` are upgraded to `question` to keep analytics consistent.

### Answer Entry UX

Children enter answers digit-by-digit using `DigitSelector` components. This intentionally slows input just enough to encourage column-wise reasoning (carry tracking or fact decomposition). For multi-digit multiplication, the product digits are displayed with the same right-aligned layout as addition to maintain spatial familiarity.

### Celebrations & Feedback

- Streaks trigger visual confetti and optional audio cues.
- Wrong answers classify mistake root causes, updating subskill heat maps.
- Planned: granular hint system (e.g., suggest distributive breakdown for tough facts like 6×7 = 6×5 + 6×2).

### Future Unification Tasks

1. Merge `useMultiplicationQuizLogic` and `useQuizLogic` into operation-agnostic `useQuizApp` behind facade.
2. Introduce operation registry for adaptive strategies & subskill taxonomies.
3. Expand `MistakeAnalysis` to render operation-specific insights (carry vs partial product) and optionally unify with multiplication analysis.
4. Provide import/export of progress to allow session continuity across devices.
5. Merge per-operation subskill progress into combined mastery model.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app) and evolved toward an adaptive learning architecture.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## Domain-Driven Design (DDD) Overview

This codebase is undergoing a gradual migration toward a Domain-Driven Design structure for long-term scalability and clarity:

```
src/
	domain/          # Core domain models & pure logic (no framework dependencies)
	application/     # Use cases coordinating domain services & repositories
	infrastructure/  # Adapters (e.g., localStorage repositories)
	hooks/           # UI-facing React hooks (legacy + new facade-backed)
	components/      # Presentational / interactive UI pieces
	styles/          # Modular CSS partials imported by globals.css
```

The new `QuizFacade` orchestrates persistence and adaptive logic. A new hook (`useQuizApp`) consumes the facade while the legacy `useQuizLogic` remains temporarily for backwards compatibility.

## CSS Architecture (Modular Partials)

Global styling was split out of a single monolithic `globals.css` into focused partials inside `src/styles` to improve maintainability and reduce style cascade side-effects:

| File | Purpose |
|------|---------|
| `base.css` | Root variables, body/base resets, theme tokens |
| `utilities.css` | Reusable layout & helper classes (e.g. rows, accents) |
| `digit-selector.css` | Styles specific to per-digit input controls |
| `number-display.css` | Rendering multi-line vertical numbers & alignment |
| `math-problem.css` | Container & layout for the active problem block |
| `animations.css` | Keyframes & transition classes (confetti, streak, swap) |
| `carry.css` | Highlighting carry operations per column |
| `accessibility.css` | Reduced-motion and accessible-focus handling |

`globals.css` now only imports Tailwind layers plus these partials:

```css
@import "tailwindcss/base";
@import "tailwindcss/components";
@import "tailwindcss/utilities";
@import "./styles/base.css";
@import "./styles/utilities.css";
@import "./styles/digit-selector.css";
@import "./styles/number-display.css";
@import "./styles/math-problem.css";
@import "./styles/animations.css";
@import "./styles/carry.css";
@import "./styles/accessibility.css";
```

### Adding New Styles

1. Prefer co-locating styles in an existing partial if conceptually related.
2. If a style set is tightly scoped to one component, consider a CSS Module instead.
3. Avoid global element selectors unless intentional (favor class names).
4. Keep animation naming semantic (`fade-in-question`, `celebrate-streak`).

### Benefits Achieved

- Lower cognitive load: each partial has a single responsibility.
- Faster regression isolation when a style breaks a component.
- Easier future migration to CSS Modules or a design system.
- Reduced risk of unintended cascade overrides.

## Pending / Future Improvements

The following incremental enhancements are planned or recommended:

- Feature flag to fully switch components from legacy `useQuizLogic` to `useQuizApp` (`NEXT_PUBLIC_USE_DDD=1`).
- Vitest unit tests for domain services (e.g. streak logic, adaptive strategy) and use cases.
- Focus visibility & keyboard navigation audit; ensure `.focus-visible` styles are present for interactive elements.
- Visualization layer: digit-level heatmap or sparkline of recent error positions.
- Deletion & export: allow exporting full mistake history (JSON) and targeted deletion.
- Settings repository expansion (difficulty ramp curves, audio toggle, reduced motion override).
- Progressive enhancement of accessibility (ARIA roles on numeric groups, live region updates on streak celebrations).
- Migration of confetti & celebration effects to a lightweight portal to avoid layout shifts.

## Contributing Notes

When contributing:

- Keep domain logic free of React/DOM imports.
- Add new persistence needs via repository interfaces under `infrastructure` and inject them through the facade.
- Avoid duplicating adaptive logic in the UI layer—extend or adjust the `AdaptiveStrategy` service instead.
- Update this README when architectural boundaries or style conventions change.

## Quick Reference

| Concern | Where to Look |
|---------|---------------|
| Submit answer flow | `application/useCases/SubmitAnswer.ts` |
| Generate question | `application/useCases/GenerateQuestion.ts` |
| Facade entrypoint | `application/QuizFacade.ts` |
| Mistake model      | `domain/models.ts` |
| Local persistence  | `infrastructure/localStorage/*` |
| New UI hook        | `hooks/useQuizApp.ts` |

---

If you encounter style anomalies after adding new components, first check whether a class belongs in an existing partial or if a new partial is warranted. Keeping the style surface intentional safeguards the adaptive learning UI from regressions.

### History Data Normalization

Older stored mistake entries (prior to the DDD migration) used a `questionKey` field instead of `question`. The loader now normalizes legacy entries by setting `question = question || questionKey || num1+"+"+num2` so the history route always renders correctly. If corrupt JSON is detected, the app clears only the `mistakes` key to prevent runtime errors.

### Growth & Learning Route

`/growth` provides the sole learning analysis view:

- Overall totals (attempts, correct, mistakes, accuracy) via `OverallProgress`.
- Addition deep analysis (`MistakeAnalysis`) with carry & place value root cause detection.
- Multiplication fact-focused summary (`MultiplicationAnalysis`) highlighting most-missed facts and subskills.
- Recent cross-operation attempt stream (`AttemptTimeline`) with filtering by correctness and operation (last 60, capped storage slice).

Per-operation quiz pages (`/` and `/multiplication`) now focus purely on active practice and core stats; their previous inline analysis panels were removed and replaced with a single “View Full Learning Analysis” link to keep the main solving experience uncluttered.

The deprecated `/multiplication/history` route and earlier addition-specific history/analysis blocks have been consolidated. If you reintroduce specialized debugging views, link them from `/growth` rather than embedding them directly in the quiz workflows.

### Staged Addition Progression

Addition now unfolds in two stages to build foundational fact fluency before multi-digit complexity:

1. Stage 1 (Single-Digit Facts): Only sums with both operands 0–9 are generated. A mastery counter tracks correct answers. After reaching `SINGLE_DIGIT_MASTERY_TARGET` (default 40), advancement occurs automatically.
2. Stage 2 (Multi-Digit & Adaptive): General multi-digit questions resume and adaptive targeting of subskills (carry-trigger, place-alignment, etc.) is enabled.

Persistence Keys:
- `addition_stage`: "1" or "2"
- `single_digit_stats`: `{ correct: number, attempts: number }`

UI Indicators:
- A banner on `/` shows progress (green bar) while in Stage 1 and switches label once Stage 2 unlocks.
- Adaptive toggle has no effect until Stage 2, ensuring early focus remains on fact retrieval rather than strategy juggling.

Adjustment:
- To experiment or reset, remove `addition_stage` and `single_digit_stats` from localStorage in dev tools; the app will revert to Stage 1.

Future Extension Ideas:
- Dynamic target based on accuracy (e.g. require 90% over last 30 single-digit attempts instead of a raw count).
- Optional manual unlock button for teacher override.
- Visual fact coverage map (0–9 grid shading each pair mastered).

### Staged Multiplication Progression

Multiplication now follows a two-stage pathway similar to addition:

1. Stage 1 (Tables 2–9 Mastery): The system focuses on a single anchor table at a time (starting at 2). Problems are generated as `anchor × n` with n in 2–9 (order randomized). Each table requires `PER_TABLE_TARGET` correct responses (default 12) to be considered mastered. Once mastered, the next table becomes active. After all 8 tables (2–9) are mastered, the app transitions to Stage 2 automatically.
2. Stage 2 (General & Adaptive): Standard fact range resumes (including 0–12) plus adaptive targeting of subskills (e.g., squares, distributive anchors, commutativity recognition, multi-digit flow).

Persistence Keys:
- `mult_stage`: "1" or "2"
- `mult_tables_progress`: mapping table -> `{ correct, attempts }`
- `mult_table_index`: current active TABLES index (used on load)

UI Indicators:
- Banner on `/multiplication` shows active table progress bar and total mastered count.
- Adaptive toggle disabled during Stage 1 to focus on pure fact acquisition.

Reset Strategy:
- Remove `mult_stage`, `mult_tables_progress`, and `mult_table_index` from localStorage to restart at table 2.

Future Enhancements:
- Accuracy-based mastery (e.g., require >=90% over last 20 attempts for a table).
- Partial mastery hints (highlight specific missed facts within a table).
- Visual heatmap grid (2–9 × 2–9) shading mastered intersections.

### Attempt History Persistence

Each submitted problem is stored for longitudinal analysis and potential future features (trend charts, spaced repetition scheduling).

Addition attempt record example (`attempts`):
```json
{ "q": "7+5", "num1": 7, "num2": 5, "answer": 12, "userAnswer": 12, "correct": true, "timestamp": 1734720000000, "stage": 1 }
```

Multiplication attempt record example (`mult_attempts`):
```json
{ "q": "6x7", "a": 6, "b": 7, "answer": 42, "userAnswer": 40, "correct": false, "timestamp": 1734720000000 }
```

Notes:
- For very large addition answers (>4 digits) treated as preview, `userAnswer` and `correct` may be `null`.
- Remove keys `attempts` / `mult_attempts` from localStorage to reset attempt timelines without clearing mastery or mistakes.
