"use client";
import { useEffect, useState } from 'react';
import { Card, Heading, Text, Flex, Badge, Box, Separator } from '@radix-ui/themes';

interface LegacyAdditionAttempt { q: string; num1: number; num2: number; answer: number; userAnswer: number | null; correct: boolean | null; timestamp: number; stage?: number }
interface LegacyMultAttempt { q: string; a: number; b: number; answer: number; userAnswer: number | null; correct: boolean; timestamp: number }
interface UnifiedStoredAttempt { q: string; op: 'addition'|'multiplication'|'subtraction'|'division'; a: number; b: number; answer: number; userAnswer: number | null; correct: boolean | null; timestamp: number; stage?: number }

interface UnifiedAttempt {
  id: string;
  op: 'addition' | 'multiplication' | 'subtraction' | 'division';
  display: string;
  correct: boolean | null;
  userAnswer: number | null;
  answer: number;
  timestamp: number;
  stage?: number; // stage currently used for addition; could extend later per operation
}

export function AttemptTimeline() {
  const [attempts, setAttempts] = useState<UnifiedAttempt[]>([]);
  const [filter, setFilter] = useState<'all'|'correct'|'incorrect'>('all');
  const [showAddition, setShowAddition] = useState(true);
  const [showMultiplication, setShowMultiplication] = useState(true);
  const [showSubtraction, setShowSubtraction] = useState(true);
  const [showDivision, setShowDivision] = useState(true);
  const btnStyle: React.CSSProperties = {
    background:'var(--gray-4)',
    border:'1px solid var(--gray-6)',
    padding:'4px 8px',
    borderRadius:6,
    fontSize:'0.65rem',
    cursor:'pointer'
  };

  useEffect(()=> {
    try {
      const unified: UnifiedAttempt[] = [];
      const allRaw = localStorage.getItem('all_attempts');
      if (allRaw) {
        try {
          const parsed: UnifiedStoredAttempt[] = JSON.parse(allRaw);
          parsed.forEach(p => unified.push({
            id: `${p.op}-${p.timestamp}-${p.q}`,
            op: p.op,
            display: p.q.replace('+',' + ').replace('x',' × ').replace('-',' - ').replace('÷',' ÷ '),
            correct: p.correct,
            userAnswer: p.userAnswer,
            answer: p.answer,
            timestamp: p.timestamp,
            stage: p.stage
          }));
        } catch {}
      } else {
        // Fallback legacy keys
        const addRaw = localStorage.getItem('attempts');
        const multRaw = localStorage.getItem('mult_attempts');
        const addAttempts: LegacyAdditionAttempt[] = addRaw ? JSON.parse(addRaw) : [];
        const multAttempts: LegacyMultAttempt[] = multRaw ? JSON.parse(multRaw) : [];
        addAttempts.forEach(a => unified.push({
          id: `add-${a.timestamp}-${a.q}`,
          op: 'addition',
          display: a.q.replace('+',' + '),
          correct: a.correct,
          userAnswer: a.userAnswer,
          answer: a.answer,
          timestamp: a.timestamp,
          stage: a.stage
        }));
        multAttempts.forEach(m => unified.push({
          id: `mult-${m.timestamp}-${m.q}`,
          op: 'multiplication',
          display: m.q.replace('x',' × '),
          correct: m.correct,
          userAnswer: m.userAnswer,
          answer: m.answer,
          timestamp: m.timestamp
        }));
      }
      unified.sort((a,b)=> a.timestamp - b.timestamp);
      setAttempts(unified.slice(-200)); // cap to last 200 for performance
    } catch {}
  }, []);

  const filtered = attempts.filter(a => {
    if (!showAddition && a.op === 'addition') return false;
  if (!showMultiplication && a.op === 'multiplication') return false;
  if (!showSubtraction && a.op === 'subtraction') return false;
  if (!showDivision && a.op === 'division') return false;
    if (filter === 'correct') return a.correct === true;
    if (filter === 'incorrect') return a.correct === false;
    return true;
  });

  const exportJSON = () => {
    const payload = { exportedAt: new Date().toISOString(), attempts };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'attempts.json'; a.click();
    URL.revokeObjectURL(url);
  };
  const exportCSV = () => {
    const header = ['id','op','display','correct','userAnswer','answer','timestamp'];
    const rows = attempts.map(a => [a.id,a.op,a.display,a.correct,a.userAnswer ?? '',a.answer,a.timestamp]);
    const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'attempts.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card size="3" mt="6">
      <Heading size="5" mb="4">Attempt Timeline (Recent)</Heading>
      <Flex justify="between" align="center" wrap="wrap" gap="3" mb="3">
        <Flex gap="2" wrap="wrap" align="center">
          <Badge asChild color={filter==='all'?'blue':'gray'} style={{ cursor:'pointer' }}><span onClick={()=> setFilter('all')}>All</span></Badge>
          <Badge asChild color={filter==='correct'?'green':'gray'} style={{ cursor:'pointer' }}><span onClick={()=> setFilter('correct')}>Correct</span></Badge>
          <Badge asChild color={filter==='incorrect'?'red':'gray'} style={{ cursor:'pointer' }}><span onClick={()=> setFilter('incorrect')}>Incorrect</span></Badge>
        </Flex>
        <Flex gap="2" align="center">
          <Badge asChild color={showAddition? 'blue':'gray'} style={{ cursor:'pointer' }}><span onClick={()=> setShowAddition(v=> !v)}>Addition</span></Badge>
          <Badge asChild color={showSubtraction? 'teal':'gray'} style={{ cursor:'pointer' }}><span onClick={()=> setShowSubtraction(v=> !v)}>Subtraction</span></Badge>
          <Badge asChild color={showMultiplication? 'purple':'gray'} style={{ cursor:'pointer' }}><span onClick={()=> setShowMultiplication(v=> !v)}>Multiplication</span></Badge>
          <Badge asChild color={showDivision? 'orange':'gray'} style={{ cursor:'pointer' }}><span onClick={()=> setShowDivision(v=> !v)}>Division</span></Badge>
          <button onClick={exportJSON} style={btnStyle}>Export JSON</button>
          <button onClick={exportCSV} style={btnStyle}>Export CSV</button>
        </Flex>
      </Flex>
      {filtered.length === 0 && (
        <Text size="2" color="gray">No attempts recorded yet or filter removed all entries.</Text>
      )}
      <Flex direction="column" gap="2">
        {filtered.slice(-60).reverse().map(a => (
          <Box key={a.id} style={{
            border:'1px solid var(--gray-6)',
            borderRadius:8,
            padding:'8px 12px',
            background: a.correct == null ? 'var(--gray-3)' : a.correct ? 'var(--green-3)' : 'var(--red-3)'
          }}>
            <Flex justify="between" align="center" wrap="wrap" gap="2">
              <Flex align="center" gap="3" wrap="wrap">
                <Badge color={a.op==='addition'?'blue': a.op==='multiplication'?'purple': a.op==='subtraction'?'teal':'orange'} variant="soft">{a.op}</Badge>
                <Text size="2" weight="medium" style={{ fontFamily:'monospace' }}>{a.display} = {a.answer}</Text>
                {a.userAnswer != null && a.correct !== null && (
                  <Text size="2" color={a.correct ? 'green':'red'}>you {a.userAnswer}</Text>
                )}
                {a.correct === null && <Text size="1" color="gray">preview</Text>}
                {a.stage && a.op==='addition' && <Badge color={a.stage===1?'yellow':'green'} variant="soft">S{a.stage}</Badge>}
              </Flex>
              <Text size="1" color="gray">{new Date(a.timestamp).toLocaleTimeString()}</Text>
            </Flex>
          </Box>
        ))}
      </Flex>
      <Separator size="4" mt="4" />
      <Text size="1" color="gray" mt="2">Showing up to last 60 displayed (of {filtered.length}). Master list capped at 200 recent attempts to protect performance.</Text>
    </Card>
  );
}
