export interface SingleDigitStats { correct: number; attempts: number }
export function shouldAdvanceAdditionStage(stats: SingleDigitStats, requiredCorrect: number, requiredAccuracy: number): boolean {
  if (stats.correct < requiredCorrect) return false;
  const acc = stats.attempts > 0 ? stats.correct / stats.attempts : 0;
  return acc >= requiredAccuracy;
}

export interface TableProgressEntry { correct: number; attempts: number }
export function shouldAdvanceMultiplicationTable(entry: TableProgressEntry | undefined, requiredCorrect: number, requiredAccuracy: number): boolean {
  if (!entry) return false;
  if (entry.correct < requiredCorrect) return false;
  const acc = entry.attempts > 0 ? entry.correct / entry.attempts : 0;
  return acc >= requiredAccuracy;
}
