"use client";

import { Statistics, QuizForm } from '@/components';
import { LiveAnnouncement } from '@/components/LiveAnnouncement';
import { MultiplicationStageBanner } from '@/components/MultiplicationStageBanner';
import { AppShell } from '@/components/AppShell';
import { useMultiplicationQuizLogic } from '@/hooks/useMultiplicationQuizLogic';
import { useState, useEffect } from 'react';

export default function MultiplicationPage() {
  const {
    question,
    setInputValue,
  // score & attempts now sourced via localStorage in Statistics
    streak,
    bestStreak,
    lastAnswerCorrect,
    showResult,
  // accuracy sourced via localStorage in Statistics
    isSubmitDisabled,
    handleSubmit,
    adaptiveMode,
    setAdaptiveMode,
    currentSubskills,
    celebration,
    clearCelebration,
    audioEnabled,
    setAudioEnabled,
    multStage,
    tableProgress,
    PER_TABLE_TARGET,
    PER_TABLE_ACCURACY_REQUIRED,
    activeTable,
    resetTablesProgress,
    forceAdvanceToStageTwo,
    forceReturnToStageOne,
    jumpToTable,
  } = useMultiplicationQuizLogic();

  // Pass useState setter directly - it's already stable
  const handleAdaptiveToggle = setAdaptiveMode;

  // ---- Table Preview (Stage 1) ----
  const PREVIEW_SECONDS = 60;
  const [showTablePreview, setShowTablePreview] = useState(multStage === 1);
  const [previewSecondsLeft, setPreviewSecondsLeft] = useState(PREVIEW_SECONDS);
  const previewSignature = `${multStage}|${activeTable}`;
  const [prevPreviewSignature, setPrevPreviewSignature] = useState(previewSignature);
  if (prevPreviewSignature !== previewSignature) {
    setPrevPreviewSignature(previewSignature);
    if (multStage === 1) {
      setShowTablePreview(true);
      setPreviewSecondsLeft(PREVIEW_SECONDS);
    } else {
      setShowTablePreview(false);
    }
  }
  useEffect(() => {
    if (!showTablePreview) return;
    const id = setInterval(() => {
      setPreviewSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          setShowTablePreview(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [showTablePreview]);
  const skipPreview = () => setShowTablePreview(false);
  const renderTablePreview = () => {
    const facts = Array.from({ length: 8 }, (_, i) => ({ f: i + 2, product: activeTable * (i + 2) }));
    return (
      <div className="table-preview">
        <strong style={{ fontSize: '0.95rem', display: 'block', marginBottom: 6 }}>Memorize Table {activeTable} Facts</strong>
        <span style={{ fontSize: '0.7rem', color: 'var(--gray-12)' }}>You have {previewSecondsLeft}s. Learn these before timed practice begins. Click &quot;Start Practice&quot; to skip early.</span>
        <div className="table-preview__facts">
          {facts.map(f => (
            <div key={f.f} className="table-preview__fact">{activeTable} × {f.f} = {f.product}</div>
          ))}
        </div>
        <div className="table-preview__progress" aria-label="Preview countdown progress">
          <div className="table-preview__progress-bar" style={{ width: `${(previewSecondsLeft / PREVIEW_SECONDS) * 100}%` }} />
        </div>
        <div className="table-preview__buttons">
          <button onClick={skipPreview} className="btn-small btn-small--primary">Start Practice</button>
          <button onClick={() => setPreviewSecondsLeft(PREVIEW_SECONDS)} className="btn-small">Restart Timer</button>
        </div>
      </div>
    );
  };

  // Answer input digits (place-value style)
  const answerLength = String(question.answer).length;
  const [digitInputsInternal, setDigitInputsInternal] = useState<string[]>(() => Array.from({ length: answerLength }, () => ''));
  const qSignature = `${question.a}|${question.b}|${answerLength}`;
  const [prevQSignature, setPrevQSignature] = useState(qSignature);
  if (prevQSignature !== qSignature) {
    setPrevQSignature(qSignature);
    setDigitInputsInternal(Array.from({ length: answerLength }, () => ''));
    setInputValue('');
  }

  // Keyboard shortcuts: 'a' toggle adaptive (stage 2), 'p' skip preview (stage1), 'r' reset digits
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).tagName === 'INPUT') return;
      if (e.key === 'a' && multStage === 2) {
        setAdaptiveMode(prev => !prev);
      } else if (e.key === 'p' && multStage === 1 && showTablePreview) {
        skipPreview();
      } else if (e.key === 'r') {
        setDigitInputsInternal(Array.from({ length: answerLength }, () => ''));
        setInputValue('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [multStage, showTablePreview, answerLength, setInputValue, setAdaptiveMode]);

  return (
    <AppShell>
      <LiveAnnouncement message={showResult && lastAnswerCorrect !== null ? (lastAnswerCorrect ? 'Correct answer' : 'Incorrect answer, try again') : null} />
      <MultiplicationStageBanner
        stage={multStage}
        activeTable={activeTable}
        tableProgress={tableProgress}
        perTableTarget={PER_TABLE_TARGET}
        perTableAccuracyRequired={PER_TABLE_ACCURACY_REQUIRED}
        onReset={resetTablesProgress}
        onForceStage2={forceAdvanceToStageTwo}
        onReturnStage1={forceReturnToStageOne}
        jumpToTable={jumpToTable}
        subskillProgress={{}}
      />
      {multStage === 1 && showTablePreview && renderTablePreview()}
      <div
        className="quiz-layout"
        style={{
          opacity: multStage === 1 && showTablePreview ? 0.25 : 1,
          pointerEvents: multStage === 1 && showTablePreview ? 'none' : 'auto',
          transition: 'opacity 0.3s',
        }}
      >
        <div className="problem-pane" style={{ minWidth: '300px' }}>
          <QuizForm
            question={{ num1: question.a, num2: question.b, answer: question.answer }}
            digitInputs={digitInputsInternal}
            showResult={showResult}
            lastAnswerCorrect={lastAnswerCorrect}
            isSubmitDisabled={isSubmitDisabled}
            answerDigitCount={answerLength}
            onDigitChange={(index, value) => {
              setDigitInputsInternal((prev) => {
                const next = prev.map((d, i) => (i === index ? value : d));
                const raw = next.map((d) => (/^[0-9]$/.test(d) ? d : '')).join('');
                setInputValue(raw);
                return next;
              });
            }}
            onSubmit={handleSubmit}
            operator="×"
            adaptiveMode={multStage === 2 ? adaptiveMode : false}
            onAdaptiveToggle={multStage === 2 ? handleAdaptiveToggle : undefined}
            subskillProgress={undefined}
            streak={streak}
            bestStreak={bestStreak}
            currentSubskills={currentSubskills}
            celebration={celebration}
            onClearCelebration={clearCelebration}
            lastUserAnswer={null}
            audioEnabled={audioEnabled}
            onAudioToggle={setAudioEnabled}
          />
        </div>
        <div className="stats-pane" style={{ minWidth: '240px', maxWidth: '400px' }}>
          <Statistics />
        </div>
      </div>
      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <a href="/growth" className="link-button link-button--purple">View Full Learning Analysis →</a>
      </div>
    </AppShell>
  );
}
