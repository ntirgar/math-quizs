"use client";
import { Card, Heading, Text, Flex, Box, Badge, Grid } from '@radix-ui/themes';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';

type BadgeColor = 'green' | 'blue' | 'purple' | 'orange';
interface OperationStats { attempts: number; correct: number; accuracy: number; keyAttempts: string; label: string; route: string; color: BadgeColor }

// Helper to parse attempt arrays derived from localStorage
interface StoredAttempt { correct?: boolean | null }

const parseList = (raw: string | null): StoredAttempt[] => {
  if (!raw) return []; try { const parsed = JSON.parse(raw); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
};

export function ProgressDashboard() {
  const [stats, setStats] = useState<OperationStats[]>([]);

  const recompute = useCallback(() => {
    const additionAttempts = parseList(localStorage.getItem('attempts'));
    const multAttempts = parseList(localStorage.getItem('mult_attempts'));
    // Placeholder arrays for subtraction & division until implemented
    const subtractionAttempts = parseList(localStorage.getItem('sub_attempts'));
    const divisionAttempts = parseList(localStorage.getItem('div_attempts'));

  const build = (arr: StoredAttempt[], label: string, route: string, color: BadgeColor, keyAttempts: string): OperationStats => {
      let attempts = 0, correct = 0; arr.forEach(a => { if (typeof a.correct === 'boolean') { attempts++; if (a.correct) correct++; } });
      const accuracy = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;
      return { attempts, correct, accuracy, label, route, color, keyAttempts };
    };
    setStats([
      build(additionAttempts, 'Addition', '/addition', 'green', 'attempts'),
      build(subtractionAttempts, 'Subtraction', '/subtraction', 'blue', 'sub_attempts'),
      build(multAttempts, 'Multiplication', '/multiplication', 'purple', 'mult_attempts'),
      build(divisionAttempts, 'Division', '/division', 'orange', 'div_attempts'),
    ]);
  }, []);

  useEffect(() => {
    recompute();
    const handler = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.key?.includes('attempts')) recompute();
    };
    window.addEventListener('ls-update', handler);
    window.addEventListener('storage', recompute);
    return () => { window.removeEventListener('ls-update', handler); window.removeEventListener('storage', recompute); };
  }, [recompute]);

  return (
    <Card size="3" mt="4">
      <Heading size="5" mb="4">Practice Progress Overview</Heading>
      <Grid columns={{ initial: '1', sm: '2', md: '2', lg: '4' }} gap="4">
        {stats.map(s => (
          <Card key={s.label} size="2" style={{ border:'1px solid var(--gray-5)' }}>
            <Flex direction="column" gap="2">
              <Flex justify="between" align="center">
                <Text weight="medium">{s.label}</Text>
                <Badge color={s.color} variant="soft">{s.accuracy}%</Badge>
              </Flex>
              <Text size="1" color="gray">{s.correct} correct / {s.attempts} attempts</Text>
              <Flex gap="2" mt="1">
                <Link href={s.route} className="link-button" style={{ fontSize:'0.75rem' }}>Go to {s.label}</Link>
                {s.attempts > 0 && (
                  <button
                    onClick={() => { localStorage.removeItem(s.keyAttempts); window.dispatchEvent(new CustomEvent('ls-update',{detail:{key:s.keyAttempts}})); recompute(); }}
                    style={{ fontSize:'0.65rem', background:'var(--red-4)', color:'var(--red-11)', border:'1px solid var(--red-6)', borderRadius:6, padding:'4px 8px', cursor:'pointer' }}
                  >Reset</button>
                )}
              </Flex>
            </Flex>
          </Card>
        ))}
      </Grid>
      <Box mt="4">
        <Text size="1" color="gray">Subtraction & Division are placeholders—start practicing to populate stats once implemented.</Text>
      </Box>
    </Card>
  );
}
