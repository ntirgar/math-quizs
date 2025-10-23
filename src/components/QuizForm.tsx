import { Card, Flex, Button, Text, Box, Tooltip } from '@radix-ui/themes';
import { useEffect, useRef, useState } from 'react';
import { MathProblem } from './MathProblem';
import { ResultFeedback } from './ResultFeedback';
import { DigitBox } from './DigitBox';
import { AudioFeedback } from './AudioFeedback';
import { Confetti } from './Confetti';

interface Question {
  num1: number;
  num2: number;
  answer: number;
}

interface QuizFormProps {
  question: Question;
  digitInputs: string[];
  showResult: boolean;
  lastAnswerCorrect: boolean | null;
  isSubmitDisabled: boolean;
  answerDigitCount: number;
  onDigitChange: (index: number, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  operator?: string; // '+' or '×'
  adaptiveMode?: boolean;
  onAdaptiveToggle?: (value: boolean) => void;
  subskillProgress?: Record<string, { correct: number; attempts: number }>; // optional summary
  streak?: number;
  bestStreak?: number;
  currentSubskills?: string[];
  celebration?: string | null;
  onClearCelebration?: () => void;
  lastUserAnswer?: number | null;
  audioEnabled?: boolean;
  onAudioToggle?: (value: boolean) => void;
  tone?: 'concise' | 'teacher';
}

export function QuizForm({
  question,
  digitInputs,
  showResult,
  lastAnswerCorrect,
  isSubmitDisabled,
  answerDigitCount,
  onDigitChange,
  onSubmit,
  operator = '+',
  adaptiveMode,
  onAdaptiveToggle,
  subskillProgress,
  streak,
  bestStreak,
  currentSubskills,
  celebration,
  onClearCelebration
  , lastUserAnswer
  , audioEnabled
  , onAudioToggle
  , tone
}: QuizFormProps) {
  const questionKey = `${question.num1}-${question.num2}`;
  const [incoming, setIncoming] = useState(false);
  const [resultTimerPct, setResultTimerPct] = useState(0);
  const prevKeyRef = useRef(questionKey);

  // Detect new question to trigger entrance animation
  useEffect(() => {
    if (questionKey !== prevKeyRef.current) {
      setIncoming(true);
      prevKeyRef.current = questionKey;
      const t = setTimeout(() => setIncoming(false), 600); // animation duration
      return () => clearTimeout(t);
    }
  }, [questionKey]);

  // Animate countdown to next question while showing result
  useEffect(() => {
    if (showResult) {
      const start = performance.now();
      let raf: number;
      const tick = (now: number) => {
        const pct = Math.min(1, (now - start) / 2000); // 2s cycle
        setResultTimerPct(pct);
        if (pct < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    } else {
      setResultTimerPct(0);
    }
  }, [showResult]);

  return (
    <Card size="3">
      <Flex direction="column" gap="4">
        <Flex justify="between" align="center" wrap="wrap" gap="3">
          <Flex align="center" gap="3">
            {typeof streak === 'number' && streak > 1 && (
              <Box className="streak-badge" style={{ background: 'var(--blue-9)', color: 'white', padding: '2px 8px', borderRadius: 20, fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                🔥 {streak} in a row
              </Box>
            )}
            {typeof bestStreak === 'number' && bestStreak > 0 && (
              <Box style={{ background: 'var(--gray-4)', color: 'var(--gray-12)', padding: '2px 6px', borderRadius: 14, fontSize: '0.6rem' }}>
                Best: {bestStreak}
              </Box>
            )}
          </Flex>
          <Flex align="center" gap="4" wrap="wrap">
            {typeof adaptiveMode === 'boolean' && onAdaptiveToggle && (
              <Flex align="center" gap="2">
                <Text size="1" color="gray">Adaptive</Text>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={adaptiveMode}
                    onChange={(e) => onAdaptiveToggle(e.target.checked)}
                    style={{
                      width: '2.5rem',
                      height: '1.25rem',
                      cursor: 'pointer',
                      accentColor: 'var(--accent-9)'
                    }}
                  />
                </label>
              </Flex>
            )}
            {typeof audioEnabled === 'boolean' && onAudioToggle && (
              <Flex align="center" gap="2">
                <Text size="1" color="gray">Audio</Text>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={audioEnabled}
                    onChange={(e) => onAudioToggle(e.target.checked)}
                    style={{
                      width: '2.5rem',
                      height: '1.25rem',
                      cursor: 'pointer',
                      accentColor: 'var(--accent-9)'
                    }}
                  />
                </label>
              </Flex>
            )}
          </Flex>
        </Flex>
        <div
          className={[
            'question-transition-wrapper',
            showResult ? 'question-exit' : '',
            incoming ? 'question-enter' : '' ,
            showResult && lastAnswerCorrect === true ? 'question-correct' : '',
            showResult && lastAnswerCorrect === false ? 'question-incorrect' : '',
            (streak || 0) >= 3 ? 'streak-glow' : ''
          ].filter(Boolean).join(' ')}
        >
          {celebration && (
            <Confetti triggerKey={celebration} onComplete={onClearCelebration} />
          )}
          <MathProblem num1={question.num1} num2={question.num2} operator={operator} resultValue={question.answer}>
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'1.2rem'}}>
                <Text size="2" color="gray" align="center">Enter your answer by place value:</Text>
                <div style={{display:'grid',gap:'0.5rem',gridTemplateColumns:`repeat(${Math.min(answerDigitCount,4)},1fr)`}}>
                  {Array.from({length: Math.min(answerDigitCount,4)}, (_, index) => {
                    const digitIndex = digitInputs.length - answerDigitCount + index;
                    const placeNames = ['thousands','hundreds','tens','ones'];
                    const placeIndex = 4 - Math.min(answerDigitCount,4) + index;
                    const isVisible = placeIndex < 4 && answerDigitCount > (3 - placeIndex);
                    if(!isVisible) return null;
                    return (
                      <DigitBox
                        key={`db-${questionKey}-${digitIndex}`}
                        isInteractive
                        selectedValue={digitInputs[digitIndex] || undefined}
                        placeholder="?"
                        disabled={showResult}
                        onValueChange={(v: string)=>onDigitChange(digitIndex,v)}
                        placeValueLabel={placeNames[placeIndex]}
                        questionKey={questionKey}
                        aria-label={`${placeNames[placeIndex]} digit input`}
                      />
                    );
                  })}
                </div>
                {answerDigitCount > 4 && (
                  <Text size="1" color="orange" style={{fontStyle:'italic'}}>Answer has {answerDigitCount} digits (showing last 4 places)</Text>
                )}
              </div>
          </MathProblem>
          {showResult && answerDigitCount <= 4 && (
            <div className="next-question-progress" aria-label="Next question timer">
              <div style={{ width: `${resultTimerPct * 100}%` }} />
            </div>
          )}
        </div>
        
        {showResult && (
          <ResultFeedback 
            lastAnswerCorrect={lastAnswerCorrect} 
            question={question} 
          />
        )}
        {showResult && (
          <AudioFeedback
            num1={question.num1}
            num2={question.num2}
            correctAnswer={question.answer}
            lastAnswerCorrect={lastAnswerCorrect}
            lastUserAnswer={lastUserAnswer ?? null}
            enabled={audioEnabled}
            operator={operator}
            tone={tone}
          />
        )}

        {adaptiveMode && currentSubskills && currentSubskills.length > 0 && (
          <Flex gap="2" wrap="wrap" mb="2">
            {currentSubskills.map(s => (
              <Box key={s} style={{ background:'var(--gray-2)', padding:'4px 8px', borderRadius: 14, fontSize:'0.65rem' }}>{s}</Box>
            ))}
          </Flex>
        )}

        {celebration && (
          <Box className="ui-row ui-row--emphasis" style={{ position:'relative', boxShadow:'0 0 0 2px var(--blue-6) inset' }}>
            <Text size="2" weight="medium">🎉 {celebration.includes('new-best') ? 'New Best Streak!' : `Streak Milestone: ${celebration.replace('streak-','')}`}</Text>
            <Button size="1" variant="ghost" style={{ position:'absolute', top:4, right:4 }} onClick={onClearCelebration}>×</Button>
          </Box>
        )}

        <form onSubmit={onSubmit}>
          <Flex direction="column" gap="3">
            <Button
              type="submit"
              size="3"
              disabled={isSubmitDisabled}
              aria-label={answerDigitCount > 4 ? 'Reveal full answer' : 'Submit answer'}
              style={{ cursor: showResult ? 'not-allowed' : 'pointer' }}
              role="button"
            >
              {answerDigitCount > 4 ? 'See Answer' : 'Submit Answer'}
            </Button>
            {adaptiveMode && subskillProgress && (
              <Box className="ui-row" style={{ padding:'10px 12px' }}>
                <Text size="1" color="gray" weight="medium">Adaptive Focus Summary</Text>
                <Flex wrap="wrap" gap="4" mt="2">
                  {Object.entries(subskillProgress).slice(0,5).map(([id, stats]) => {
                    const pct = stats.attempts ? Math.round((stats.correct / stats.attempts) * 100) : 0;
                    return (
                      <Tooltip key={id} content={`${stats.correct}/${stats.attempts} correct`}>
                        <Box style={{ background: 'var(--gray-3)', padding: '4px 8px', borderRadius: 6 }}>
                          <Text size="1">{id}:{pct}%</Text>
                        </Box>
                      </Tooltip>
                    );
                  })}
                </Flex>
              </Box>
            )}
          </Flex>
        </form>
      </Flex>
    </Card>
  );
}