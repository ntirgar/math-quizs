import React, { useMemo, useRef, useEffect, useState } from 'react';
import { ProgressBar } from './ProgressBar';
import { AdaptiveHint } from './AdaptiveHint';
import { selectTargetSubskill, MULT_SUBSKILL_TARGETS } from '@/utils/commonAdaptive';

interface TableProgress { [table: number]: { correct: number; attempts: number } }
interface Stats { correct: number; attempts: number }
interface MultiplicationStageBannerProps {
  stage: number;
  activeTable: number;
  tableProgress: TableProgress;
  perTableTarget: number;
  perTableAccuracyRequired: number; // 0-1
  onReset: () => void;
  onForceStage2: () => void;
  onReturnStage1: () => void;
  jumpToTable: (t: number) => void;
  subskillProgress: Record<string, Stats>;
}

export const MultiplicationStageBanner: React.FC<MultiplicationStageBannerProps> = ({ stage, activeTable, tableProgress, perTableTarget, perTableAccuracyRequired, onReset, onForceStage2, onReturnStage1, jumpToTable, subskillProgress }) => {
  const currentStats = tableProgress[activeTable] || { correct:0, attempts:0 };
  const accuracyPct = currentStats.attempts ? Math.round((currentStats.correct / currentStats.attempts) * 100) : 0;
  const progressPct = Math.min(100, (currentStats.correct / perTableTarget) * 100);
  const masteredCount = Object.values(tableProgress).filter(tp => tp.correct >= perTableTarget && (tp.correct / Math.max(1,tp.attempts)) >= perTableAccuracyRequired).length;
  const nextTarget = useMemo(() => stage === 2 ? selectTargetSubskill(subskillProgress, MULT_SUBSKILL_TARGETS) : null, [stage, subskillProgress]);
  const prevStageRef = useRef(stage);
  const [announcement, setAnnouncement] = useState<string | null>(null);
  useEffect(() => {
    if (prevStageRef.current !== stage) {
      setAnnouncement(stage === 1 ? 'Switched to Stage 1: Multiplication tables focus' : 'Advanced to Stage 2: Adaptive multi-digit multiplication');
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
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
            <div>
              <strong style={{ display:'block', fontSize:'0.95rem' }}>Stage 1: Multiplication Tables</strong>
              <span style={{ fontSize:'0.7rem', color:'var(--gray-11)' }}>Master each table (2–9). Focus: {activeTable}×n</span>
            </div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              <button onClick={onReset} className="btn-subtle">Reset</button>
              <button onClick={onForceStage2} className="btn-subtle">Force S2</button>
            </div>
          </div>
          <div style={{ marginTop:12, display:'grid', gap:12, gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))' }}>
            <ProgressBar value={progressPct} label={`Table ${activeTable} ${currentStats.correct}/${perTableTarget}`} color='var(--purple-9)' />
            <ProgressBar value={accuracyPct} label={`Accuracy ${accuracyPct}% (need ${Math.round(perTableAccuracyRequired*100)}%)`} color={accuracyPct >= Math.round(perTableAccuracyRequired*100) ? 'var(--green-9)' : 'var(--red-9)'} />
            <ProgressBar value={(masteredCount/8)*100} label={`Mastered ${masteredCount}/8`} color='var(--blue-9)' />
          </div>
          <div style={{ marginTop:12, display:'flex', gap:6, flexWrap:'wrap' }}>
            {[2,3,4,5,6,7,8,9].map(t => (
              <button key={t} onClick={()=> jumpToTable(t)} className={t===activeTable? 'btn-tab-active':'btn-tab'}>{t}</button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
            <div>
              <strong style={{ display:'block', fontSize:'0.95rem' }}>Stage 2: Multi-Digit & Adaptive</strong>
              <span style={{ fontSize:'0.7rem', color:'var(--gray-11)' }}>Adaptive targeting enabled. Build fact fluency & multi-digit structure.</span>
            </div>
            <button onClick={onReturnStage1} className="btn-subtle">Return S1</button>
          </div>
          <AdaptiveHint nextTarget={nextTarget || null} mode='multiplication' />
        </>
      )}
    </div>
  );
};
