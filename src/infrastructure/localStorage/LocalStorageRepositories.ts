import { Mistake, ProgressMap, SubskillProgressMap, SettingsState, StreakState } from '../../domain/models';
import { QuizHistoryRepository, SubskillProgressRepository, SettingsRepository, StreakRepository } from '../../domain/repositories/Repositories';

const safeParse = <T>(key: string, fallback: T): T => {
  try { const raw = localStorage.getItem(key); if(!raw) return fallback; return JSON.parse(raw) as T; } catch { return fallback; }
};

export class LocalStorageQuizHistoryRepository implements QuizHistoryRepository {
  loadProgress(): ProgressMap { return safeParse<ProgressMap>('progress', {}); }
  saveProgress(p: ProgressMap): void { localStorage.setItem('progress', JSON.stringify(p)); }
  loadMistakes(): Mistake[] { 
    const arr = safeParse<Mistake[]>('mistakes', []);
    return arr.map(m => ({ ...m, question: m.question || m.questionKey }));
  }
  saveMistakes(m: Mistake[]): void { localStorage.setItem('mistakes', JSON.stringify(m)); }
  clearProgress(): void { localStorage.removeItem('progress'); }
  clearMistakes(): void { localStorage.removeItem('mistakes'); }
}

export class LocalStorageSubskillProgressRepository implements SubskillProgressRepository {
  load(): SubskillProgressMap { return safeParse<SubskillProgressMap>('subskillProgress', {}); }
  save(s: SubskillProgressMap): void { localStorage.setItem('subskillProgress', JSON.stringify(s)); }
}

export class LocalStorageSettingsRepository implements SettingsRepository {
  loadSettings(): SettingsState {
    return {
      audioEnabled: safeParse<boolean>('audioEnabled', true),
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
    };
  }
  saveSettings(s: SettingsState): void { localStorage.setItem('audioEnabled', String(s.audioEnabled)); }
}

export class LocalStorageStreakRepository implements StreakRepository {
  loadStreak(): StreakState { return safeParse<StreakState>('streakState', { streak:0, bestStreak:0 }); }
  saveStreak(s: StreakState): void { localStorage.setItem('streakState', JSON.stringify(s)); }
}
