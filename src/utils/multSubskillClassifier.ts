// Classifier for multiplication facts & subskills
// Subskills chosen to mirror addition structure while targeting multiplication mastery progression.
// ids align with prospective MistakeAnalysis extension for multiplication.

export type MultSubskillId =
  | 'facts-0-10'
  | 'facts-11-12'
  | 'zero-one-laws'
  | 'square-numbers'
  | 'commutativity-recognition'
  | 'distribution-anchor'
  | 'multi-digit-flow-mult';

// Simple heuristic classification based on operands
export function classifyMultiplication(a: number, b: number): MultSubskillId[] {
  const ids: MultSubskillId[] = [];
  const x = Math.max(a, b);
  const y = Math.min(a, b);

  // Base facts segmentation
  if (x <= 10 && y <= 10) ids.push('facts-0-10');
  else if (x <= 12 && y <= 12) ids.push('facts-11-12');

  // Zero / one identity
  if (a === 0 || b === 0 || a === 1 || b === 1) ids.push('zero-one-laws');

  // Squares recognition
  if (a === b && a <= 12) ids.push('square-numbers');

  // Commutativity pattern (avoid double counting in analysis; still tag)
  if (a !== b && a <= 12 && b <= 12) ids.push('commutativity-recognition');

  // Distribution anchors: e.g. 6*12 could break into 6*(10+2)
  if ((x > 10 && y <= 10) || (x <= 10 && y > 10)) ids.push('distribution-anchor');

  // Multi-digit flow for larger numbers (long multiplication potential)
  if (x > 12 || y > 12) ids.push('multi-digit-flow-mult');

  return ids;
}
