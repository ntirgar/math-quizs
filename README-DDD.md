# Domain-Driven Design Refactor (Phase 1)

This document outlines the new architecture introduced to transition the addition quiz application toward a Domain-Driven Design (DDD) structure. The original implementation concentrated most logic in `useQuizLogic`. Phase 1 introduces layered separation without removing existing UI functionality.

## Layer Overview

- **Domain Layer (`src/domain`)**
  - Pure model definitions (`models.ts`) for entities/value objects: `Question`, `Mistake`, `SubskillProgressItem`, etc.
  - Domain services: `AdaptiveStrategy`, `StreakService` modeling core behaviors.
  - Repository interfaces defining persistence contracts.
  - No React or browser-specific code (except classification utility import abstraction).

- **Infrastructure Layer (`src/infrastructure`)**
  - LocalStorage-based repository implementations.
  - Adapters contain all side-effects and browser APIs.

- **Application Layer (`src/application`)**
  - Use cases: `GenerateQuestion`, `SubmitAnswer`, `ClearHistory`, `LoadQuestion` orchestrate domain logic + persistence boundaries.
  - `QuizFacade` coordinates use cases and hides multi-repository complexity from UI.

- **Interface / UI Layer (`src/hooks`, `src/components`)**
  - New `useQuizApp` hook consumes `QuizFacade` and exposes state/actions to existing components.
  - Legacy `useQuizLogic` remains for gradual migration; components can be switched incrementally.

## Data Flow

1. UI invokes `submit()` from `useQuizApp`.
2. `QuizFacade.submitAnswer` runs `SubmitAnswerUseCase` with current state.
3. Use case applies domain services (`AdaptiveStrategy`, `StreakService`) to determine results.
4. Facade persists changes through infrastructure repositories.
5. Hook updates React state; triggers next question generation after delay.

## Key Domain Concepts

| Concept | Purpose |
|---------|---------|
| Question | Immutable number pair + computed answer (+ optional target subskill). |
| Mistake | Captures incorrect attempt context for analysis. |
| SubskillProgressMap | Tracks per-subskill correctness and attempts for adaptive focus. |
| StreakState | Current streak + best streak for celebration triggers. |
| SettingsState | User preferences (audio, motion). |

## Migration Plan

### Step 1 – Parallel Hook
Keep using `useQuizLogic` while introducing `useQuizApp`. Confirm parity of behaviors (question generation, streaks, adaptive mode).

### Step 2 – Component Opt-In
Refactor components one by one to consume `useQuizApp` outputs (e.g., `QuizForm`, `QuestionHistoryPanel`) behind a feature flag or environment toggle.

```
const { question, submit, mistakes } = process.env.NEXT_PUBLIC_DDD ? useQuizApp() : useQuizLogic();
```

### Step 3 – Remove Redundant Logic
After confidence, migrate logic-only parts (e.g., progress recording) out of `useQuizLogic` or wrap it internally with facade until fully deprecated.

### Step 4 – Enhance Domain
Add richer domain services (e.g., `SubskillProgressService`, `LearningPathService`) extracted from `MistakeAnalysis` heuristics.

### Step 5 – Testing
Introduce unit tests for pure domain services and use cases (easy due to side-effect isolation). Example targets:
- `AdaptiveStrategy.selectTargetSubskill`
- `SubmitAnswerUseCase.execute` correctness paths
- `StreakService.milestoneTag`

## Advantages of New Structure
- **Testability:** Domain + application logic isolated from React lifecycles.
- **Maintainability:** Clear separation of concerns; adding new persistence backends (e.g. IndexedDB, remote API) affects only infrastructure layer.
- **Extensibility:** New use cases (e.g., "ExportSession", "ImportSession") can be added without UI changes.
- **Performance:** Facilitates memoization and batching at facade level.

## Next Potential Additions (Phase 2)
- `SubskillProgressService` to encapsulate progress mutation rules.
- `LearningPathService` to generate recommendations (currently embedded in component logic).
- Repository abstraction for practice queue.
- Event bus or domain events for celebration triggers (`StreakExceeded`, `MilestoneReached`).
- Hexagonal ports for analytics export.

## How To Switch A Component
Example converting `QuestionHistoryPanel`:

```tsx
// before
const { progress, mistakes, loadSpecificQuestion } = useQuizLogic();
// after
const hook = process.env.NEXT_PUBLIC_DDD ? useQuizApp() : useQuizLogic();
const { progress, mistakes, reattempt } = hook;
```

## Decommission Plan for `useQuizLogic`
1. Maintain side-by-side for 1–2 iterations.
2. Move adaptive gating logic into `AdaptiveStrategy` if any stray logic remains.
3. Replace direct localStorage writes in legacy hook with facade calls.
4. Delete hook once all consumers migrated.

## Directory Structure (New)
```
src/
  domain/
    models.ts
    services/
      AdaptiveStrategy.ts
      StreakService.ts
    repositories/
      Repositories.ts
  infrastructure/
    localStorage/
      LocalStorageRepositories.ts
  application/
    useCases/
      GenerateQuestion.ts
      SubmitAnswer.ts
      ClearHistory.ts
      LoadQuestion.ts
    QuizFacade.ts
  hooks/
    useQuizApp.ts
  components/ ... (unchanged for now)
```

## Conventions
- Domain models use `readonly` where possible to communicate immutability.
- Use cases return explicit result objects (never mutate input in place).
- Repositories hide serialization; facade coordinates persistence writes.
- UI hook translates domain types to simple primitives—no side effects besides scheduling next question timeout.

---
**Phase 1 Complete.** Proceed with selective component migration and adding unit tests for domain services.
