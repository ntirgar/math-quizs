"use client";
import { Card, Heading, Text, Flex, Badge, Box, Separator, Grid } from '@radix-ui/themes';
import { useState } from 'react';

// Generic mistake shape supporting both addition and multiplication.
// For multiplication we map a,b to num1,num2 for some shared UI but retain operator flag for logic branching.
interface MistakeEntry {
  question: string;
  userAnswer: number;
  correctAnswer: number;
  // Addition operands
  num1?: number;
  num2?: number;
  // Multiplication operands (will be copied into num1/num2 when needed for layout)
  a?: number;
  b?: number;
  mistakeType: string[];
  timestamp: number;
  operator?: 'addition' | 'multiplication';
  subskills?: string[]; // optional subskill tags from classifiers
}

interface RootCause {
  code: string;
  label: string;
  explanation: string;
  practiceTip: string;
  severity: 'low' | 'medium' | 'high';
}

interface DigitIssue {
  code: string; // e.g. missedCarryIn, incorrectSum, placeValueSwap
  description: string;
  severity: 'low' | 'medium' | 'high';
}

interface DigitAnalysisRow {
  place: string;          // ones, tens, hundreds, thousands, etc.
  a: number;              // num1 digit
  b: number;              // num2 digit
  carryIn: number;        // expected carry coming in
  sum: number;            // a + b + carryIn
  expectedDigit: number;  // sum % 10
  expectedCarryOut: number; // Math.floor(sum/10)
  userDigit: number | null; // user digit (null if missing)
  issues: DigitIssue[];   // issues detected at this column
}

interface MistakeAnalysisProps {
  mistakes: MistakeEntry[]; // unified list (both operations)
}

interface SkillGap {
  skill: string;
  description: string;
  count: number;
  examples: string[];
  severity: 'low' | 'medium' | 'high';
}

