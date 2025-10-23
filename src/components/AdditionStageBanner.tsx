import React, { useMemo, useRef, useEffect, useState } from 'react';
import { ProgressBar } from './ProgressBar';
import { AdaptiveHint } from './AdaptiveHint';
import { selectTargetSubskill, ADDITION_SUBSKILL_TARGETS } from '@/utils/commonAdaptive';

interface Stats { correct: number; attempts: number }
interface AdditionStageBannerProps {
  stage: number;
  singleDigitStats: Stats;
  masteryTarget: number;
  accuracyRequired: number; // 0-1
  subskillProgress: Record<string, Stats>;
  onReset: () => void;
  onForceStage2: () => void;
  onReturnStage1: () => void;
}

export const AdditionStageBanner: React.FC<AdditionStageBannerProps> = ({ stage, singleDigitStats, masteryTarget, accuracyRequired, subskillProgress, onReset, onForceStage2, onReturnStage1 }) => {
  const accuracyPct = singleDigitStats.attempts ? Math.round((singleDigitStats.correct / singleDigitStats.attempts) * 100) : 0;
  const progressPct = Math.min(100, (singleDigitStats.correct / masteryTarget) * 100);
  const nextTarget = useMemo(() => selectTargetSubskill(subskillProgress, ADDITION_SUBSKILL_TARGETS), [subskillProgress]);
  const prevStageRef = useRef(stage);
  const [announcement, setAnnouncement] = useState<string | null>(null);
  useEffect(() => {
    if (prevStageRef.current !== stage) {
      setAnnouncement(stage === 1 ? 'Switched to Stage 1: Single-digit facts' : 'Advanced to Stage 2: Multi-digit adaptive');
      prevStageRef.current = stage;
      const t = setTimeout(() => setAnnouncement(null), 3000);
      return () => clearTimeout(t);
    }
  }, [stage]);
  return (
    <div style={{ background:'var(--banner-bg)', border:'1px solid var(--banner-border)', padding:'14px 18px', borderRadius:'var(--radius-md)', boxShadow:'var(--shadow-sm)' }}>
      <div aria-live="assertive" aria-atomic="true" style={{position:'absolute',width:1,height:1,margin:-1,padding:0,overflow:'hidden',clip:'rect(0 0 0 0)',border:0}}>{announcement}</div>
      {stage === 1 ? (
        <>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap' }}>
            <div>
              <strong style={{ display:'block', fontSize:'0.95rem' }}>Stage 1: Single-Digit Facts</strong>
              <span style={{ fontSize:'0.7rem', color:'var(--gray-11)' }}>Master facts 0–9 to unlock adaptive multi-digit practice.</span>
            </div>
            <div style={{ display:'flex', gap:6 }}>
              <button onClick={onReset} className="btn-subtle">Reset</button>
              <button onClick={onForceStage2} className="btn-subtle">Force S2</button>
            </div>
          </div>
          <div style={{ marginTop:12, display:'grid', gap:12, gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))' }}>
            <ProgressBar value={progressPct} label={`Correct ${singleDigitStats.correct}/${masteryTarget}`} color='var(--green-9)' />
            <ProgressBar value={accuracyPct} label={`Accuracy ${accuracyPct}% (need ${Math.round(accuracyRequired*100)}%)`} color={accuracyPct >= Math.round(accuracyRequired*100) ? 'var(--green-9)' : 'var(--red-9)'} />
          </div>
        </>
      ) : (
        <>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
            <div>
              <strong style={{ display:'block', fontSize:'0.95rem' }}>Stage 2: Multi-Digit & Adaptive</strong>
              <span style={{ fontSize:'0.7rem', color:'var(--gray-11)' }}>Adaptive targeting active. Keep strengthening carry & place value flow.</span>
            </div>
            <button onClick={onReturnStage1} className="btn-subtle">Return S1</button>
          </div>
          <AdaptiveHint nextTarget={nextTarget || null} mode='addition' />
        </>
      )}
    </div>
  );
};
