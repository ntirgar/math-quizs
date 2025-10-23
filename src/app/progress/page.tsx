"use client";
import { Container } from '@radix-ui/themes';
import { AppHeader, OverallProgress } from '@/components';
import { MistakeAnalysis } from '@/components';
import { useEffect, useState } from 'react';

// This page shows combined progress plus addition-specific learning analysis (first phase).
// Multiplication mistakes are summarized in OverallProgress; deeper analysis coming later.

interface AdditionMistake { question: string; userAnswer: number; correctAnswer: number; num1: number; num2: number; mistakeType: string[]; timestamp: number }

export default function ProgressPage() {
  const [additionMistakes, setAdditionMistakes] = useState<AdditionMistake[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('mistakes');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setAdditionMistakes(parsed);
      }
    } catch {}
  }, []);

  return (
    <Container style={{ padding: '2rem 1rem' }}>
      <AppHeader />
      <OverallProgress />
      <MistakeAnalysis mistakes={additionMistakes} />
    </Container>
  );
}
