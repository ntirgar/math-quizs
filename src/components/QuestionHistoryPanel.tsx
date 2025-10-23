import { useState, useMemo } from 'react';
import { Card, Heading, Flex, Text, Badge, ScrollArea, TextField, SegmentedControl, Box } from '@radix-ui/themes';

interface Progress { [key: string]: number }
interface MistakeEntry {
  question: string;
  userAnswer: number;
  correctAnswer: number;
  num1: number;
  num2: number;
  timestamp: number;
}

interface QuestionHistoryPanelProps {
  progress: Progress;
  mistakes: MistakeEntry[];
  onReattempt?: (num1: number, num2: number) => void;
  onClearProgress?: () => void;
  onClearMistakes?: () => void;
}

export function QuestionHistoryPanel({ progress, mistakes, onReattempt, onClearProgress, onClearMistakes }: QuestionHistoryPanelProps) {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'mastery' | 'mistakes'>('mastery');

  const progressEntries = useMemo(() => {
    const entries = Object.entries(progress);
    if (!query.trim()) return entries;
    return entries.filter(([k]) => k.toLowerCase().includes(query.toLowerCase()));
  }, [progress, query]);

  const recentMistakes = useMemo(() => {
    const list = [...mistakes].reverse();
    if (!query.trim()) return list;
    return list.filter(m => m.question.toLowerCase().includes(query.toLowerCase()));
  }, [mistakes, query]);

  return (
    <Card size="3" mb="6">
      <Flex justify="between" align="center" mb="3" wrap="wrap" gap="3">
        <Heading size="5">Question History</Heading>
  <SegmentedControl.Root size="2" value={mode} onValueChange={v => setMode(v as 'mastery' | 'mistakes')}>
          <SegmentedControl.Item value="mastery">Mastery</SegmentedControl.Item>
          <SegmentedControl.Item value="mistakes">Mistakes</SegmentedControl.Item>
        </SegmentedControl.Root>
      </Flex>
      <Text size="2" color="gray" mb="3">
        {mode === 'mastery' ? 'How often you\'ve reinforced each question.' : 'Recent incorrect attempts to learn from.'}
      </Text>
      <Box mb="3">
        <TextField.Root placeholder="Search 12+45" value={query} onChange={e => setQuery(e.target.value)} />
      </Box>
      {mode === 'mastery' && (
        progressEntries.length === 0 ? <Text size="2" color="gray">No history yet.</Text> : (
          <ScrollArea style={{ height: '260px' }}>
            <Flex direction="column" gap="2">
              {progressEntries
                .sort((a,b) => b[1]-a[1])
                .map(([questionKey, count]) => {
                  const [a,b] = questionKey.split('+').map(n => parseInt(n,10));
                  return (
                    <Flex key={questionKey} justify="between" align="center" className={`ui-row ui-row--clickable`} style={{ cursor: onReattempt ? 'pointer':'default' }}
                      onClick={() => onReattempt && onReattempt(a,b)}
                    >
                      <Text size="2" style={{ fontVariantNumeric: 'tabular-nums' }}>{questionKey.replace('+',' + ')}</Text>
                      <Badge color="green" variant="soft">{count} correct</Badge>
                    </Flex>
                  );
                })}
            </Flex>
          </ScrollArea>
        )
      )}
      {mode === 'mistakes' && (
        recentMistakes.length === 0 ? <Text size="2" color="gray">No mistakes recorded yet.</Text> : (
          <ScrollArea style={{ height: '260px' }}>
            <Flex direction="column" gap="2">
              {recentMistakes.map(m => {
                const [a,b] = m.question.split('+').map(n => parseInt(n,10));
                return (
                  <Flex key={m.timestamp + '-' + m.question} justify="between" align="center" className="ui-row ui-row--emphasis ui-row--clickable" style={{ cursor: onReattempt ? 'pointer':'default' }}
                    onClick={() => onReattempt && onReattempt(a,b)}
                  >
                    <Flex direction="column" gap="1">
                      <Text size="2" weight="medium">{m.question.replace('+',' + ')}</Text>
                      <Text size="1" color="gray">Your answer: {m.userAnswer} • Correct: {m.correctAnswer}</Text>
                    </Flex>
                    <Badge color="red" variant="soft">✕</Badge>
                  </Flex>
                );
              })}
            </Flex>
          </ScrollArea>
        )
      )}
      <Flex gap="3" mt="4" wrap="wrap">
        {mode === 'mastery' && onClearProgress && (
          <Badge asChild color="gray" variant="outline">
            <button style={{ background:'transparent', border:'none', cursor:'pointer' }} onClick={onClearProgress}>Clear Mastery</button>
          </Badge>
        )}
        {mode === 'mistakes' && onClearMistakes && (
          <Badge asChild color="red" variant="outline">
            <button style={{ background:'transparent', border:'none', cursor:'pointer' }} onClick={onClearMistakes}>Clear Mistakes</button>
          </Badge>
        )}
      </Flex>
    </Card>
  );
}