export function MistakeAnalysis({ mistakes }: MistakeAnalysisProps) {
  const [showDigitDetails, setShowDigitDetails] = useState(true);
  const [showPercent, setShowPercent] = useState(false); // toggle counts vs percent for bars
  if (mistakes.length === 0) {
    return (
      <Card size="3" mt="6">
        <Heading size="5" mb="4">Learning Analysis</Heading>
        <Text size="2" color="gray">
          Complete more problems to see your learning analysis and personalized recommendations!
        </Text>
      </Card>
    );
  }

  // Analyze mistakes to identify skill gaps
  const analyzeSkillGaps = (): SkillGap[] => {
    const skillCounts: { [key: string]: { count: number; examples: string[] } } = {};
    mistakes.forEach(mistake => {
      const op = mistake.operator || (mistake.question.includes('x') || mistake.question.includes('×') ? 'multiplication':'addition');
      const left = op === 'addition' ? (mistake.num1 ?? mistake.a ?? 0) : (mistake.a ?? mistake.num1 ?? 0);
      const right = op === 'addition' ? (mistake.num2 ?? mistake.b ?? 0) : (mistake.b ?? mistake.num2 ?? 0);
      mistake.mistakeType.forEach(type => {
        if (!skillCounts[type]) skillCounts[type] = { count: 0, examples: [] };
        skillCounts[type].count++;
        const symbol = op === 'addition' ? '+' : '×';
        skillCounts[type].examples.push(`${left} ${symbol} ${right} = ${mistake.correctAnswer} (you put ${mistake.userAnswer})`);
      });
    });

    const skillDefinitions: { [key: string]: { description: string; severity: 'low' | 'medium' | 'high' } } = {
      // Addition taxonomy
      'carryingError': { description: 'Difficulty with carrying over when digits sum to 10 or more', severity: 'high' },
      'placeValueError': { description: 'Confusion about place values (ones, tens, hundreds)', severity: 'high' },
      'basicFactsError': { description: 'Need practice with basic addition facts (0-9)', severity: 'medium' },
      'regroupingError': { description: 'Trouble with regrouping / carrying across columns', severity: 'high' },
      'alignmentError': { description: 'Numbers not properly aligned by place value', severity: 'medium' },
      'zeroHandlingError': { description: 'Confusion when adding with zeros', severity: 'low' },
      'multiDigitError': { description: 'General difficulty with multi-digit addition', severity: 'medium' },
      // Multiplication taxonomy
      'factsRecallError': { description: 'Struggles recalling core multiplication facts', severity: 'medium' },
      'zeroOneLawError': { description: 'Misapplies zero or one multiplication laws', severity: 'low' },
      'squareRecognitionError': { description: 'Missed leveraging equal factors (squares)', severity: 'low' },
      'commutativityConfusion': { description: 'Does not recognize a×b equals b×a for recall leverage', severity: 'medium' },
      'distributionOpportunityMissed': { description: 'Could simplify using distributive (e.g. 9×6 as 10×6 − 6)', severity: 'low' },
      'multiDigitStructureError': { description: 'Difficulty with multi-digit multiplication structure', severity: 'high' }
    };

    return Object.entries(skillCounts).map(([skill, data]) => ({
      skill,
      description: skillDefinitions[skill]?.description || 'General addition difficulty',
      count: data.count,
      examples: data.examples.slice(0, 3), // Show up to 3 examples
      severity: skillDefinitions[skill]?.severity || 'medium'
    })).sort((a, b) => b.count - a.count);
  };

  // Identify mistake types based on the specific error (broad taxonomy)
  const identifyAdditionMistakeTypes = (num1: number, num2: number, userAnswer: number, correctAnswer: number): string[] => {
    const types: string[] = [];
    
    // Convert to strings for digit analysis
    const userStr = userAnswer.toString();
    const correctStr = correctAnswer.toString();
    const num1Str = num1.toString();
    const num2Str = num2.toString();
    
    // Check for carrying errors
    let carryNeeded = false;
    const maxLen = Math.max(num1Str.length, num2Str.length);
    for (let i = 0; i < maxLen; i++) {
      const digit1 = parseInt(num1Str[num1Str.length - 1 - i] || '0');
      const digit2 = parseInt(num2Str[num2Str.length - 1 - i] || '0');
      if (digit1 + digit2 >= 10) {
        carryNeeded = true;
        break;
      }
    }
    
    if (carryNeeded && userAnswer !== correctAnswer) {
      types.push('carryingError');
      types.push('regroupingError');
    }
    
    // Check for place value errors (wrong number of digits)
    if (userStr.length !== correctStr.length) {
      types.push('placeValueError');
    }
    
    // Check for basic facts errors (single digit problems)
    if (num1 < 10 && num2 < 10 && userAnswer !== correctAnswer) {
      types.push('basicFactsError');
    }
    
    // Check for zero handling errors
    if ((num1 === 0 || num2 === 0 || num1 % 10 === 0 || num2 % 10 === 0) && userAnswer !== correctAnswer) {
      types.push('zeroHandlingError');
    }
    
    // Check for multi-digit complexity
    if ((num1 >= 10 || num2 >= 10) && userAnswer !== correctAnswer) {
      types.push('multiDigitError');
    }
    
    // Check for alignment issues (common when answer is off by factor of 10)
    const ratio = correctAnswer / userAnswer;
    if (ratio === 10 || ratio === 0.1 || ratio === 100 || ratio === 0.01) {
      types.push('alignmentError');
      types.push('placeValueError');
    }
    
    return types.length > 0 ? types : ['generalError'];
  };

  const identifyMultiplicationMistakeTypes = (a: number, b: number, userAnswer: number, correctAnswer: number): string[] => {
    const types: string[] = [];
    if (userAnswer !== correctAnswer) {
      // Fact recall for single-digit region
      if (a <= 12 && b <= 12) types.push('factsRecallError');
      // zero / one law
      if ((a === 0 || b === 0 || a === 1 || b === 1) && userAnswer !== correctAnswer) types.push('zeroOneLawError');
      // squares
      if (a === b && a > 1 && a <= 12) types.push('squareRecognitionError');
      // commutativity confusion heuristic: if user answer equals some nearby permutation? (skip complex detection; mark when factors differ)
      if (a !== b && a <= 12 && b <= 12) types.push('commutativityConfusion');
      // distribution opportunity: when one factor near 10 (8,9,11) suggest strategy
      if ([8,9,11].includes(a) || [8,9,11].includes(b)) types.push('distributionOpportunityMissed');
      // multi-digit structure (if any factor >= 10)
      if (a >= 10 || b >= 10) types.push('multiDigitStructureError');
    }
    return types.length ? types : ['generalError'];
  };

  // Fine-grained root cause detection (column-by-column analysis)
  const detectAdditionRootCauses = (num1: number, num2: number, userAnswer: number, correctAnswer: number): RootCause[] => {
    if (userAnswer === correctAnswer) return [];

    const rootCauses: RootCause[] = [];
    const d1 = num1.toString().split('').map(d => parseInt(d));
    const d2 = num2.toString().split('').map(d => parseInt(d));
    const u  = userAnswer.toString().split('').map(d => parseInt(d));
    const c  = correctAnswer.toString().split('').map(d => parseInt(d));

    // Pad arrays on the left for alignment
    const maxLen = Math.max(d1.length, d2.length, c.length, u.length);
    const pad = (arr: number[]) => Array.from({length: maxLen - arr.length}, () => 0).concat(arr);
    const p1 = pad(d1);
    const p2 = pad(d2);
    const pu = pad(u);
    const pc = pad(c);

    let carryIn = 0;
    for (let i = maxLen - 1; i >= 0; i--) {
      const a = p1[i];
      const b = p2[i];
      const correctColSum = a + b + carryIn;
      const expectedDigit = correctColSum % 10;
      const expectedCarryOut = Math.floor(correctColSum / 10);
      const userDigit = pu[i] ?? 0;

      // If mismatch in this column, analyze why
      if (userDigit !== expectedDigit) {
        // Case 1: User digit equals (a + b) % 10 but a+b>=10 and carryIn was 0 -> failed to include carry from previous column? Actually this indicates they forgot incoming carryIn.
        if (carryIn === 1 && userDigit === ((a + b) % 10)) {
          rootCauses.push({
            code: 'missedCarryIn',
            label: 'Missed incoming carry',
            explanation: `You needed to add the carry 1 from the previous column: ${a} + ${b} + 1 = ${expectedDigit} (with carry ${expectedCarryOut}), but you used ${a} + ${b} = ${(a + b)} giving digit ${(a + b) % 10}.`,
            practiceTip: 'After solving a column that makes 10 or more, say the carry out loud before moving to the next column (e.g., "carry 1").',
            severity: 'high'
          });
        }
        // Case 2: User produced a digit matching a+b+carryIn but final answer length short by one digit (missed final carry)
        if (i === 0) {
          const producedFinalCarry = expectedCarryOut === 1 && pu.length < pc.length;
          if (producedFinalCarry) {
            rootCauses.push({
              code: 'droppedFinalCarry',
              label: 'Dropped final carry',
              explanation: `The leftmost column created a new leading digit (carry 1) making the answer ${correctAnswer}, but your answer is missing that leading 1.`,
              practiceTip: 'When the leftmost column sum is 10 or more, write the full two-digit result or prefix the carry to the front.',
              severity: 'high'
            });
          }
        }
        // Case 3: User digit equals a+b (no carry generated) but a+b>=10 (failed to generate carry / incorrect regroup)
        if (carryIn === 0 && (a + b) >= 10 && userDigit === (a + b) % 10) {
          rootCauses.push({
            code: 'missedCarryOut',
            label: 'Missed creating carry',
            explanation: `In this column ${a} + ${b} = ${a + b}, which is 10 or more, so you should write ${ (a + b) % 10 } and carry 1 to the next column.`,
            practiceTip: 'Circle sums 10 or more and immediately write the carry above the next column.',
            severity: 'high'
          });
        }
        // Case 4: Column swap suspicion: user digit matches another column's correct digit
        const otherIndex = pc.findIndex((d, idx) => idx !== i && d === userDigit && pu[idx] !== d);
        if (otherIndex !== -1) {
          rootCauses.push({
            code: 'placeValueSwap',
            label: 'Place value swap',
            explanation: `The digit ${userDigit} belongs in a different place value (column ${maxLen - otherIndex} from the right) but appears here.`,
            practiceTip: 'Line up numbers carefully by ones, tens, hundreds; draw vertical guide lines if needed.',
            severity: 'medium'
          });
        }
      }

      carryIn = expectedCarryOut; // propagate correct carry, not user carry, for diagnosis
    }

    // If no specific root cause found, add a general one
    if (rootCauses.length === 0) {
      rootCauses.push({
        code: 'generalComputation',
        label: 'Computation slip',
        explanation: 'The answer differs in at least one digit; likely an arithmetic slip or skipped carry.',
        practiceTip: 'Recompute each column aloud: add digits, state total, write digit, say carry.',
        severity: 'medium'
      });
    }

    // De-duplicate by code
    const unique: { [code: string]: RootCause } = {};
    rootCauses.forEach(rc => { unique[rc.code] = rc; });
    return Object.values(unique);
  };

  // Simplified multiplication root cause hints (strategy-based rather than digit-column addition)
  const detectMultiplicationRootCauses = (a: number, b: number, userAnswer: number, correctAnswer: number): RootCause[] => {
    if (userAnswer === correctAnswer) return [];
    const causes: RootCause[] = [];
    // Missed zero/one law
    if ((a === 0 || b === 0) && userAnswer !== 0) {
      causes.push({
        code: 'zeroTimesAnything',
        label: 'Zero law',
        explanation: `Any number times 0 is 0, so ${a}×${b} should be 0.`,
        practiceTip: 'Do quick drills focusing only on ×0 and ×1 facts.',
        severity: 'low'
      });
    }
    if (((a === 1 || b === 1) && userAnswer !== (a === 1 ? b : a))) {
      causes.push({
        code: 'oneTimesAnything',
        label: 'Identity by one',
        explanation: `Multiplying by 1 leaves the other number unchanged: ${a}×${b} = ${correctAnswer}.`,
        practiceTip: 'Spot the ×1 facts and answer instantly without computation.',
        severity: 'low'
      });
    }
    // Commutativity leverage
    if (a !== b && a <= 12 && b <= 12) {
      causes.push({
        code: 'commutativityLeverage',
        label: 'Use commutativity',
        explanation: `${a}×${b} equals ${b}×${a}. If one order is easier (e.g. 3×9), flip it mentally.`,
        practiceTip: 'Write pairs both ways to internalize symmetry (e.g., 7×8 = 8×7).',
        severity: 'medium'
      });
    }
    // Distribution anchor (near ten)
    if ([8,9,11].includes(a) || [8,9,11].includes(b)) {
      causes.push({
        code: 'distributiveHint',
        label: 'Distributive strategy',
        explanation: `Break ${a}×${b} using (10±k). Example: 9×6 = (10×6) - 6.`,
        practiceTip: 'Practice rewriting near-10 facts using 10±1 and 10±2 patterns.',
        severity: 'low'
      });
    }
    // Square pattern
    if (a === b && a > 1 && a <= 12) {
      causes.push({
        code: 'squarePattern',
        label: 'Square pattern',
        explanation: `${a}×${a} is a square number (${correctAnswer}). Recognizing squares speeds recall.`,
        practiceTip: 'Memorize square numbers 2²–12² as a separate list.',
        severity: 'low'
      });
    }
    if (a >= 10 || b >= 10) {
      causes.push({
        code: 'multiDigitStructure',
        label: 'Multi-digit structure',
        explanation: `Break large factors: e.g. ${a}×${b} = (${a}×${Math.floor(b/10)*10}) + (${a}×${b%10}).`,
        practiceTip: 'Decompose one factor into tens + ones and multiply separately.',
        severity: 'high'
      });
    }
    if (!causes.length) {
      causes.push({
        code: 'generalComputation',
        label: 'Computation slip',
        explanation: 'Likely a fact recall slip; target high-frequency misses.',
        practiceTip: 'Use short spaced repetition sets for missed facts.',
        severity: 'medium'
      });
    }
    // Deduplicate
    const unique: Record<string, RootCause> = {};
    causes.forEach(c => { unique[c.code] = c; });
    return Object.values(unique);
  };

  // Per-digit detailed analysis for a single mistake
  const buildDigitAnalysis = (num1: number, num2: number, userAnswer: number, correctAnswer: number): DigitAnalysisRow[] => {
    const d1 = num1.toString().split('').map(d => parseInt(d));
    const d2 = num2.toString().split('').map(d => parseInt(d));
    const u  = userAnswer.toString().split('').map(d => parseInt(d));
    const c  = correctAnswer.toString().split('').map(d => parseInt(d));
    const maxLen = Math.max(d1.length, d2.length, c.length, u.length);
    const padLeft = (arr: number[]) => Array.from({length: maxLen - arr.length}, () => 0).concat(arr);
    const p1 = padLeft(d1);
    const p2 = padLeft(d2);
    const pu = padLeft(u);
    const pc = padLeft(c);
    const placeLabelsBase = ['ones','tens','hundreds','thousands','ten-thousands','hundred-thousands','millions'];
    const rows: DigitAnalysisRow[] = [];
    let carryIn = 0;
    for (let i = maxLen - 1; i >= 0; i--) {
      const a = p1[i];
      const b = p2[i];
      const sum = a + b + carryIn;
      const expectedDigit = sum % 10;
      const expectedCarryOut = Math.floor(sum / 10);
      const userDigit = pu[i] ?? null;
      const issues: DigitIssue[] = [];
      // Only analyze if user answer incorrect overall OR digit mismatch
      if (userAnswer !== correctAnswer) {
        if (userDigit !== expectedDigit) {
          // Missed incoming carry
            if (carryIn === 1 && userDigit === ((a + b) % 10)) {
              issues.push({ code: 'missedCarryIn', description: 'Forgot to add the incoming carry', severity: 'high' });
            }
            // Missed creating carry
            if (carryIn === 0 && (a + b) >= 10 && userDigit === ((a + b) % 10)) {
              issues.push({ code: 'missedCarryOut', description: 'Did not create the carry for this column', severity: 'high' });
            }
            // Dropped final carry (handled only on leftmost)
            if (i === 0 && expectedCarryOut === 1 && pc.length > pu.filter(d => d !== 0 || pc[0]===0).length) {
              issues.push({ code: 'droppedFinalCarry', description: 'Missed the new leftmost digit created by carry', severity: 'high' });
            }
            // Incorrect sum of digits (generic arithmetic error)
            if (userDigit !== ((a + b + carryIn) % 10)) {
              issues.push({ code: 'incorrectSum', description: 'Incorrect addition of digits in this column', severity: 'medium' });
            }
        }
      }
      rows.unshift({ // unshift so left-to-right order (thousands -> ones)
        place: placeLabelsBase[rows.length] || `10^${rows.length}`,
        a, b, carryIn, sum, expectedDigit, expectedCarryOut, userDigit, issues
      });
      carryIn = expectedCarryOut;
    }
    return rows;
  };

  // Process mistakes to add mistake types
  const processedMistakes = mistakes.map(mistake => {
    const op = mistake.operator || (mistake.question.includes('x') || mistake.question.includes('×') ? 'multiplication':'addition');
    const n1 = op === 'addition' ? (mistake.num1 ?? mistake.a ?? 0) : (mistake.a ?? mistake.num1 ?? 0);
    const n2 = op === 'addition' ? (mistake.num2 ?? mistake.b ?? 0) : (mistake.b ?? mistake.num2 ?? 0);
    const typed = op === 'addition'
      ? identifyAdditionMistakeTypes(n1, n2, mistake.userAnswer, mistake.correctAnswer)
      : identifyMultiplicationMistakeTypes(n1, n2, mistake.userAnswer, mistake.correctAnswer);
    const rootCauses = op === 'addition'
      ? detectAdditionRootCauses(n1, n2, mistake.userAnswer, mistake.correctAnswer)
      : detectMultiplicationRootCauses(n1, n2, mistake.userAnswer, mistake.correctAnswer);
    const digitAnalysis = op === 'addition'
      ? buildDigitAnalysis(n1, n2, mistake.userAnswer, mistake.correctAnswer)
      : undefined; // skip per-digit grid for multiplication
    return { ...mistake, num1: n1, num2: n2, operator: op, mistakeType: typed, rootCauses, digitAnalysis };
  });

  const skillGaps = analyzeSkillGaps();
  const recentMistakes = processedMistakes.slice(-5); // Show last 5 mistakes

  // Aggregate digit-level issue frequencies
  const digitIssueAggregate: Record<string, { count: number; severity: 'low'|'medium'|'high' }> = {};
  processedMistakes.forEach(m => {
    if (m.operator === 'addition' && m.digitAnalysis) {
      m.digitAnalysis.forEach(r => {
        r.issues.forEach(issue => {
          if (!digitIssueAggregate[issue.code]) digitIssueAggregate[issue.code] = { count: 0, severity: issue.severity };
          digitIssueAggregate[issue.code].count++;
        });
      });
    }
  });
  const digitIssueList = Object.entries(digitIssueAggregate)
    .map(([code, data]) => ({ code, ...data }))
    .sort((a,b) => b.count - a.count);

  // ---------- Visualization Data Prep ----------
  // Skill gap chart data
  const skillGapChart = skillGaps.map(g => ({
    label: g.skill,
    count: g.count,
    severity: g.severity
  }));
  const maxSkillGapCount = Math.max(1, ...skillGapChart.map(s => s.count));
  const totalSkillGapCount = skillGapChart.reduce((acc, s) => acc + s.count, 0);

  // Place (ones/tens/...) heatmap from digitAnalysis
  const placeErrorCounts: Record<string, number> = {};
  processedMistakes.forEach(m => {
    if (m.operator === 'addition') {
      m.digitAnalysis?.forEach(r => {
        if (r.issues.length > 0) {
          placeErrorCounts[r.place] = (placeErrorCounts[r.place] || 0) + 1;
        }
      });
    }
  });
  const placeLabelsOrdered = ['ones','tens','hundreds','thousands','ten-thousands','hundred-thousands','millions'];
  const maxPlaceError = Math.max(1, ...Object.values(placeErrorCounts));

  // Utility to determine bar / heat color
  const severityHue = (sev: string) => {
    switch (sev) {
      case 'high': return 0; // red
      case 'medium': return 30; // orange
      case 'low': return 50; // yellow-ish
      default: return 210; // gray/blue neutral
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'yellow';
      default: return 'gray';
    }
  };

  const getRecommendations = (skillGaps: SkillGap[]): string[] => {
    const recommendations: string[] = [];
    
    skillGaps.forEach(gap => {
      switch (gap.skill) {
        case 'carryingError':
          recommendations.push('Practice carrying with manipulatives or visual aids');
          recommendations.push('Start with simple carrying problems (like 9+2, 8+5)');
          break;
        case 'placeValueError':
          recommendations.push('Review place value concepts with base-10 blocks');
          recommendations.push('Practice identifying ones, tens, hundreds places');
          break;
        case 'basicFactsError':
          recommendations.push('Memorize basic addition facts 0-9');
          recommendations.push('Use flashcards or math fact games');
          break;
        case 'regroupingError':
          recommendations.push('Practice regrouping with hands-on materials');
          recommendations.push('Break down problems step by step');
          break;
        case 'zeroHandlingError':
          recommendations.push('Practice addition problems with zeros');
          recommendations.push('Understand that adding zero keeps numbers the same');
          break;
      }
    });
    
    return [...new Set(recommendations)]; // Remove duplicates
  };

  const recommendations = getRecommendations(skillGaps);

  // Map low-level digit issues and broader skill gaps into foundational subskills
  interface SubSkill {
    id: string;
    label: string;
    description: string;
    category: 'facts' | 'placeValue' | 'carrying' | 'alignment' | 'general';
    prerequisiteIds: string[];
    evidence: string[]; // sample evidence strings
    severity: 'low' | 'medium' | 'high';
    weight: number; // used for prioritization
  }

  const deriveSubSkills = (): SubSkill[] => {
    // Helper maps
    const issueFreq = (code: string) => digitIssueList.find(i => i.code === code)?.count || 0;
    const hasSkill = (skill: string) => skillGaps.some(g => g.skill === skill);

    const subs: SubSkill[] = [];

    // Single-digit fact fluency
    if (hasSkill('basicFactsError') || issueFreq('incorrectSum') > 2) {
      subs.push({
        id: 'facts-0-9',
        label: 'Instant recall of 0-9 addition facts',
        description: 'Quickly know sums like 7+5 or 8+6 without counting fingers.',
        category: 'facts',
        prerequisiteIds: [],
        evidence: skillGaps.filter(g => g.skill === 'basicFactsError').flatMap(g => g.examples.slice(0,1)),
        severity: hasSkill('basicFactsError') ? 'medium' : 'low',
        weight: 60
      });
    }

    // Carry trigger recognition
    if (hasSkill('carryingError') || issueFreq('missedCarryOut') > 0) {
      subs.push({
        id: 'carry-trigger',
        label: 'Recognize when a column creates a carry',
        description: 'Immediately notice when two digits sum to 10 or more (e.g. 8+7).',
        category: 'carrying',
        prerequisiteIds: ['facts-0-9'],
        evidence: digitIssueList.filter(d => d.code === 'missedCarryOut').map(d => `${d.code} (${d.count}x)`),
        severity: 'high',
        weight: 90
      });
    }

    // Carry propagation (incoming carry)
    if (issueFreq('missedCarryIn') > 0) {
      subs.push({
        id: 'carry-propagation',
        label: 'Add incoming carry correctly',
        description: 'When previous column generated a carry, add that 1 before writing the digit.',
        category: 'carrying',
        prerequisiteIds: ['carry-trigger'],
        evidence: digitIssueList.filter(d => d.code === 'missedCarryIn').map(d => `${d.code} (${d.count}x)`),
        severity: 'high',
        weight: 95
      });
    }

    // Final carry writing
    if (issueFreq('droppedFinalCarry') > 0) {
      subs.push({
        id: 'final-carry',
        label: 'Write leading digit from final carry',
        description: 'Ensure a new leftmost digit is written when the last addition produces a carry.',
        category: 'carrying',
        prerequisiteIds: ['carry-propagation'],
        evidence: digitIssueList.filter(d => d.code === 'droppedFinalCarry').map(d => `${d.code} (${d.count}x)`),
        severity: 'high',
        weight: 85
      });
    }

    // Place value alignment
    if (hasSkill('placeValueError') || hasSkill('alignmentError') || issueFreq('placeValueSwap') > 0) {
      subs.push({
        id: 'place-alignment',
        label: 'Align digits by place value',
        description: 'Ones under ones, tens under tens; prevents swapped digits.',
        category: 'placeValue',
        prerequisiteIds: ['facts-0-9'],
        evidence: skillGaps.filter(g => ['placeValueError','alignmentError'].includes(g.skill)).flatMap(g => g.examples.slice(0,1)),
        severity: 'high',
        weight: 80
      });
    }

    // Zero identity
    if (hasSkill('zeroHandlingError')) {
      subs.push({
        id: 'zero-identity',
        label: 'Zero identity understanding',
        description: 'Recognize that adding 0 keeps the number unchanged.',
        category: 'placeValue',
        prerequisiteIds: [],
        evidence: skillGaps.filter(g => g.skill === 'zeroHandlingError').flatMap(g => g.examples.slice(0,1)),
        severity: 'low',
        weight: 30
      });
    }

    // Regrouping multi-digit flow
    if (hasSkill('regroupingError') || hasSkill('multiDigitError')) {
      subs.push({
        id: 'multi-digit-flow',
        label: 'Systematic multi-digit addition flow',
        description: 'Process each column: add digits, record digit, carry if needed, move left.',
        category: 'general',
        prerequisiteIds: ['carry-trigger','carry-propagation','place-alignment'],
        evidence: skillGaps.filter(g => ['regroupingError','multiDigitError'].includes(g.skill)).flatMap(g => g.examples.slice(0,1)),
        severity: 'medium',
        weight: 70
      });
    }

    return subs.sort((a,b) => b.weight - a.weight);
  };

  const subSkills = deriveSubSkills();

  // Build a learning path ordering by dependency and severity
  const buildLearningPath = (): SubSkill[] => {
    const ordered: SubSkill[] = [];
    const byId = Object.fromEntries(subSkills.map(s => [s.id, s]));
    const visited: Record<string, boolean> = {};
    const temp: Record<string, boolean> = {};
    const dfs = (id: string) => {
      if (visited[id]) return;
      if (temp[id]) return; // cycle guard
      temp[id] = true;
      const node = byId[id];
      if (!node) return;
      node.prerequisiteIds.forEach(dfs);
      visited[id] = true;
      ordered.push(node);
    };
    subSkills.forEach(s => dfs(s.id));
    // Remove duplicates preserving first occurrence (topological order already handled)
    const seen: Record<string, boolean> = {};
    return ordered.filter(s => (seen[s.id] ? false : (seen[s.id] = true)));
  };

  const learningPath = buildLearningPath();

  return (
    <Card size="3" mt="6">
  <Heading size="5" mb="4">Unified Learning Analysis & Recommendations</Heading>
      
      {skillGaps.length > 0 && (
        <>
          <Box mb="4">
            <Heading size="3" mb="3">Areas to Focus On</Heading>
            <Flex direction="column" gap="3">
              {skillGaps.slice(0, 3).map((gap) => (
                <Box key={gap.skill}>
                  <Flex justify="between" align="center" mb="2">
                    <Text size="2" weight="medium">{gap.description}</Text>
                    <Badge color={getSeverityColor(gap.severity)} variant="soft">
                      {gap.count} time{gap.count !== 1 ? 's' : ''}
                    </Badge>
                  </Flex>
                  {gap.examples.length > 0 && (
                    <Box ml="2">
                      <Text size="1" color="gray">Examples: {gap.examples[0]}</Text>
                    </Box>
                  )}
                </Box>
              ))}
            </Flex>
          </Box>

          <Separator size="4" mb="4" />
        </>
      )}

      {/* Visualization: Skill Gap Bar Chart & Place Error Heatmap */}
      {(skillGapChart.length > 0 || Object.keys(placeErrorCounts).length > 0) && (
        <>
          <Box mb="4">
            <Flex justify="between" align="center" mb="3" wrap="wrap" gap="2">
              <Heading size="3" style={{ margin: 0 }}>Visual Insights</Heading>
              <Flex align="center" gap="3" wrap="wrap">
                <Flex align="center" gap="2" style={{ cursor: 'pointer', fontSize: '0.75rem' }} onClick={() => setShowPercent(v => !v)}>
                  <Box style={{
                    width: 34,
                    height: 18,
                    borderRadius: 20,
                    background: 'var(--gray-5)',
                    position: 'relative',
                    transition: 'background 0.3s'
                  }}>
                    <Box style={{
                      position: 'absolute',
                      top: 2,
                      left: showPercent ? 16 : 2,
                      width: 16,
                      height: 14,
                      borderRadius: 14,
                      background: 'var(--blue-9)',
                      transition: 'left 0.25s'
                    }} />
                  </Box>
                  <Box>
                    <Text size="1" color="gray">{showPercent ? 'Percent' : 'Counts'}</Text>
                  </Box>
                </Flex>
                <Flex>
                  <button
                    onClick={() => {
                      const exportPayload = {
                        generatedAt: new Date().toISOString(),
                        skillGaps: skillGapChart,
                        digitIssues: digitIssueList,
                        placeErrorCounts,
                        recentMistakes: processedMistakes.slice(-20).map(m => ({
                          q: m.question,
                          user: m.userAnswer,
                          correct: m.correctAnswer,
                          t: m.timestamp,
                          op: m.operator,
                          subskills: m.subskills || []
                        }))
                      };
                      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'learning-analysis.json';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    style={{
                      background: 'var(--blue-9)',
                      color: 'white',
                      fontSize: '0.7rem',
                      border: 'none',
                      padding: '6px 10px',
                      borderRadius: 6,
                      cursor: 'pointer'
                    }}
                  >
                    Export JSON
                  </button>
                </Flex>
              </Flex>
            </Flex>
            <Flex direction={{ initial: 'column', md: 'row' }} gap="4" wrap="wrap">
              {skillGapChart.length > 0 && (
                <Box style={{ flex: '1 1 280px', minWidth: 260 }}>
                  <Text size="2" weight="medium" mb="2" style={{ display: 'block' }}>Skill Gap Intensity</Text>
                  <Flex direction="column" gap="2">
                    {skillGapChart.slice(0,6).map(s => {
                      const denom = showPercent ? totalSkillGapCount || 1 : maxSkillGapCount;
                      const widthPct = (s.count / denom) * 100;
                      const hue = severityHue(s.severity);
                      return (
                        <Box key={s.label}>
                          <Flex justify="between" style={{ fontFamily: 'monospace' }}>
                            <Text size="1" color="gray">{s.label}</Text>
                            <Text size="1" color="gray">{showPercent ? `${Math.round((s.count/totalSkillGapCount)*100)}%` : s.count}</Text>
                          </Flex>
                          <Box style={{ position: 'relative', height: 10, background: 'var(--gray-4)', borderRadius: 6, overflow: 'hidden' }}>
                            <Box style={{ width: `${widthPct}%`, height: '100%', background: `hsl(${hue} 70% 50% / 0.85)`, transition: 'width 0.4s ease' }} />
                          </Box>
                        </Box>
                      );
                    })}
                  </Flex>
                </Box>
              )}
              {Object.keys(placeErrorCounts).length > 0 && (
                <Box style={{ flex: '1 1 220px', minWidth: 200 }}>
                  <Text size="2" weight="medium" mb="2" style={{ display: 'block' }}>Place Error Heatmap</Text>
                  <Flex gap="2" wrap="wrap">
                    {placeLabelsOrdered.filter(p => placeErrorCounts[p]).map(place => {
                      const count = placeErrorCounts[place];
                      const intensity = count / maxPlaceError; // 0-1
                      const bg = `hsl(${0} 70% ${Math.round(90 - intensity * 55)}%)`; // red hue varying lightness
                      return (
                        <Box key={place} style={{
                          width: 70,
                          borderRadius: 8,
                          background: bg,
                          padding: '6px 6px',
                          textAlign: 'center',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                        }}>
                          <Text size="1" weight="bold" style={{ textTransform: 'capitalize' }}>{place.split('-')[0]}</Text>
                          <Text size="1" color="gray" style={{ display: 'block' }}>{count}</Text>
                        </Box>
                      );
                    })}
                  </Flex>
                  <Text size="1" color="gray" mt="2" style={{ display: 'block' }}>Darker = more mistakes in that place.</Text>
                </Box>
              )}
            </Flex>
          </Box>
          <Separator size="4" mb="4" />
        </>
      )}

      {recommendations.length > 0 && (
        <>
          <Box mb="4">
            <Heading size="3" mb="3">Recommended Practice</Heading>
            <Flex direction="column" gap="2">
              {recommendations.slice(0, 4).map((rec, index) => (
                <Flex key={index} align="start" gap="2">
                  <Text size="2" color="blue">•</Text>
                  <Text size="2">{rec}</Text>
                </Flex>
              ))}
            </Flex>
          </Box>

          <Separator size="4" mb="4" />
        </>
      )}

      {digitIssueList.length > 0 && (
        <>
          <Box mb="4">
            <Heading size="3" mb="3">Digit-Level Pattern Insights</Heading>
            <Flex direction="column" gap="2">
              {digitIssueList.slice(0,4).map(item => (
                <Flex key={item.code} justify="between" align="center" className="ui-row">
                  <Text size="2" weight="medium">
                    {item.code === 'missedCarryIn' && 'Missed incoming carry'}
                    {item.code === 'missedCarryOut' && 'Missed creating carry'}
                    {item.code === 'droppedFinalCarry' && 'Dropped final carry'}
                    {item.code === 'incorrectSum' && 'Incorrect digit sum'}
                    {item.code === 'placeValueSwap' && 'Place value swap'}
                    {['missedCarryIn','missedCarryOut','droppedFinalCarry','incorrectSum','placeValueSwap'].includes(item.code) ? '' : item.code}
                  </Text>
                  <Badge color={getSeverityColor(item.severity)} variant="soft">{item.count}</Badge>
                </Flex>
              ))}
            </Flex>
          </Box>
          <Separator size="4" mb="4" />
        </>
      )}

      {learningPath.length > 0 && (
        <>
          <Box mb="4">
            <Heading size="3" mb="3">Foundational Skill Mastery Path</Heading>
            <Flex direction="column" gap="3">
              {learningPath.map((s, idx) => (
                <Box key={s.id} style={{ border: '1px solid var(--gray-6)', borderRadius: 8, padding: '8px 12px', background: 'var(--gray-2)' }}>
                  <Flex justify="between" align="start" wrap="wrap" gap="2">
                    <Flex direction="column" style={{ flex: 1 }}>
                      <Flex align="center" gap="2" wrap="wrap">
                        <Badge variant="soft" color={getSeverityColor(s.severity)}>{idx + 1}</Badge>
                        <Text size="2" weight="medium">{s.label}</Text>
                      </Flex>
                      <Text size="1" color="gray" style={{ marginTop: 4 }}>{s.description}</Text>
                      {s.prerequisiteIds.length > 0 && (
                        <Text size="1" color="gray" style={{ marginTop: 4 }}>Prereq: {s.prerequisiteIds.map(id => subSkills.find(x => x.id === id)?.label || id).join(', ')}</Text>
                      )}
                      {s.evidence.length > 0 && (
                        <Text size="1" color="blue" style={{ marginTop: 4 }}>Evidence: {s.evidence[0]}</Text>
                      )}
                    </Flex>
                    <Box style={{ minWidth: 180 }}>
                      <Text size="1" weight="bold">Target Practice</Text>
                      <ul style={{ paddingLeft: 16, margin: '4px 0 0' }}>
                        {s.id === 'facts-0-9' && <li><Text size="1">5 daily 2-minute fact sprints</Text></li>}
                        {s.id === 'carry-trigger' && <li><Text size="1">Worksheet: mark which pairs make 10+</Text></li>}
                        {s.id === 'carry-propagation' && <li><Text size="1">Speak carries aloud per column</Text></li>}
                        {s.id === 'final-carry' && <li><Text size="1">End-of-row problems creating new digit</Text></li>}
                        {s.id === 'place-alignment' && <li><Text size="1">Graph paper vertical setups</Text></li>}
                        {s.id === 'zero-identity' && <li><Text size="1">Mix of +0 and + other digits</Text></li>}
                        {s.id === 'multi-digit-flow' && <li><Text size="1">Timed set: narrate each step</Text></li>}
                        <li><Text size="1">10 focused problems</Text></li>
                      </ul>
                    </Box>
                  </Flex>
                </Box>
              ))}
            </Flex>
          </Box>
          <Separator size="4" mb="4" />
        </>
      )}

      {recentMistakes.length > 0 && (
        <Box>
          <Heading size="3" mb="3">Recent Mistakes to Review</Heading>
          <Flex justify="end" mb="2">
            <Badge asChild color={showDigitDetails ? 'blue' : 'gray'} style={{ cursor: 'pointer' }}>
              <span onClick={() => setShowDigitDetails(v => !v)}>{showDigitDetails ? 'Hide digit details' : 'Show digit details'}</span>
            </Badge>
          </Flex>
          <Flex direction="column" gap="2">
            {recentMistakes.map((mistake, index) => (
              <Box key={index}>
                <Grid columns="2" gap="2" align="center">
                  <Text size="2">{mistake.num1} {mistake.operator === 'multiplication' ? '×' : '+'} {mistake.num2} = ?</Text>
                  <Flex gap="2" align="center">
                    <Text size="2" color="red">You: {mistake.userAnswer}</Text>
                    <Text size="2" color="green">Answer: {mistake.correctAnswer}</Text>
                  </Flex>
                </Grid>
                {mistake.rootCauses && mistake.rootCauses.length > 0 && (
                  <Box mt="1" ml="2">
                    {mistake.rootCauses.slice(0,2).map(rc => (
                      <Box key={rc.code} mb="1">
                        <Flex gap="2" align="start" wrap="wrap">
                          <Badge color={rc.severity === 'high' ? 'red' : rc.severity === 'medium' ? 'orange' : 'yellow'} variant="soft">
                            {rc.label}
                          </Badge>
                          <Text size="1" color="gray">{rc.explanation}</Text>
                        </Flex>
                        <Text size="1" color="blue" style={{ display: 'block', marginTop: '2px' }}>Practice: {rc.practiceTip}</Text>
                      </Box>
                    ))}
                  </Box>
                )}
                {showDigitDetails && mistake.digitAnalysis && mistake.operator === 'addition' && (
                  <Box mt="2" ml="2" style={{ fontFamily: 'monospace' }}>
                    <Flex direction="column" gap="1">
                      <Flex gap="4" wrap="wrap">
                        {mistake.digitAnalysis.map((row, idx) => {
                          const hasIssue = row.issues.length > 0;
                          return (
                            <Box key={idx} style={{
                              padding: '6px 8px',
                              border: `2px solid ${hasIssue ? 'var(--red-7)' : 'var(--gray-5)'}`,
                              borderRadius: 6,
                              minWidth: '110px',
                              background: hasIssue ? 'var(--red-3)' : 'var(--gray-2)'
                            }}>
                              <Text size="1" weight="bold" color={hasIssue ? 'red' : 'gray'} style={{ textTransform: 'capitalize' }}>{row.place}</Text>
                              <Text size="1" color="gray">{row.a} + {row.b} {row.carryIn ? '+1' : ''}</Text>
                              <Text size="1">→ exp {row.expectedDigit}{row.expectedCarryOut ? ` (carry ${row.expectedCarryOut})` : ''}</Text>
                              <Text size="1" color={hasIssue ? 'red' : 'green'}>you {row.userDigit ?? '·'}</Text>
                              {hasIssue && row.issues.slice(0,1).map(issue => (
                                <Text key={issue.code} size="1" color={issue.severity === 'high' ? 'red' : issue.severity === 'medium' ? 'orange' : 'yellow'}>
                                  {issue.description}
                                </Text>
                              ))}
                            </Box>
                          );
                        })}
                      </Flex>
                    </Flex>
                  </Box>
                )}
              </Box>
            ))}
          </Flex>
        </Box>
      )}
    </Card>
  );
}