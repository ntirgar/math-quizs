"use client";
import { useState } from 'react';
import { Container, Card, Heading, Text, Flex, Box, Badge } from '@radix-ui/themes';
import { AppHeader } from '@/components';
import { generateDiagnosticSet, DiagnosticQuestion } from '@/utils/diagnosticGenerator';

interface AnswerRecord { id: string; userAnswer: number; correct: boolean; answer: number; rationale: string; type: string; }

export default function DiagnosticPage() {
  const [started, setStarted] = useState(false);
  const [questions, setQuestions] = useState<DiagnosticQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [completed, setCompleted] = useState(false);

  const begin = () => {
    const set = generateDiagnosticSet(15);
    setQuestions(set);
    setStarted(true);
    setCurrentIndex(0);
    setAnswers([]);
    setCompleted(false);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questions[currentIndex]) return;
    const q = questions[currentIndex];
    const user = parseInt(inputValue,10);
    const correct = user === q.answer;
    setAnswers(prev => [...prev, { id: q.id, userAnswer: user, correct, answer: q.answer, rationale: q.rationale, type: q.type }]);
    setInputValue('');
    if (currentIndex + 1 >= questions.length) {
      setCompleted(true);
    } else {
      setCurrentIndex(i => i + 1);
    }
  };

  const masteryScore = () => {
    if (!answers.length) return 0;
    return Math.round((answers.filter(a=> a.correct).length / answers.length) * 100);
  };

  return (
    <Container style={{ padding:'2rem 1rem' }}>
      <AppHeader />
      <Heading size="6" mb="4">Targeted Diagnostic Test</Heading>
      {!started && (
        <Card size="3" mb="4">
          <Heading size="4" mb="2">Personalized Practice Set</Heading>
          <Text size="2" color="gray" mb="3">We analyze your stored progress and mistakes to generate a focused set of problems targeting weak facts and subskills. 15 questions max.</Text>
          <button onClick={begin} style={btnStylePrimary}>Generate & Begin ▶</button>
        </Card>
      )}
      {started && !completed && questions[currentIndex] && (
        <Card size="3" mb="4">
          <Flex direction="column" gap="3">
            <Heading size="4" mb="2">Question {currentIndex+1} / {questions.length}</Heading>
            <Text size="2" weight="bold" style={{ fontFamily:'monospace' }}>
              {questions[currentIndex].type === 'addition' ? `${questions[currentIndex].num1} + ${questions[currentIndex].num2}` : `${questions[currentIndex].num1} × ${questions[currentIndex].num2}`} = ?
            </Text>
            <Text size="1" color="gray">Reason: {questions[currentIndex].rationale}</Text>
            <form onSubmit={submit} style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <input
                value={inputValue}
                onChange={e=> setInputValue(e.target.value.replace(/[^0-9]/g,''))}
                placeholder="Answer"
                style={{ padding:'6px 8px', border:'1px solid var(--gray-6)', borderRadius:6, fontSize:'0.9rem', minWidth:120 }}
              />
              <button type="submit" disabled={!inputValue} style={btnStylePrimary}>Submit</button>
            </form>
            <Flex gap="2" wrap="wrap">
              {questions[currentIndex].tags.map(t => (
                <Badge key={t} color={tagColor(t)} variant="soft">{t}</Badge>
              ))}
            </Flex>
          </Flex>
        </Card>
      )}
      {completed && (
        <Card size="3">
          <Heading size="4" mb="3">Results</Heading>
          <Text size="2" mb="2">Score: {masteryScore()}%</Text>
          <Flex direction="column" gap="2" mb="3">
            {answers.map(a => (
              <Box key={a.id} style={{
                border:'1px solid var(--gray-6)',
                borderRadius:8,
                padding:'8px 10px',
                background: a.correct ? 'var(--green-3)' : 'var(--red-3)'
              }}>
                <Text size="2" weight="medium" style={{ fontFamily:'monospace' }}>{a.type === 'addition' ? '＋' : '×'} {a.userAnswer} {a.correct ? '✓':'✗'} (ans {a.answer})</Text>
                <Text size="1" color="gray">{a.rationale}</Text>
              </Box>
            ))}
          </Flex>
          <button onClick={begin} style={btnStylePrimary}>Retake Diagnostic</button>
        </Card>
      )}
    </Container>
  );
}

const btnStylePrimary: React.CSSProperties = {
  background:'var(--blue-9)',
  color:'white',
  border:'none',
  padding:'8px 14px',
  borderRadius:8,
  cursor:'pointer',
  fontSize:'0.8rem'
};

function tagColor(t: string): 'blue'|'green'|'orange'|'yellow'|'red'|'gray'|'purple' {
  if (t === 'fact') return 'purple';
  if (t === 'multiplication') return 'purple';
  if (t === 'addition') return 'blue';
  if (t === 'recent') return 'orange';
  if (t === 'reinforce') return 'yellow';
  return 'gray';
}
