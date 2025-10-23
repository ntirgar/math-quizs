"use client";
import { useEffect, useState } from 'react';
import { Container, Box, Flex, Heading, Button } from '@radix-ui/themes';
import { AppHeader, MistakeAnalysis } from '@/components';

interface MultMistakeEntry {
  question: string;
  userAnswer: number;
  correctAnswer: number;
  a: number;
  b: number;
  mistakeType?: string[];
  timestamp: number;
  subskills?: string[];
}

export default function MultiplicationHistoryPage() {
  const [mistakes, setMistakes] = useState<MultMistakeEntry[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem('mult_mistakes');
    if (raw) {
      try {
        interface StoredMistake { question?: string; questionKey?: string; userAnswer: number; correctAnswer: number; a: number; b: number; mistakeType?: string[]; timestamp: number; subskills?: string[] }
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const normalized = parsed.map((m: StoredMistake) => ({
            question: m.question || m.questionKey || `${m.a}x${m.b}`,
            userAnswer: m.userAnswer,
            correctAnswer: m.correctAnswer,
            a: m.a,
            b: m.b,
            mistakeType: m.mistakeType ?? [],
            timestamp: m.timestamp,
            subskills: m.subskills
          }));
          setMistakes(normalized);
        }
      } catch {}
    }
  }, []);

  const clearMistakes = () => {
    localStorage.removeItem('mult_mistakes');
    setMistakes([]);
  };

  const mappedMistakes = mistakes.map(m => ({
    question: m.question.includes('x') ? m.question.replace('x', '+') : m.question,
    userAnswer: m.userAnswer,
    correctAnswer: m.correctAnswer,
    num1: m.a,
    num2: m.b,
    mistakeType: m.mistakeType || [],
    timestamp: m.timestamp
  }));

  return (
    <Container style={{ padding:'2rem 1rem' }}>
      <AppHeader />
      <Flex justify="between" align="center" mb="4" wrap="wrap" gap="3">
        <Heading size="6">Multiplication History</Heading>
        <Button variant="outline" onClick={clearMistakes}>Clear</Button>
      </Flex>
      <Box mb="6">
        <p style={{ fontSize:'.85rem', opacity:.8 }}>Review incorrect attempts to target practice. (Temporary mapping converts × to + for digit-column reuse.)</p>
      </Box>
      <MistakeAnalysis mistakes={mappedMistakes} />
    </Container>
  );
}
