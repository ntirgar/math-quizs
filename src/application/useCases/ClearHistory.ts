import { QuizHistoryRepository } from '../../domain/repositories/Repositories';

export class ClearHistoryUseCase {
  constructor(private repo: QuizHistoryRepository) {}
  clearProgress() { this.repo.clearProgress(); }
  clearMistakes() { this.repo.clearMistakes(); }
  clearAll() { this.clearProgress(); this.clearMistakes(); }
}
