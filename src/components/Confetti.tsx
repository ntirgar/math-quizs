import { useEffect, useState, useRef } from 'react';

interface ConfettiProps {
  triggerKey: string | null; // change to re-fire
  colors?: string[];
  pieceCount?: number;
  onComplete?: () => void;
}

export function Confetti({ triggerKey, colors = ['#3b82f6','#6366f1','#f59e0b','#10b981','#ef4444'], pieceCount = 40, onComplete }: ConfettiProps) {
  const [pieces, setPieces] = useState<Array<{ id: number; left: string; delay: string; color: string; duration: string }>>([]);
  const lastTriggerRef = useRef<string | null>(null);
  const stableColorsRef = useRef(colors);
  const stableCompleteRef = useRef(onComplete);
  const stableCountRef = useRef(pieceCount);

  // Update refs if props change (without retriggering effect logic excessively)
  useEffect(() => { stableColorsRef.current = colors; }, [colors]);
  useEffect(() => { stableCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => { stableCountRef.current = pieceCount; }, [pieceCount]);

  useEffect(() => {
    if (!triggerKey) return;
    if (lastTriggerRef.current === triggerKey) return; // prevent re-firing same key
    lastTriggerRef.current = triggerKey;
    const c = stableColorsRef.current;
    const count = stableCountRef.current;
    const generated = Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: `${Math.random()*100}%`,
      delay: `${Math.random()*0.3}s`,
      color: c[i % c.length],
      duration: `${1.2 + Math.random()*0.9}s`
    }));
    setPieces(generated);
    const t = setTimeout(() => { setPieces([]); stableCompleteRef.current?.(); }, 2100);
    return () => clearTimeout(t);
  }, [triggerKey]);

  if (pieces.length === 0) return null;
  return (
    <div className="confetti-layer" aria-hidden="true">
      {pieces.map(p => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left,
            top: '-8px',
            background: p.color,
            animationDelay: p.delay,
            animationDuration: p.duration,
            transform: `rotate(${Math.random()*360}deg)`
          }}
        />
      ))}
    </div>
  );
}
