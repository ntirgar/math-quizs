// Shared adaptive engine utilities for addition & multiplication.
// Provides subskill target-based selection and targeted question generators.
// This consolidates duplicated logic from `useQuizLogic` and `useMultiplicationQuizLogic`.

export interface SubskillStats { correct: number; attempts: number }
export type SubskillProgressMap = Record<string, SubskillStats>;

// Targets for addition subskills (mirrors MistakeAnalysis & AdaptiveStrategy)
export const ADDITION_SUBSKILL_TARGETS: Record<string, number> = {
  'facts-0-9': 10,
  'carry-trigger': 12,
  'carry-propagation': 12,
  'final-carry': 6,
  'place-alignment': 10,
  'zero-identity': 6,
  'multi-digit-flow': 14
};

// Targets for multiplication subskills
export const MULT_SUBSKILL_TARGETS: Record<string, number> = {
  'facts-0-10': 20,
  'facts-11-12': 16,
  'zero-one-laws': 10,
  'square-numbers': 14,
  'commutativity-recognition': 18,
  'distribution-anchor': 12,
  'multi-digit-flow-mult': 20
};

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export interface AdditionQuestion { num1: number; num2: number; answer: number; targetSubskill?: string }
export interface MultiplicationQuestion { a: number; b: number; answer: number; targetSubskill?: string }

// Generic target selection ranking unmastered subskills by remaining correct needed then by accuracy.
export function selectTargetSubskill(progress: SubskillProgressMap, targets: Record<string, number>): string | undefined {
  const entries = Object.entries(progress).map(([id, stats]) => {
    const target = targets[id] || 10;
    const remaining = Math.max(0, target - stats.correct);
    const pct = stats.correct / Math.max(1, stats.attempts);
    return { id, remaining, pct };
  });
  // include any not yet started subskills
  Object.keys(targets).forEach(id => { if (!progress[id]) entries.push({ id, remaining: targets[id], pct: 0 }); });
  const filtered = entries.filter(e => e.remaining > 0)
    .sort((a,b) => b.remaining - a.remaining || a.pct - b.pct);
  return filtered[0]?.id;
}

// Targeted addition question generation
export function generateTargetedAddition(subskill: string): AdditionQuestion {
  let num1 = 0, num2 = 0;
  switch (subskill) {
    case 'facts-0-9':
      num1 = rand(0,9); num2 = rand(0,9); break;
    case 'carry-trigger':
      num1 = rand(10,99); num2 = rand(10,99); while(((num1%10)+(num2%10))<10){ num1=rand(10,99); num2=rand(10,99);} break;
    case 'carry-propagation':
      const onesPair = [[8,7],[9,6],[9,8]][rand(0,2)];
      const tensPair = [[8,7],[9,6],[7,5]][rand(0,2)];
      num1 = tensPair[0]*10 + onesPair[0];
      num2 = tensPair[1]*10 + onesPair[1];
      break;
    case 'final-carry':
      const base = rand(5,9) * 100;
      num1 = base; num2 = rand(5,9)*100; break;
    case 'place-alignment':
      num1 = rand(1,9); num2 = rand(100,999); if (Math.random()<0.5) [num1,num2] = [num2,num1]; break;
    case 'zero-identity':
      const tens = rand(1,9)*10; const units = rand(1,9); if(Math.random()<0.5){ num1=tens; num2=units; } else { num1=units; num2=tens; } break;
    case 'multi-digit-flow':
      num1 = rand(100,999); num2 = rand(100,999); break;
    default:
      return generateRandomAddition();
  }
  return { num1, num2, answer: num1 + num2, targetSubskill: subskill };
}

// Targeted multiplication question generation
export function generateTargetedMultiplication(subskill: string): MultiplicationQuestion {
  let a=0,b=0;
  switch(subskill) {
    case 'facts-0-10': a=rand(0,10); b=rand(0,10); break;
    case 'facts-11-12': a=rand(11,12); b=rand(2,12); break;
    case 'zero-one-laws': a=rand(0,1); b=rand(2,12); if(Math.random()<0.5)[a,b]=[b,a]; break;
    case 'square-numbers': a=rand(2,12); b=a; break;
    case 'commutativity-recognition': a=rand(2,12); b=rand(2,12); if(a===b) b=((a+rand(1,10))%12)+1; break;
    case 'distribution-anchor': a=rand(2,9); b=10+rand(1,2); if(Math.random()<0.5)[a,b]=[b,a]; break;
    case 'multi-digit-flow-mult': a=rand(10,25); b=rand(10,25); break;
    default: return generateRandomMultiplication();
  }
  return { a, b, answer: a*b, targetSubskill: subskill };
}

export function generateRandomAddition(): AdditionQuestion {
  const num1 = rand(0,999); const num2 = rand(0,999); return { num1, num2, answer: num1 + num2 };
}
export function generateRandomMultiplication(): MultiplicationQuestion {
  const a = rand(0,12); const b = rand(0,12); return { a, b, answer: a*b };
}

export function nextAdaptiveAddition(progress: SubskillProgressMap, enabled: boolean) {
  if(!enabled) return generateRandomAddition();
  const target = selectTargetSubskill(progress, ADDITION_SUBSKILL_TARGETS);
  if(target) return generateTargetedAddition(target);
  return generateRandomAddition();
}

export function nextAdaptiveMultiplication(progress: SubskillProgressMap, enabled: boolean) {
  if(!enabled) return generateRandomMultiplication();
  const target = selectTargetSubskill(progress, MULT_SUBSKILL_TARGETS);
  if(target) return generateTargetedMultiplication(target);
  return generateRandomMultiplication();
}
