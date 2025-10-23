"use client";
import { AppShell } from '@/components/AppShell';
import { AppHeader } from '@/components/AppHeader';
import { Card, Heading, Text } from '@radix-ui/themes';
import { useSubtractionQuizLogic } from '@/hooks/useSubtractionQuizLogic';
import { QuizForm, Statistics } from '@/components';
import { LiveAnnouncement } from '@/components/LiveAnnouncement';

export default function SubtractionPage() {
  const {
    question,
    digitInputs,
    streak,
    bestStreak,
    lastAnswerCorrect,
    showResult,
    accuracy,
    isSubmitDisabled,
    getAnswerDigitCount,
    handleDigitChange,
    handleSubmit,
    stage,
  } = useSubtractionQuizLogic();

  return (
    <AppShell>
      <AppHeader />
      <LiveAnnouncement message={showResult && lastAnswerCorrect !== null ? (lastAnswerCorrect ? 'Correct subtraction' : 'Incorrect subtraction') : null} />
      <Heading size="6" mb="3">Subtraction Practice (Stage {stage})</Heading>
      <div className="quiz-layout" style={{ marginTop:'1rem' }}>
        <div className="problem-pane" style={{ minWidth:'300px' }}>
          <QuizForm
            question={question}
            digitInputs={digitInputs}
            showResult={showResult}
            lastAnswerCorrect={lastAnswerCorrect}
            isSubmitDisabled={isSubmitDisabled}
            answerDigitCount={getAnswerDigitCount()}
            onDigitChange={handleDigitChange}
            onSubmit={handleSubmit}
            operator="-"
            adaptiveMode={false}
            onAdaptiveToggle={undefined}
            subskillProgress={undefined}
            streak={streak}
            bestStreak={bestStreak}
            currentSubskills={[]}
            celebration={null}
            onClearCelebration={()=>{}}
            lastUserAnswer={null}
            audioEnabled={true}
            onAudioToggle={()=>{}}
          />
        </div>
        <div className="stats-pane" style={{ minWidth:'240px' }}>
          <Statistics />
          <Card size="2" mt="4">
            <Heading size="4" mb="2">Subtraction Accuracy</Heading>
            <Text size="2" color="gray">{accuracy}% (streak {streak}, best {bestStreak})</Text>
            <Text size="1" mt="1" color="gray">Stage 1: single-digit, no borrow. Stage 2: multi-digit with borrowing.</Text>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
