export const classifyQuestion = (num1: number, num2: number): string[] => {
  const subskills: string[] = [];
  const aStr = num1.toString();
  const bStr = num2.toString();
  const digitsA = aStr.length;
  const digitsB = bStr.length;
  const maxLen = Math.max(digitsA, digitsB);
  const onesA = num1 % 10;
  const onesB = num2 % 10;
  const sumOnes = onesA + onesB;
  const answer = num1 + num2;
  const answerDigits = answer.toString().length;

  if (digitsA === 1 && digitsB === 1) subskills.push('facts-0-9');
  if (sumOnes >= 10) subskills.push('carry-trigger');

  const requiresCarryPropagation = (() => {
    if (maxLen < 2) return false;
    let previousCarry = 0;
    let chain = 0;
    for (let i = 0; i < maxLen; i++) {
      const d1 = Math.floor(num1 / Math.pow(10, i)) % 10;
      const d2 = Math.floor(num2 / Math.pow(10, i)) % 10;
      const s = d1 + d2 + previousCarry;
      const carryOut = s >= 10 ? 1 : 0;
      if (carryOut === 1 && (previousCarry === 1 || i > 0)) chain++;
      previousCarry = carryOut;
    }
    return chain >= 1 && previousCarry === 1;
  })();
  if (requiresCarryPropagation) subskills.push('carry-propagation');

  if (answerDigits > maxLen) subskills.push('final-carry');
  if (digitsA !== digitsB) subskills.push('place-alignment');
  if (num1 === 0 || num2 === 0 || num1 % 10 === 0 || num2 % 10 === 0) subskills.push('zero-identity');
  if (maxLen >= 2) subskills.push('multi-digit-flow');

  return Array.from(new Set(subskills));
};