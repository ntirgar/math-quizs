import { AdaptiveStrategy } from '../domain/services/AdaptiveStrategy';
import { StreakService } from '../domain/services/StreakService';
import { LocalStorageQuizHistoryRepository, LocalStorageSettingsRepository, LocalStorageSubskillProgressRepository, LocalStorageStreakRepository } from '../infrastructure/localStorage/LocalStorageRepositories';
import { GenerateQuestionUseCase } from './useCases/GenerateQuestion';
import { SubmitAnswerUseCase, SubmitAnswerResult } from './useCases/SubmitAnswer';
import { ClearHistoryUseCase } from './useCases/ClearHistory';
import { LoadQuestionUseCase } from './useCases/LoadQuestion';
import { Question, SubskillProgressMap, ProgressMap, Mistake, StreakState, SettingsState } from '../domain/models';

export class QuizFacade {
  private adaptive = new AdaptiveStrategy();
  private streakSvc = new StreakService();
  private quizRepo = new LocalStorageQuizHistoryRepository();
  private subskillRepo = new LocalStorageSubskillProgressRepository();
  private settingsRepo = new LocalStorageSettingsRepository();
  private streakRepo = new LocalStorageStreakRepository();

  private generateUC = new GenerateQuestionUseCase(this.adaptive);
  private submitUC = new SubmitAnswerUseCase(this.adaptive, this.streakSvc);
  private clearUC = new ClearHistoryUseCase(this.quizRepo);
  private loadUC = new LoadQuestionUseCase();

  loadInitialState(): { question: Question; progress: ProgressMap; mistakes: Mistake[]; subskills: SubskillProgressMap; streak: StreakState; settings: SettingsState; } {
    const q = this.generateUC.execute(false, {}); // initial random
    return {
      question: q,
      progress: this.quizRepo.loadProgress(),
      mistakes: this.quizRepo.loadMistakes(),
      subskills: this.subskillRepo.load(),
      streak: this.streakRepo.loadStreak(),
      settings: this.settingsRepo.loadSettings()
    };
  }

  generateNext(adaptiveMode: boolean, subskillProgress: SubskillProgressMap): Question {
    return this.generateUC.execute(adaptiveMode, subskillProgress);
  }

  submitAnswer(params: { question: Question; userAnswer?: number; answerDigitLimit: number; subskillProgress: SubskillProgressMap; progress: ProgressMap; streak: StreakState; }): SubmitAnswerResult {
    const result = this.submitUC.execute({ ...params });
    // persistence side-effects
    this.quizRepo.saveProgress(result.updatedProgress);
    if(result.updatedMistakes.length) {
      const current = this.quizRepo.loadMistakes();
      this.quizRepo.saveMistakes([...current, ...result.updatedMistakes]);
    }
    this.subskillRepo.save(result.updatedSubskills);
    this.streakRepo.saveStreak(result.updatedStreak);
    return result;
  }

  clearProgress() { this.clearUC.clearProgress(); }
  clearMistakes() { this.clearUC.clearMistakes(); }
  clearAll() { this.clearUC.clearAll(); }

  saveSettings(s: SettingsState) { this.settingsRepo.saveSettings(s); }

  loadSpecific(num1: number, num2: number): Question { return this.loadUC.execute(num1, num2); }
}
