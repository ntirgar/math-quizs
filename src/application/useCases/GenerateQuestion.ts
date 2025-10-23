import { AdaptiveStrategy } from '../../domain/services/AdaptiveStrategy';
import { Question, SubskillProgressMap } from '../../domain/models';

export class GenerateQuestionUseCase {
  constructor(private strategy: AdaptiveStrategy) {}
  execute(adaptiveMode: boolean, subskillProgress: SubskillProgressMap): Question {
    if(adaptiveMode) {
      const target = this.strategy.selectTargetSubskill(subskillProgress);
      return this.strategy.generateQuestion(target);
    }
    return this.strategy.generateQuestion();
  }
}
