import { Question } from '../../domain/models';

export class LoadQuestionUseCase {
  execute(num1: number, num2: number): Question {
    return { num1, num2, answer: num1 + num2 };
  }
}
