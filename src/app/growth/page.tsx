"use client";
import { Container } from '@radix-ui/themes';
import { AppHeader, OverallProgress, MultiplicationAnalysis, MistakeAnalysis } from '@/components';
import { MultiplicationFactGrid } from '@/components/MultiplicationFactGrid';
import { AdditionFactGrid } from '@/components/AdditionFactGrid';
import { AttemptTimeline } from '@/components/AttemptTimeline';
import { useEffect, useState } from 'react';

interface AdditionMistake { question: string; userAnswer: number; correctAnswer: number; num1: number; num2: number; mistakeType?: string[]; timestamp: number }
interface MultMistake { question: string; userAnswer: number; correctAnswer: number; a: number; b: number; timestamp: number; subskills?: string[] }

export default function GrowthPage() {
  const [additionMistakes, setAdditionMistakes] = useState<AdditionMistake[]>([]);
  const [multMistakes, setMultMistakes] = useState<MultMistake[]>([]);

  useEffect(() => {
    // Load both sets of mistakes for unified analysis
    try {
      const addRaw = localStorage.getItem('mistakes');
      const multRaw = localStorage.getItem('mult_mistakes');
      if (addRaw) {
        const parsed = JSON.parse(addRaw); if (Array.isArray(parsed)) setAdditionMistakes(parsed);
      }
      if (multRaw) {
        const parsed = JSON.parse(multRaw); if (Array.isArray(parsed)) setMultMistakes(parsed);
      }
    } catch {}
  }, []);

  // Merge mistakes for unified MistakeAnalysis (retain legacy MultiplicationAnalysis panel for focused view)
  interface UnifiedMistake {
    question: string; userAnswer: number; correctAnswer: number; num1?: number; num2?: number; a?: number; b?: number; timestamp: number; operator: 'addition'|'multiplication'; mistakeType?: string[]; subskills?: string[];
  }
  const unifiedMistakes: UnifiedMistake[] = [
    ...additionMistakes.map(m => ({ ...m, operator: 'addition' as const })),
    ...multMistakes.map(m => ({ ...m, operator: 'multiplication' as const, num1: m.a, num2: m.b }))
  ];

  return (
    <Container style={{ padding: '2rem 1rem' }}>
      <AppHeader />
      <OverallProgress />
      {/* Unified analysis across operations */}
  <MistakeAnalysis mistakes={unifiedMistakes.map(m => ({ ...m, mistakeType: m.mistakeType || [] }))} />
      {/* Multiplication summary analysis */}
      <MultiplicationAnalysis mistakes={multMistakes} />
    <AdditionFactGrid />
    <MultiplicationFactGrid />
      <AttemptTimeline />
    </Container>
  );
}
