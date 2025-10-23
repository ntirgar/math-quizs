import { Mistake, ProgressMap, SubskillProgressMap, SettingsState, StreakState, Question } from '../models';

export interface QuizHistoryRepository {
  loadProgress(): ProgressMap;
  saveProgress(p: ProgressMap): void;
  loadMistakes(): Mistake[];
  saveMistakes(m: Mistake[]): void;
  clearProgress(): void;
  clearMistakes(): void;
}

export interface SubskillProgressRepository {
  load(): SubskillProgressMap;
  save(s: SubskillProgressMap): void;
}

export interface SettingsRepository {
  loadSettings(): SettingsState;
  saveSettings(s: SettingsState): void;
}

export interface StreakRepository {
  loadStreak(): StreakState;
  saveStreak(s: StreakState): void;
}

export interface QuestionSource {
  // placeholder for persistence or external source of curated questions
  // could fetch practice queue items later
  listSeedQuestions?(): Question[];
}
