import { Question, SubskillProgressMap } from '../models';
import { classifyQuestion } from '../../utils/subskillClassifier';

const SUBSKILL_TARGETS: Record<string, number> = {
  'facts-0-9': 10,
  'carry-trigger': 12,
  'carry-propagation': 12,
  'final-carry': 6,
  'place-alignment': 10,
  'zero-identity': 6,
  'multi-digit-flow': 14
};

export interface IAdaptiveStrategy {
  selectTargetSubskill(progress: SubskillProgressMap): string | undefined;
  generateQuestion(target?: string): Question;
}

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

function generateRandomQuestion(): Question {
  const num1 = Math.floor(Math.random() * 1000);
  const num2 = Math.floor(Math.random() * 1000);
  return { num1, num2, answer: num1 + num2 };
}

function generateTargetedQuestion(subskill: string): Question {
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
      const base = rand(5,9) * Math.pow(10,2); // hundreds
      num1 = base; num2 = rand(5,9)*100; break;
    case 'place-alignment':
      num1 = rand(1,9); num2 = rand(100,999); if(Math.random()<0.5)[num1,num2]=[num2,num1]; break;
    case 'zero-identity':
      const tens = rand(1,9)*10; const units = rand(1,9); if(Math.random()<0.5){ num1=tens; num2=units;} else { num1=units; num2=tens;} break;
    case 'multi-digit-flow':
      num1 = rand(100,999); num2 = rand(100,999); break;
    default:
      return generateRandomQuestion();
  }
  return { num1, num2, answer: num1 + num2, targetSubskill: subskill };
}

export class AdaptiveStrategy implements IAdaptiveStrategy {
  selectTargetSubskill(progress: SubskillProgressMap): string | undefined {
    const masteryEntries = Object.entries(progress).map(([id, stats]) => {
      const target = SUBSKILL_TARGETS[id] || 10;
      const remaining = Math.max(0, target - stats.correct);
      const pct = stats.correct / Math.max(1, stats.attempts);
      return { id, remaining, pct };
    });
    Object.keys(SUBSKILL_TARGETS).forEach(id => {
      if(!progress[id]) masteryEntries.push({ id, remaining: SUBSKILL_TARGETS[id], pct: 0 });
    });
    const filtered = masteryEntries.filter(e => e.remaining > 0)
      .sort((a,b) => b.remaining - a.remaining || a.pct - b.pct);
    return filtered[0]?.id;
  }
  generateQuestion(target?: string): Question {
    if(target) return generateTargetedQuestion(target);
    return generateRandomQuestion();
  }
  classify(num1: number, num2: number): string[] {
    return classifyQuestion(num1, num2);
  }
}
