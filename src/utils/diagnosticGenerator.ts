// Utility to generate a diagnostic test set based on localStorage mastery gaps.
// Focus hierarchy:
// 1. Multiplication fact misses (2-9 tables) not yet at high accuracy.
// 2. Addition subskills with low correct/attempt ratios.
// 3. Recently missed addition and multiplication problems.
// Exports a function returning ordered question objects with metadata.

export interface DiagnosticQuestion {
  id: string;
  type: 'addition' | 'multiplication';
  num1: number; // addition: num1; multiplication: operand a
  num2: number; // addition: num2; multiplication: operand b
  answer: number;
  rationale: string; // description of why selected
  tags: string[]; // subskills or categories
}

interface MistakeLike { question: string; userAnswer: number; correctAnswer: number; num1?: number; num2?: number; a?: number; b?: number; timestamp: number; subskills?: string[] }

export function generateDiagnosticSet(maxItems = 15): DiagnosticQuestion[] {
  const additionMistakesRaw = localStorage.getItem('mistakes');
  const multMistakesRaw = localStorage.getItem('mult_mistakes');
  const subskillProgressRaw = localStorage.getItem('subskillProgress');
  const multProgressRaw = localStorage.getItem('mult_progress');
  const additionMistakes: MistakeLike[] = additionMistakesRaw ? safeParseArray(additionMistakesRaw) : [];
  const multMistakes: MistakeLike[] = multMistakesRaw ? safeParseArray(multMistakesRaw) : [];
  const subskillProgress: Record<string, { correct: number; attempts: number }> = subskillProgressRaw ? safeParseObj(subskillProgressRaw) : {};
  const multProgress: Record<string, number> = multProgressRaw ? safeParseObj(multProgressRaw) : {};

  const now = Date.now();

  // 1. Multiplication fact weaknesses (2-9 tables)
  const factStats: Record<string, { correct: number; attempts: number; recentMistakes: number }> = {};
  // progress counts considered correct attempts
  Object.entries(multProgress).forEach(([k,v]) => {
    const m = k.match(/^(\d+)x(\d+)$/); if (!m) return;
    const a = parseInt(m[1],10); const b = parseInt(m[2],10);
    if (a>=2 && a<=9 && b>=2 && b<=9) {
      const key = canonicalFactKey(a,b);
      if (!factStats[key]) factStats[key] = { correct:0, attempts:0, recentMistakes:0 };
      factStats[key].correct += v;
      factStats[key].attempts += v;
    }
  });
  multMistakes.forEach(m => {
    const a = (m.a ?? m.num1 ?? 0); const b = (m.b ?? m.num2 ?? 0);
    if (a>=2 && a<=9 && b>=2 && b<=9) {
      const key = canonicalFactKey(a,b);
      if (!factStats[key]) factStats[key] = { correct:0, attempts:0, recentMistakes:0 };
      factStats[key].attempts += 1;
      // weight recent mistakes higher (past 24h)
      if (now - m.timestamp < 24*60*60*1000) factStats[key].recentMistakes += 2; else factStats[key].recentMistakes += 1;
    }
  });
  const weakFacts = Object.entries(factStats)
    .map(([key,stat]) => {
      const acc = stat.attempts ? stat.correct / stat.attempts : 0;
      return { key, stat, acc, score: (1-acc) * 0.7 + (stat.recentMistakes>0 ? 0.3 : 0) };
    })
    .filter(f => f.acc < 0.95) // not mastered
    .sort((a,b)=> b.score - a.score)
    .slice(0, Math.ceil(maxItems * 0.4));

  // 2. Addition subskill weaknesses
  const subskillEntries = Object.entries(subskillProgress)
    .map(([id, s]) => ({ id, correct: s.correct, attempts: s.attempts, acc: s.attempts? s.correct/s.attempts:0 }))
    .filter(e => e.attempts >= 3 && e.acc < 0.85)
    .sort((a,b)=> a.acc - b.acc)
    .slice(0, Math.ceil(maxItems * 0.3));

  // 3. Recent mistakes (addition & multiplication)
  const recentAdd = additionMistakes.slice(-50);
  const recentMult = multMistakes.slice(-50);
  const combinedRecent = [...recentAdd, ...recentMult]
    .sort((a,b)=> b.timestamp - a.timestamp)
    .slice(0, Math.ceil(maxItems * 0.4));

  const questions: DiagnosticQuestion[] = [];

  // Build questions for weak multiplication facts deterministically
  weakFacts.forEach(f => {
    const [aStr,bStr] = f.key.split('x');
    const a = parseInt(aStr,10); const b = parseInt(bStr,10);
    questions.push({
      id: `mult-fact-${a}-${b}`,
      type:'multiplication',
      num1:a, num2:b,
      answer:a*b,
      rationale:`Weak fact (accuracy ${(f.acc*100).toFixed(0)}%)`,
      tags:['fact','multiplication']
    });
  });

  // Addition subskill targeted generator (simplified heuristics)
  subskillEntries.forEach(s => {
    const q = generateAdditionForSubskill(s.id);
    questions.push({
      id:`add-sub-${s.id}-${questions.length}`,
      type:'addition',
      num1:q.num1,
      num2:q.num2,
      answer:q.num1 + q.num2,
      rationale:`Subskill ${s.id} low accuracy ${(s.acc*100).toFixed(0)}%`,
      tags:['addition',s.id]
    });
  });

  // Recent mistakes reinforcement (avoid duplicates already chosen)
  for (const m of combinedRecent) {
    if (questions.length >= maxItems) break;
    const isMult = !!(m.a || m.num1 && m.question.includes('x'));
    const a = isMult ? (m.a ?? m.num1 ?? 0) : (m.num1 ?? 0);
    const b = isMult ? (m.b ?? m.num2 ?? 0) : (m.num2 ?? 0);
    const id = `${isMult? 'mult':'add'}-recent-${a}-${b}-${m.timestamp}`;
    if (questions.some(q => q.id === id)) continue;
    questions.push({
      id,
      type: isMult ? 'multiplication':'addition',
      num1:a,
      num2:b,
      answer: m.correctAnswer,
      rationale:'Recent miss reinforcement',
      tags:['recent','reinforce']
    });
  }

  // Trim to maxItems
  return questions.slice(0, maxItems);
}

