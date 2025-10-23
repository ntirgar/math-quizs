import { AdaptiveStrategy } from '../../domain/services/AdaptiveStrategy';
import { Mistake, Question, ProgressMap, SubskillProgressMap, StreakState } from '../../domain/models';
import { StreakService } from '../../domain/services/StreakService';

export interface SubmitAnswerInput {
  question: Question;
  userAnswer?: number; // undefined if long answer auto-show
  answerDigitLimit: number; // threshold distinguishing free-show vs input
  subskillProgress: SubskillProgressMap;
  progress: ProgressMap;
  streak: StreakState;
}

export interface SubmitAnswerResult {
  updatedProgress: ProgressMap;
  updatedMistakes: Mistake[]; // append only new mistake if any
  updatedSubskills: SubskillProgressMap;
  updatedStreak: StreakState;
  celebrationTag: string | null;
  isCorrect: boolean | null;
}

export class SubmitAnswerUseCase {
  constructor(private strategy: AdaptiveStrategy, private streakSvc: StreakService) {}
  execute(input: SubmitAnswerInput): SubmitAnswerResult {
    const { question, userAnswer, answerDigitLimit, subskillProgress, progress, streak } = input;
    const answerDigits = question.answer.toString().length;

    let isCorrect: boolean | null = null;
  const updatedProgress = { ...progress };
  const updatedSubskills = { ...subskillProgress };
    let updatedMistakes: Mistake[] = [];
    let updatedStreak = { ...streak };
    let celebrationTag: string | null = null;

    const classification = this.strategy.classify(question.num1, question.num2);

    if(answerDigits <= answerDigitLimit) {
      // evaluatable
      isCorrect = userAnswer === question.answer;
      if(isCorrect) {
        // progress
        const key = `${question.num1}+${question.num2}`;
        updatedProgress[key] = (updatedProgress[key] || 0) + 1;
        // subskills
        classification.forEach(id => {
          if(!updatedSubskills[id]) updatedSubskills[id] = { correct:0, attempts:0 }; 
          updatedSubskills[id].correct += 1; 
          updatedSubskills[id].attempts += 1;
        });
        // streak
        updatedStreak = this.streakSvc.increment(updatedStreak);
        celebrationTag = this.streakSvc.milestoneTag(updatedStreak);
      } else {
        // attempt incorrect
        classification.forEach(id => {
          if(!updatedSubskills[id]) updatedSubskills[id] = { correct:0, attempts:0 }; 
          updatedSubskills[id].attempts += 1;
        });
        if(updatedStreak.streak !== 0) updatedStreak = this.streakSvc.reset(updatedStreak);
        const key = `${question.num1}+${question.num2}`;
        const mistake: Mistake = {
          questionKey: key,
          question: key,
          userAnswer: userAnswer ?? 0,
          correctAnswer: question.answer,
          num1: question.num1,
          num2: question.num2,
          timestamp: Date.now(),
          subskills: classification,
          mistakeTypes: []
        };
        updatedMistakes = [mistake];
      }
    } else {
      // learning mode (long answer auto-show)
      isCorrect = null;
    }

    return { updatedProgress, updatedMistakes, updatedSubskills, updatedStreak, celebrationTag, isCorrect };
  }
}
