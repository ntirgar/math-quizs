import { useEffect, useRef } from 'react';
import { Box, Badge, Text } from '@radix-ui/themes';

interface AudioFeedbackProps {
  num1: number;
  num2: number;
  correctAnswer: number;
  lastAnswerCorrect: boolean | null;
  lastUserAnswer: number | null;
  enabled?: boolean;
  operator?: string; // '+' or '×'
  tone?: 'concise' | 'teacher';
}

// Basic speech synthesis wrapper with fallback text badge
export function AudioFeedback({ num1, num2, correctAnswer, lastAnswerCorrect, lastUserAnswer, enabled = true, operator = '+', tone = 'teacher' }: AudioFeedbackProps) {
  const prevKeyRef = useRef<string>('');
  const badge = lastAnswerCorrect === true ? 'Great job!' : lastAnswerCorrect === false ? 'Try again' : '';

  useEffect(() => {
    if (!enabled) return;
    if (lastAnswerCorrect === null) return;
  const key = `${num1}${operator}${num2}-${lastUserAnswer}-${lastAnswerCorrect}`;
    if (key === prevKeyRef.current) return;
    prevKeyRef.current = key;
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;
    if (!synth) return;

    const verb = operator === '×' ? 'times' : operator === '+' ? 'plus' : 'plus';
    const positiveTemplates = [
      `Nice work! ${num1} ${verb} ${num2} is ${correctAnswer}.`,
      `Great job. Yes, ${num1} ${verb} ${num2} equals ${correctAnswer}.`,
      `Correct – ${num1} ${verb} ${num2} makes ${correctAnswer}.`,
      `Well done. ${num1} ${verb} ${num2} = ${correctAnswer}.`
    ];
    const encouragementTemplates = [
      `Not quite this time. Let's look again.`,
      `Good effort. Let's check the place values.`,
      `Keep trying – we'll get it.`,
      `Let's slow down and inspect each digit.`
    ];
    const hintPlace = (diffAbs: number) => {
      if (operator === '+') {
        if (diffAbs < 10) return 'Consider the ones column.';
        if (diffAbs < 100) return 'The tens column might need review.';
        return 'Re-examine any carries across columns.';
      } else {
        if (diffAbs <= 12) return 'Memorize this fact; say it aloud: '+num1+` ${verb} ${num2} = ${correctAnswer}.`;
        if (diffAbs < 100) return 'Try breaking one factor into parts.';
        return 'Estimate first, then refine each place.';
      }
    };

    const buildUtterances = (): string[] => {
      if (lastAnswerCorrect) {
        if (tone === 'concise') return [`${num1} ${verb} ${num2} equals ${correctAnswer}.`];
        const phrase = positiveTemplates[Math.floor(Math.random()*positiveTemplates.length)];
        return [phrase];
      }
      const diff = lastUserAnswer == null ? null : (correctAnswer - lastUserAnswer);
      if (lastUserAnswer == null) {
        return tone === 'concise'
          ? [`Answer: ${correctAnswer}.`]
          : [
              `Here's the correct answer.`,
              `${num1} ${verb} ${num2} equals ${correctAnswer}.`
            ];
      }
      const sign = diff! > 0 ? 'short by' : 'over by';
      const absDiff = Math.abs(diff!);
      const encouragement = encouragementTemplates[Math.floor(Math.random()*encouragementTemplates.length)];
      if (tone === 'concise') {
        return [`Not correct. ${num1} ${verb} ${num2} = ${correctAnswer}.`];
      }
      return [
        encouragement,
        `You were ${sign} ${absDiff}.`,
        hintPlace(absDiff),
        `${num1} ${verb} ${num2} equals ${correctAnswer}.`
      ];
    };

    const utterances = buildUtterances();
    // Attempt to choose a human-like voice (Samantha macOS, or first female en-US)
    const voices = synth.getVoices();
    const preferred = voices.find(v => /Samantha/i.test(v.name))
      || voices.find(v => /female/i.test(v.name) && /en/i.test(v.lang))
      || voices.find(v => /en-US/i.test(v.lang))
      || voices[0];

    synth.cancel();
    utterances.forEach((text, idx) => {
      const u = new SpeechSynthesisUtterance(text);
      u.rate = tone === 'teacher' ? 0.95 : 1.05;
      u.pitch = tone === 'teacher' ? 1 : 1.1;
      u.lang = preferred?.lang || 'en-US';
      if (preferred) u.voice = preferred;
      u.volume = 1;
      // Slight stagger for natural cadence
      setTimeout(() => synth.speak(u), idx * 450);
    });
  }, [num1, num2, correctAnswer, lastAnswerCorrect, lastUserAnswer, enabled, operator, tone]);

  if (!badge) return null;
  return (
    <Box mt="2" style={{ display:'flex', alignItems:'center', gap:8 }}>
      <Badge color={lastAnswerCorrect ? 'green' : 'red'} variant="solid">{badge}</Badge>
      <Text size="1" color="gray">{enabled ? '🔊' : '🔇'}</Text>
    </Box>
  );
}