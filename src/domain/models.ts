// Domain model definitions (Entities / Value Objects)
export interface Question {
  readonly num1: number;
  readonly num2: number;
  readonly answer: number;
  readonly targetSubskill?: string;
}

export interface Mistake {
  readonly questionKey: string; // e.g. "12+45"
  readonly question?: string; // backward compat for UI expecting 'question'
  readonly userAnswer: number;
  readonly correctAnswer: number;
  readonly num1: number;
  readonly num2: number;
  readonly timestamp: number;
  readonly subskills: string[];
  readonly mistakeTypes: string[]; // derived classifications
}

export interface SubskillProgressItem {
  correct: number;
  attempts: number;
}

export type SubskillProgressMap = Record<string, SubskillProgressItem>;
export type ProgressMap = Record<string, number>; // questionKey -> correct count

export interface AttemptResult {
  question: Question;
  userAnswer?: number; // undefined if answer shown
  isCorrect: boolean | null; // null means learning/no input mode
  wasEvaluated: boolean; // false if long answer auto-shown
}

export interface AdaptiveProfile {
  adaptiveMode: boolean;
  subskillProgress: SubskillProgressMap;
}

export interface StreakState {
  streak: number;
  bestStreak: number;
}

export interface SettingsState {
  audioEnabled: boolean;
  reducedMotion?: boolean;
}

export interface QuizStateSnapshot {
  currentQuestion: Question;
  progress: ProgressMap;
  mistakes: Mistake[];
  subskillProgress: SubskillProgressMap;
  streak: StreakState;
  settings: SettingsState;
}