function canonicalFactKey(a:number,b:number) { return a<=b? `${a}x${b}`:`${b}x${a}`; }
function safeParseArray(raw: string): MistakeLike[] { try { const p = JSON.parse(raw); return Array.isArray(p)? p as MistakeLike[]: []; } catch { return []; } }
function safeParseObj<T extends Record<string, unknown>>(raw: string): T { try { const parsed = JSON.parse(raw); return (parsed && typeof parsed === 'object') ? parsed as T : {} as T; } catch { return {} as T; } }

// Minimal heuristics for addition subskill question targeting (reuse logic subsets from existing hook but simplified)
function generateAdditionForSubskill(id: string): { num1: number; num2: number } {
  const rand = (min:number,max:number)=> Math.floor(Math.random()*(max-min+1))+min;
  switch(id){
    case 'facts-0-9': return { num1: rand(0,9), num2: rand(0,9) };
    case 'carry-trigger': {
      let n1 = rand(10,99); let n2 = rand(10,99);
      while (((n1%10)+(n2%10))<10) { n1 = rand(10,99); n2 = rand(10,99); }
      return { num1:n1, num2:n2 };
    }
    case 'carry-propagation': return { num1: 87, num2: 58 };
    case 'final-carry': return { num1: 450, num2: 650 };
    case 'place-alignment': return Math.random()<0.5? { num1:7, num2: 123}:{ num1:123, num2:7 };
    case 'zero-identity': return { num1: 30, num2: 7 };
    case 'multi-digit-flow': return { num1: rand(100,999), num2: rand(100,999) };
    default: return { num1: rand(0,99), num2: rand(0,99) };
  }
}
