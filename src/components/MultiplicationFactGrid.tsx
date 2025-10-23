"use client";
import React from 'react';
import { Card, Heading, Text, Flex, Box, Badge } from '@radix-ui/themes';
import { useEffect, useState, useCallback } from 'react';

interface FactStat { correct: number; attempts: number; mistakes: number }

// Builds a 2-9 x 2-9 grid of facts. Considers both orientations (a×b and b×a) aggregated.
export function MultiplicationFactGrid() {
  const [stats, setStats] = useState<Record<string, FactStat>>({});
  const TABLE_MIN = 2;
  const TABLE_MAX = 9;

  const [queueFacts, setQueueFacts] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'accuracy' | 'attempts'>('accuracy');
  const [thresholds, setThresholds] = useState<{ mastered:number; strong:number; developing:number }>({ mastered:0.95, strong:0.85, developing:0.70 });
  const refresh = useCallback(() => {
    try {
      const progressRaw = localStorage.getItem('mult_progress');
  const mistakeRaw = localStorage.getItem('mult_mistakes');
  const attemptsRaw = localStorage.getItem('mult_attempts');
      const queueRaw = localStorage.getItem('mult_practice_queue');
  const thRaw = localStorage.getItem('mastery_thresholds');
      const progress: Record<string, number> = progressRaw ? JSON.parse(progressRaw) : {};
      const mistakes: Array<{ a: number; b: number; question: string; userAnswer: number; correctAnswer: number }> = mistakeRaw ? JSON.parse(mistakeRaw) : [];
  const agg: Record<string, FactStat> = {};
  const attempts: Array<{ a?: number; b?: number; correct?: boolean | null }> = attemptsRaw ? JSON.parse(attemptsRaw) : [];
  const useAttempts = Array.isArray(attempts) && attempts.length > 0;
      const record = (a: number, b: number, correctDelta: number, attemptDelta: number, mistakeDelta: number) => {
        const key = `${a}x${b}`;
        if (!agg[key]) agg[key] = { correct: 0, attempts: 0, mistakes: 0 };
        agg[key].correct += correctDelta;
        agg[key].attempts += attemptDelta;
        agg[key].mistakes += mistakeDelta;
      };
      if (useAttempts) {
        attempts.forEach(attempt => {
          const a = attempt?.a;
          const b = attempt?.b;
          const correct = attempt?.correct;
          if (typeof a === 'number' && typeof b === 'number' && a>=TABLE_MIN && a<=TABLE_MAX && b>=TABLE_MIN && b<=TABLE_MAX && correct !== null && typeof correct === 'boolean') {
            if (correct) {
              record(Math.min(a,b), Math.max(a,b), 1, 1, 0);
            } else {
              record(Math.min(a,b), Math.max(a,b), 0, 1, 1);
            }
          }
        });
      } else {
        // Progress keys are stored per exact orientation; treat each increment as a correct attempt.
        Object.entries(progress).forEach(([k, count]) => {
          const match = k.match(/^(\d+)x(\d+)$/);
          if (match) {
            const a = parseInt(match[1],10); const b = parseInt(match[2],10);
            if (a>=TABLE_MIN && a<=TABLE_MAX && b>=TABLE_MIN && b<=TABLE_MAX) {
              record(Math.min(a,b), Math.max(a,b), count, count, 0);
            }
          }
        });
        // Mistakes list: each is one incorrect attempt
        mistakes.forEach(m => {
          const a = m.a; const b = m.b;
          if (a>=TABLE_MIN && a<=TABLE_MAX && b>=TABLE_MIN && b<=TABLE_MAX) {
            record(Math.min(a,b), Math.max(a,b), 0, 1, 1);
          }
        });
      }
      setStats(agg);
      if (queueRaw) {
        try {
          const parsed = JSON.parse(queueRaw);
          interface QueueItem { a: number; b: number }
          if (Array.isArray(parsed)) setQueueFacts(parsed.filter((q:QueueItem)=> typeof q.a==='number' && typeof q.b==='number').map((q:QueueItem)=> `${Math.min(q.a,q.b)}x${Math.max(q.a,q.b)}`));
        } catch {}
      } else {
        setQueueFacts([]);
      }
      if (thRaw) {
        try {
          const parsed = JSON.parse(thRaw);
          if (parsed && typeof parsed.mastered==='number') setThresholds(parsed);
        } catch {}
      }
    } catch {}
  }, []); // useCallback with no dependencies - reads from localStorage directly
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent; const key = ce.detail?.key;
  if (key && ['mult_progress','mult_mistakes','mult_attempts','mult_practice_queue','mastery_thresholds','fact_view_mode_mult'].includes(key)) refresh();
    };
    window.addEventListener('ls-update', handler);
    return () => window.removeEventListener('ls-update', handler);
  }, [refresh]);
  useEffect(() => {
    const existing = localStorage.getItem('mastery_thresholds');
    if (!existing) {
      localStorage.setItem('mastery_thresholds', JSON.stringify(thresholds));
      window.dispatchEvent(new CustomEvent('ls-update', { detail: { key: 'mastery_thresholds' } }));
    }
    const vm = localStorage.getItem('fact_view_mode_mult');
    if (vm === 'attempts' || vm === 'accuracy') setViewMode(vm);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    localStorage.setItem('fact_view_mode_mult', viewMode);
    window.dispatchEvent(new CustomEvent('ls-update', { detail: { key: 'fact_view_mode_mult' } }));
  }, [viewMode]);

  const cells: Array<{ a:number; b:number; stat: FactStat | undefined }> = [];
  for (let a = TABLE_MIN; a <= TABLE_MAX; a++) {
    for (let b = TABLE_MIN; b <= TABLE_MAX; b++) {
      const key = `${Math.min(a,b)}x${Math.max(a,b)}`;
      cells.push({ a, b, stat: stats[key] });
    }
  }

  const masteryRatio = (s?: FactStat) => {
    if (!s || s.attempts === 0) return null;
    return s.correct / s.attempts;
  };

  const colorFor = (stat?: FactStat) => {
    if (!stat || stat.attempts === 0) return 'var(--gray-6)';
    const ratio = stat.correct / stat.attempts;
    if (ratio >= thresholds.mastered) return 'var(--green-9)';
    if (ratio >= thresholds.strong) return 'var(--green-7)';
    if (ratio >= thresholds.developing) return 'var(--orange-9)';
    if (ratio > 0) return 'var(--red-9)';
    return 'var(--red-10)';
  };

  return (
    <Card size="3" mt="6">
      <Heading size="5" mb="4">Multiplication Fact Grid (2–9)</Heading>
      <Text size="2" color="gray" mb="3">Color shows mastery accuracy. Click facts to enqueue practice (Stage 2 only).</Text>
      <Box style={{ overflowX:'auto' }}>
        <Box style={{ display:'grid', gridTemplateColumns:`repeat(${TABLE_MAX - TABLE_MIN + 2}, 60px)`, gap:4 }}>
          <Box />
          {Array.from({ length: TABLE_MAX - TABLE_MIN + 1 }, (_,i)=> TABLE_MIN + i).map(n => (
            <Box key={`col-h-${n}`} style={{ textAlign:'center', fontSize:'0.7rem', fontWeight:600 }}>{n}</Box>
          ))}
          {Array.from({ length: TABLE_MAX - TABLE_MIN + 1 }, (_,row)=> TABLE_MIN + row).map(rowVal => (
            <React.Fragment key={`row-fragment-${rowVal}`}>
              <Box key={`row-h-${rowVal}`} style={{ textAlign:'center', fontSize:'0.7rem', fontWeight:600 }}>{rowVal}</Box>
              {Array.from({ length: TABLE_MAX - TABLE_MIN + 1 }, (_,col)=> TABLE_MIN + col).map(colVal => {
                const key = `${Math.min(rowVal,colVal)}x${Math.max(rowVal,colVal)}`;
                const stat = stats[key];
                const ratio = masteryRatio(stat);
                const inQueue = queueFacts.includes(key);
                return (
                  <Box
                    key={`cell-${rowVal}-${colVal}`}
                    onClick={() => {
                      try {
                        const raw = localStorage.getItem('mult_practice_queue');
                        const parsed = raw ? JSON.parse(raw) : [];
                        interface QueueItem { a: number; b: number }
                        const exists = Array.isArray(parsed) && (parsed as QueueItem[]).some((q)=> (q.a===rowVal && q.b===colVal) || (q.a===colVal && q.b===rowVal));
                        if (!exists) {
                          const updated = Array.isArray(parsed) ? [...parsed, { a: rowVal, b: colVal }] : [{ a: rowVal, b: colVal }];
                          localStorage.setItem('mult_practice_queue', JSON.stringify(updated));
                          window.dispatchEvent(new CustomEvent('ls-update', { detail: { key: 'mult_practice_queue' } }));
                        }
                      } catch {}
                    }}
                    title={inQueue ? 'Queued for practice' : 'Click to queue'}
                    style={{
                      width:56,
                      height:56,
                      borderRadius:8,
                      background: colorFor(stat),
                      display:'flex',
                      alignItems:'center',
                      justifyContent:'center',
                      flexDirection:'column',
                      cursor:'pointer',
                      outline: inQueue ? '3px solid var(--yellow-9)' : 'none'
                    }}
                  >
                    <Text size="1" weight="bold" style={{ color:'white' }}>{rowVal}×{colVal}</Text>
                    <Text size="1" style={{ color:'white' }}>
                      {stat
                        ? viewMode === 'accuracy'
                          ? (ratio === null ? '–' : `${Math.round(ratio * 100)}%`)
                          : stat.attempts
                        : '–'}
                    </Text>
                  </Box>
                );
              })}
            </React.Fragment>
          ))}
        </Box>
      </Box>
      <Flex gap="3" mt="4" wrap="wrap" align="center">
        <Flex gap="2" wrap="wrap">
          <Badge color="green" variant="soft">≥{Math.round(thresholds.mastered*100)}% Mastered</Badge>
          <Badge color="green" variant="soft">≥{Math.round(thresholds.strong*100)}% Strong</Badge>
          <Badge color="orange" variant="soft">≥{Math.round(thresholds.developing*100)}% Developing</Badge>
          <Badge color="red" variant="soft">&gt;0% Emerging</Badge>
          <Badge color="gray" variant="soft">No Data</Badge>
        </Flex>
        <Flex gap="2" ml="3" align="center">
          <Text size="2" color="gray">View:</Text>
          <Box style={{ display:'flex', gap:6 }}>
            <button
              type="button"
              onClick={() => setViewMode('accuracy')}
              style={{
                padding:'4px 10px',
                borderRadius:6,
                background: viewMode==='accuracy' ? 'var(--accent-9)' : 'var(--gray-4)',
                color: viewMode==='accuracy' ? 'white':'var(--gray-12)',
                fontSize:'0.75rem',
                border:'none',
                cursor:'pointer'
              }}>Accuracy</button>
            <button
              type="button"
              onClick={() => setViewMode('attempts')}
              style={{
                padding:'4px 10px',
                borderRadius:6,
                background: viewMode==='attempts' ? 'var(--accent-9)' : 'var(--gray-4)',
                color: viewMode==='attempts' ? 'white':'var(--gray-12)',
                fontSize:'0.75rem',
                border:'none',
                cursor:'pointer'
              }}>Attempts</button>
          </Box>
        </Flex>
      </Flex>
    </Card>
  );
}
