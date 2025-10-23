"use client";
import { useEffect, useState } from 'react';
import { Card, Heading, Text, Flex, Box, Separator, Badge } from '@radix-ui/themes';

interface ProgressMap { [key: string]: number }
interface MistakeEntry { question: string; userAnswer: number; correctAnswer: number; timestamp: number }

interface OverallSnapshot {
  addition: { score: number; mistakes: number; attempts: number; accuracy: number };
  multiplication: { score: number; mistakes: number; attempts: number; accuracy: number };
  total: { score: number; mistakes: number; attempts: number; accuracy: number };
}

export function OverallProgress() {
  const [snapshot, setSnapshot] = useState<OverallSnapshot | null>(null);
  const [recentExamples, setRecentExamples] = useState<{ op: string; text: string }[]>([]);

  useEffect(() => {
    // Load localStorage data (client-side only)
    try {
      const addProgressRaw = localStorage.getItem('progress');
      const multProgressRaw = localStorage.getItem('mult_progress');
      const addMistakesRaw = localStorage.getItem('mistakes');
      const multMistakesRaw = localStorage.getItem('mult_mistakes');
      const addProgress: ProgressMap = addProgressRaw ? JSON.parse(addProgressRaw) : {};
      const multProgress: ProgressMap = multProgressRaw ? JSON.parse(multProgressRaw) : {};
      const addMistakes: MistakeEntry[] = addMistakesRaw ? JSON.parse(addMistakesRaw) : [];
      const multMistakes: MistakeEntry[] = multMistakesRaw ? JSON.parse(multMistakesRaw) : [];

      const addScore = Object.values(addProgress).reduce((a,b)=>a+b,0);
      const multScore = Object.values(multProgress).reduce((a,b)=>a+b,0);
      const addMistakeCount = addMistakes.length;
      const multMistakeCount = multMistakes.length;
      const addAttempts = addScore + addMistakeCount;
      const multAttempts = multScore + multMistakeCount;
      const addAccuracy = addAttempts ? Math.round((addScore / addAttempts) * 100) : 0;
      const multAccuracy = multAttempts ? Math.round((multScore / multAttempts) * 100) : 0;
      const totalScore = addScore + multScore;
      const totalMistakes = addMistakeCount + multMistakeCount;
      const totalAttempts = addAttempts + multAttempts;
      const totalAccuracy = totalAttempts ? Math.round((totalScore / totalAttempts) * 100) : 0;

      setSnapshot({
        addition: { score: addScore, mistakes: addMistakeCount, attempts: addAttempts, accuracy: addAccuracy },
        multiplication: { score: multScore, mistakes: multMistakeCount, attempts: multAttempts, accuracy: multAccuracy },
        total: { score: totalScore, mistakes: totalMistakes, attempts: totalAttempts, accuracy: totalAccuracy }
      });

      // Build recent examples (last 3 from each)
      const examples: { op: string; text: string }[] = [];
      addMistakes.slice(-3).forEach(m => examples.push({ op: 'addition', text: `${m.question} → ${m.correctAnswer}` }));
      multMistakes.slice(-3).forEach(m => examples.push({ op: 'multiplication', text: `${m.question.replace('x','×')} → ${m.correctAnswer}` }));
      setRecentExamples(examples);
    } catch {
      // fail silently
    }
  }, []);

  if (!snapshot) {
    return (
      <Card size="3" mt="6">
        <Heading size="5" mb="4">Overall Progress</Heading>
        <Text size="2" color="gray">Practice problems to build a combined progress profile.</Text>
      </Card>
    );
  }

  return (
    <Card size="3" mt="6">
      <Heading size="5" mb="4">Overall Progress</Heading>
      <Flex direction="column" gap="4">
        <Box>
          <Heading size="3" mb="3">Totals</Heading>
          <Flex gap="6" wrap="wrap">
            <Metric label="Attempts" value={snapshot.total.attempts} />
            <Metric label="Correct" value={snapshot.total.score} />
            <Metric label="Mistakes" value={snapshot.total.mistakes} />
            <Metric label="Accuracy" value={`${snapshot.total.accuracy}%`} />
          </Flex>
        </Box>
        <Separator size="4" />
        <Box>
          <Heading size="3" mb="3">By Operation</Heading>
          <Flex gap="4" wrap="wrap">
            <OperationPanel title="Addition" snap={snapshot.addition} />
            <OperationPanel title="Multiplication" snap={snapshot.multiplication} />
          </Flex>
        </Box>
        {recentExamples.length > 0 && (
          <>
            <Separator size="4" />
            <Box>
              <Heading size="3" mb="3">Recent Examples</Heading>
              <Flex direction="column" gap="2">
                {recentExamples.map((ex, i) => (
                  <Flex key={i} align="center" gap="3">
                    <Badge color={ex.op === 'addition' ? 'blue' : 'purple'} variant="soft">{ex.op}</Badge>
                    <Text size="2">{ex.text}</Text>
                  </Flex>
                ))}
              </Flex>
            </Box>
          </>
        )}
      </Flex>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <Box style={{ minWidth: 110 }}>
      <Text size="1" color="gray" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</Text>
      <Text size="4" weight="medium">{value}</Text>
    </Box>
  );
}

function OperationPanel({ title, snap }: { title: string; snap: { score: number; mistakes: number; attempts: number; accuracy: number } }) {
  return (
    <Card size="2" style={{ flex: '1 1 260px', minWidth: 240 }}>
      <Flex direction="column" gap="2">
        <Text size="2" weight="medium">{title}</Text>
        <Flex gap="3" wrap="wrap">
          <Metric label="Attempts" value={snap.attempts} />
          <Metric label="Correct" value={snap.score} />
          <Metric label="Mistakes" value={snap.mistakes} />
          <Metric label="Accuracy" value={`${snap.accuracy}%`} />
        </Flex>
      </Flex>
    </Card>
  );
}
