"use client";
import { QuizForm, Statistics } from '@/components';
import { LiveAnnouncement } from '@/components/LiveAnnouncement';
import { AdditionStageBanner } from '@/components/AdditionStageBanner';
import { AppShell } from '@/components/AppShell';
import { useQuizLogic } from '@/hooks/useQuizLogic';
import { useEffect } from 'react';

export default function AdditionPage() {
  const {
    question,
    digitInputs,
    streak,
    bestStreak,
    lastAnswerCorrect,
    showResult,
    isSubmitDisabled,
    getAnswerDigitCount,
    handleDigitChange,
    handleSubmit,
    adaptiveMode,
    setAdaptiveMode,
    subskillProgress,
    currentSubskills,
    celebration,
    clearCelebration,
    lastUserAnswer,
    audioEnabled,
    setAudioEnabled,
    additionStage,
    singleDigitStats,
    SINGLE_DIGIT_MASTERY_TARGET,
    SINGLE_DIGIT_ACCURACY_REQUIRED,
    resetSingleDigitProgress,
    forceAdvanceToStageTwo,
    forceReturnToStageOne,
  } = useQuizLogic();

  const handleAdaptiveToggle = setAdaptiveMode;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).tagName === 'INPUT') return;
      if (e.key === 'a' && additionStage === 2) {
        setAdaptiveMode(prev => !prev);
      } else if (e.key === 'r') {
        const len = digitInputs.length;
        for (let idx = 0; idx < len; idx++) handleDigitChange(idx, '');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [additionStage, digitInputs.length, handleDigitChange, setAdaptiveMode]);

  return (
    <AppShell>
      <LiveAnnouncement message={showResult && lastAnswerCorrect !== null ? (lastAnswerCorrect ? 'Correct answer' : 'Incorrect answer, try again') : null} />
      <div className="quiz-layout" style={{ marginTop: '1.25rem' }}>
        <div className="problem-pane" style={{ minWidth: '300px' }}>
          <QuizForm
            question={question}
            digitInputs={digitInputs}
            showResult={showResult}
            lastAnswerCorrect={lastAnswerCorrect}
            isSubmitDisabled={isSubmitDisabled}
            answerDigitCount={getAnswerDigitCount()}
            onDigitChange={handleDigitChange}
            onSubmit={handleSubmit}
            adaptiveMode={adaptiveMode}
            onAdaptiveToggle={handleAdaptiveToggle}
            subskillProgress={subskillProgress}
            streak={streak}
            bestStreak={bestStreak}
            currentSubskills={currentSubskills}
            celebration={celebration}
            onClearCelebration={clearCelebration}
            lastUserAnswer={lastUserAnswer}
            audioEnabled={audioEnabled}
            onAudioToggle={setAudioEnabled}
          />
        </div>
        <div className="stats-pane" style={{ minWidth: '240px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <AdditionStageBanner
              stage={additionStage}
              singleDigitStats={singleDigitStats}
              masteryTarget={SINGLE_DIGIT_MASTERY_TARGET}
              accuracyRequired={SINGLE_DIGIT_ACCURACY_REQUIRED}
              subskillProgress={subskillProgress}
              onReset={resetSingleDigitProgress}
              onForceStage2={forceAdvanceToStageTwo}
              onReturnStage1={forceReturnToStageOne}
            />
            <Statistics />
          </div>
        </div>
      </div>
      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <a href="/growth" className="link-button">View Full Learning Analysis →</a>
      </div>
    </AppShell>
  );
}
