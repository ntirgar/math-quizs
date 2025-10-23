import React from 'react';

interface AdaptiveHintProps {
  nextTarget?: string | null;
  mode: 'addition' | 'multiplication';
}

export const AdaptiveHint: React.FC<AdaptiveHintProps> = ({ nextTarget, mode }) => {
  if (!nextTarget) return null;
  return (
    <div style={{ marginTop:8, fontSize:'0.65rem', background:'var(--gray-3)', padding:'6px 10px', borderRadius:8 }}>
      <strong style={{ fontWeight:600 }}>Next focus ({mode}):</strong> {nextTarget}
    </div>
  );
};
