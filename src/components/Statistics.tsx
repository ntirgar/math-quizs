"use client";
import { Box, Card, Heading, Text, Flex, Badge, Grid } from '@radix-ui/themes';
import { useEffect, useState, useCallback } from 'react';
import { ProgressBar } from './ProgressBar';

// Statistics component now derives its numbers directly from localStorage attempt histories
// so it reflects both addition and multiplication cumulative performance regardless of hook state.
export function Statistics() {
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [accuracy, setAccuracy] = useState(0);

  interface StoredAttempt { correct?: boolean | null }
  // stable parser (no dependencies)
  const parseList = useCallback((raw: string | null): StoredAttempt[] => {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, []);
  const recompute = useCallback(() => {
    const addAttempts = parseList(localStorage.getItem('attempts'));
    const multAttempts = parseList(localStorage.getItem('mult_attempts'));
    let total = 0; let correct = 0;
    const countRecord = (r: StoredAttempt) => {
      if (typeof r.correct === 'boolean') {
        total++;
        if (r.correct) correct++;
      }
    };
    addAttempts.forEach(countRecord);
    multAttempts.forEach(countRecord);
    setAttempts(total);
    setScore(correct);
    setAccuracy(total > 0 ? Math.round((correct / total) * 100) : 0);
  }, [parseList]);

  useEffect(() => {
    recompute();
    const handler = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.key === 'attempts' || ce.detail?.key === 'mult_attempts') {
        recompute();
      }
    };
    window.addEventListener('ls-update', handler);
    window.addEventListener('storage', recompute);
    return () => {
      window.removeEventListener('ls-update', handler);
      window.removeEventListener('storage', recompute);
    };
  }, [recompute]);

  return (
    <Card size="3">
      <Flex direction="column" gap="4">
        <Heading size="5">Your Statistics</Heading>
        <Grid columns="2" gap="3">
          <Box>
            <Text size="2" color="gray" weight="medium">Score</Text>
            <Flex align="center" gap="2">
              <Badge color="green" size="2">{score}</Badge>
              <Text size="2">correct</Text>
            </Flex>
          </Box>
          <Box>
            <Text size="2" color="gray" weight="medium">Attempts</Text>
            <Flex align="center" gap="2">
              <Badge color="blue" size="2">{attempts}</Badge>
              <Text size="2">total</Text>
            </Flex>
          </Box>
        </Grid>
        <Box>
          <ProgressBar value={accuracy} label={`Accuracy ${accuracy}%`} color={accuracy >= 90 ? 'var(--green-9)' : 'var(--amber-9)'} />
        </Box>
      </Flex>
    </Card>
  );
}