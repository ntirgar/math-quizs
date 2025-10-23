"use client";
import { Card, Heading, Text, Flex, Badge, Box, Separator } from '@radix-ui/themes';
import { useMemo } from 'react';

interface MultMistake { question: string; userAnswer: number; correctAnswer: number; a: number; b: number; timestamp: number; subskills?: string[] }
interface MultiplicationAnalysisProps { mistakes: MultMistake[] }

export function MultiplicationAnalysis({ mistakes }: MultiplicationAnalysisProps) {
  const factCounts = useMemo(() => {
    const map: Record<string, number> = {};
    mistakes.forEach(m => {
      const key = `${m.a}×${m.b}`;
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).sort((a,b)=> b[1]-a[1]);
  }, [mistakes]);

  const highFrequency = factCounts.slice(0,6);
  const recent = mistakes.slice(-5);

  // Subskill frequencies
  const subskillCounts: Record<string, number> = {};
  mistakes.forEach(m => m.subskills?.forEach(s => { subskillCounts[s] = (subskillCounts[s] || 0) + 1; }));
  const topSubskills = Object.entries(subskillCounts).sort((a,b)=> b[1]-a[1]).slice(0,5);

  if (mistakes.length === 0) {
    return (
      <Card size="3" mt="6">
        <Heading size="5" mb="3">Multiplication Learning</Heading>
        <Text size="2" color="gray">Solve multiplication problems to unlock targeted insights.</Text>
      </Card>
    );
  }

  return (
    <Card size="3" mt="6">
      <Heading size="5" mb="4">Multiplication Learning</Heading>
      <Flex direction="column" gap="4">
        <Box>
          <Heading size="3" mb="2">Most Challenging Facts</Heading>
          <Flex direction="column" gap="2">
            {highFrequency.map(([fact,count]) => (
              <Flex key={fact} justify="between" align="center">
                <Text size="2" weight="medium">{fact}</Text>
                <Badge color={count >= 3 ? 'red' : 'orange'} variant="soft">{count} miss{count!==1?'es':''}</Badge>
              </Flex>
            ))}
          </Flex>
        </Box>
        {topSubskills.length > 0 && (
          <Box>
            <Separator size="4" mb="3" />
            <Heading size="3" mb="2">Subskill Signals</Heading>
            <Flex direction="column" gap="2">
              {topSubskills.map(([id,c]) => (
                <Flex key={id} justify="between" align="center">
                  <Text size="2">{id}</Text>
                  <Badge color={c>3? 'orange':'yellow'} variant="soft">{c}</Badge>
                </Flex>
              ))}
            </Flex>
          </Box>
        )}
        <Separator size="4" />
        <Box>
          <Heading size="3" mb="2">Recent Misses</Heading>
          <Flex direction="column" gap="1">
            {recent.map((m,i)=>(
              <Text key={i} size="1" color="gray">{m.a}×{m.b} → {m.correctAnswer} (you {m.userAnswer})</Text>
            ))}
          </Flex>
        </Box>
      </Flex>
    </Card>
  );
}
