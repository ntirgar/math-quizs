import React from 'react';

interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
  color?: string; // CSS var or hex
  height?: number;
  animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ value, label, color='var(--blue-9)', height=8, animated=true }) => {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:4, width:'100%' }}>
      {label && <span style={{ fontSize:'0.65rem', color:'var(--gray-11)' }}>{label}</span>}
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{ position:'relative', width:'100%', background:'var(--gray-5)', borderRadius:6, height, overflow:'hidden' }}
      >
        <div style={{ position:'absolute', inset:0, width:`${pct}%`, background:color, transition: animated? 'width 0.5s ease':'none' }} />
      </div>
    </div>
  );
};
