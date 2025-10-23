import { StreakState } from '../models';

export class StreakService {
  increment(current: StreakState): StreakState {
    const next = current.streak + 1;
    return {
      streak: next,
      bestStreak: Math.max(current.bestStreak, next)
    };
  }
  reset(current: StreakState): StreakState {
    return { streak: 0, bestStreak: current.bestStreak };
  }
  milestoneTag(state: StreakState): string | null {
    if(state.streak === 0) return null;
    if(state.streak === state.bestStreak && [5,10,20,50].includes(state.streak)) return `streak-${state.streak}`;
    if(state.streak === state.bestStreak && state.streak !== 0 && state.streak > 0) return 'new-best-streak';
    return null;
  }
}
