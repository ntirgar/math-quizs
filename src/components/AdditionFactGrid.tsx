"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { Card, Heading, Text, Box, Flex, Badge } from '@radix-ui/themes';

interface FactStat { correct: number; attempts: number; mistakes: number }

// Addition fact grid 0-9 + 0-9 (unordered; treat a+b same as b+a)
export function AdditionFactGrid() {
  const [stats, setStats] = useState<Record<string, FactStat>>({});
  const MIN = 0;
  const MAX = 9;

  const [queueFacts, setQueueFacts] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'accuracy' | 'attempts'>('accuracy');
  const [thresholds, setThresholds] = useState<{ mastered:number; strong:number; developing:number }>({ mastered:0.95, strong:0.85, developing:0.70 });
  const refresh = useCallback(() => {
    try {
  const progressRaw = localStorage.getItem('progress'); // legacy aggregation
  const mistakesRaw = localStorage.getItem('mistakes');
  const attemptsRaw = localStorage.getItem('attempts');
      const queueRaw = localStorage.getItem('practice_queue');
      // Progress structure appears to store counts keyed by subskill IDs or question keys (in hooks). We'll parse keys like 'a-b'
      const thRaw = localStorage.getItem('mastery_thresholds');
      const progress: Record<string, number> = progressRaw ? JSON.parse(progressRaw) : {};
      const mistakes: Array<{ num1:number; num2:number; question?: string; questionKey?: string; userAnswer:number; correctAnswer:number }> = mistakesRaw ? JSON.parse(mistakesRaw) : [];
      const agg: Record<string, FactStat> = {};
      const record = (a:number,b:number, correctDelta:number, attemptDelta:number, mistakeDelta:number) => {
        const key = `${Math.min(a,b)}+${Math.max(a,b)}`;
        if (!agg[key]) agg[key] = { correct:0, attempts:0, mistakes:0 };
        agg[key].correct += correctDelta;
        agg[key].attempts += attemptDelta;
        agg[key].mistakes += mistakeDelta;
      };
      const attempts: Array<{ num1?:number; num2?:number; correct?: boolean | null; stage?: number }> = attemptsRaw ? JSON.parse(attemptsRaw) : [];
      const useAttempts = Array.isArray(attempts) && attempts.length > 0;

      if (useAttempts) {
        attempts.forEach(attempt => {
          const a = attempt?.num1;
          const b = attempt?.num2;
          const correct = attempt?.correct;
          if (typeof a === 'number' && typeof b === 'number' && a>=MIN && a<=MAX && b>=MIN && b<=MAX && correct !== null && typeof correct === 'boolean') {
            if (correct) {
              record(a,b,1,1,0);
            } else {
              record(a,b,0,1,1);
            }
          }
        });
      } else {
        Object.entries(progress).forEach(([k,count]) => {
          const m = k.match(/^(\d+)[+-](\d+)$/);
          if (m) {
            const a = parseInt(m[1],10); const b = parseInt(m[2],10);
            if (a>=MIN && a<=MAX && b>=MIN && b<=MAX) {
              record(a,b,count,count,0);
            }
          }
        });
        interface MistakeLike { num1?:number; num2?:number; a?:number; b?:number }
        mistakes.forEach(m => {
          const ml: MistakeLike = m as unknown as MistakeLike;
          const a = typeof ml.num1 === 'number' ? ml.num1 : ml.a;
          const b = typeof ml.num2 === 'number' ? ml.num2 : ml.b;
          if (typeof a==='number' && typeof b==='number' && a>=MIN && a<=MAX && b>=MIN && b<=MAX) {
            record(a,b,0,1,1);
          }
        });
      }
      setStats(agg);
      if (queueRaw) {
        try {
          const parsed = JSON.parse(queueRaw);
          interface QueueItem { num1: number; num2: number }
          if (Array.isArray(parsed)) setQueueFacts(parsed.filter((q:QueueItem)=> typeof q.num1==='number' && typeof q.num2==='number').map((q:QueueItem)=> `${Math.min(q.num1,q.num2)}+${Math.max(q.num1,q.num2)}`));
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
  }, []); // useCallback with no dependencies - function reads from localStorage directly
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent; const key = ce.detail?.key;
  if (key && ['progress','mistakes','attempts','practice_queue','mastery_thresholds','fact_view_mode_addition'].includes(key)) refresh();
    };
    window.addEventListener('ls-update', handler);
    return () => window.removeEventListener('ls-update', handler);
  }, [refresh]);
  // Initialize thresholds & view mode if absent
  useEffect(() => {
    const existing = localStorage.getItem('mastery_thresholds');
    if (!existing) {
      localStorage.setItem('mastery_thresholds', JSON.stringify(thresholds));
      window.dispatchEvent(new CustomEvent('ls-update', { detail: { key: 'mastery_thresholds' } }));
    }
    const vm = localStorage.getItem('fact_view_mode_addition');
    if (vm === 'attempts' || vm === 'accuracy') setViewMode(vm);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    localStorage.setItem('fact_view_mode_addition', viewMode);
    window.dispatchEvent(new CustomEvent('ls-update', { detail: { key: 'fact_view_mode_addition' } }));
  }, [viewMode]);

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
      <Heading size="5" mb="4">Addition Fact Grid (0–9)</Heading>
      <Text size="2" color="gray" mb="3">Accuracy coloring for single-digit sums. Strengthen weaker facts first.</Text>
      <Box style={{ overflowX:'auto' }}>
        <Box style={{ display:'grid', gridTemplateColumns:`repeat(${MAX - MIN + 2}, 56px)`, gap:4 }}>
          <Box />
          {Array.from({ length: MAX - MIN + 1 }, (_,i)=> MIN + i).map(n => (
            <Box key={`col-h-${n}`} style={{ textAlign:'center', fontSize:'0.7rem', fontWeight:600 }}>{n}</Box>
          ))}
          {Array.from({ length: MAX - MIN + 1 }, (_,row)=> MIN + row).map(rowVal => (
            <React.Fragment key={`row-${rowVal}`}> 
              <Box key={`row-h-${rowVal}`} style={{ textAlign:'center', fontSize:'0.7rem', fontWeight:600 }}>{rowVal}</Box>
              {Array.from({ length: MAX - MIN + 1 }, (_,col)=> MIN + col).map(colVal => {
                const key = `${Math.min(rowVal,colVal)}+${Math.max(rowVal,colVal)}`;
                const stat = stats[key];
                const ratio = masteryRatio(stat);
                const inQueue = queueFacts.includes(key);
                return (
                  <Box
                    key={`cell-${rowVal}-${colVal}`}
                    onClick={() => {
                      // Append to queue in localStorage (avoid duplicates)
                      try {
                        const raw = localStorage.getItem('practice_queue');
                        const parsed = raw ? JSON.parse(raw) : [];
                        interface QueueItem { num1: number; num2: number }
                        const exists = Array.isArray(parsed) && (parsed as QueueItem[]).some((q)=> (q.num1===rowVal && q.num2===colVal) || (q.num1===colVal && q.num2===rowVal));
                        if (!exists) {
                          const updated = Array.isArray(parsed) ? [...parsed, { num1: rowVal, num2: colVal }] : [{ num1: rowVal, num2: colVal }];
                          localStorage.setItem('practice_queue', JSON.stringify(updated));
                          window.dispatchEvent(new CustomEvent('ls-update', { detail: { key: 'practice_queue' } }));
                        }
                      } catch {}
                    }}
                    title={inQueue ? 'Queued for practice' : 'Click to queue'}
                    style={{
                      width:52,
                      height:52,
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
                    <Text size="1" weight="bold" style={{ color:'white' }}>{rowVal}+{colVal}</Text>
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
