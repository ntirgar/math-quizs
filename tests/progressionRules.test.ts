import { describe, it, expect } from 'vitest';
import { shouldAdvanceAdditionStage, shouldAdvanceMultiplicationTable } from '@/utils/progressionRules';

describe('Addition Stage Advancement', () => {
  it('does not advance when correct below threshold', () => {
    expect(shouldAdvanceAdditionStage({ correct: 10, attempts: 10 }, 40, 0.9)).toBe(false);
  });
  it('does not advance when accuracy below threshold', () => {
    expect(shouldAdvanceAdditionStage({ correct: 40, attempts: 60 }, 40, 0.9)).toBe(false);
  });
  it('advances when both thresholds met', () => {
    expect(shouldAdvanceAdditionStage({ correct: 40, attempts: 44 }, 40, 0.9)).toBe(true);
  });
});

describe('Multiplication Table Advancement', () => {
  it('does not advance if entry undefined', () => {
    expect(shouldAdvanceMultiplicationTable(undefined, 12, 0.9)).toBe(false);
  });
  it('does not advance when correct below required', () => {
    expect(shouldAdvanceMultiplicationTable({ correct: 11, attempts: 11 }, 12, 0.9)).toBe(false);
  });
  it('does not advance when accuracy below required', () => {
    expect(shouldAdvanceMultiplicationTable({ correct: 12, attempts: 20 }, 12, 0.9)).toBe(false);
  });
  it('advances when thresholds met', () => {
    expect(shouldAdvanceMultiplicationTable({ correct: 12, attempts: 13 }, 12, 0.9)).toBe(true);
  });
});
