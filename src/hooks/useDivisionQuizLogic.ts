import { useState, useEffect } from 'react';

interface Question { dividend: number; divisor: number; answer: number }
interface AttemptRecord { q: string; op: 'division'; a: number; b: number; answer: number; userAnswer: number | null; correct: boolean | null; timestamp: number; stage: number }
interface MistakeEntry { question: string; userAnswer: number; correctAnswer: number; dividend: number; divisor: number; mistakeType: string[]; timestamp: number }

// Stage 1: Single-digit divisor (2-9) with perfect division dividend <= 81.
// Stage 2: Larger dividends (up to 999) still ensure perfect division for now.

export function useDivisionQuizLogic() {
  const [stage, setStage] = useState<number>(() => {
    if (typeof window === 'undefined') return 1;
    try {
      const raw = localStorage.getItem('div_stage');
      return raw ? parseInt(raw,10) || 1 : 1;
    } catch { return 1; }
  });
  const [question, setQuestion] = useState<Question>({ dividend: 0, divisor: 1, answer: 0 });
  const [digitInputs, setDigitInputs] = useState<string[]>(['','','','','']);
  const [showResult, setShowResult] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);
  const [attemptHistory, setAttemptHistory] = useState<AttemptRecord[]>(()=>{
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('div_attempts');
      const parsed = raw? JSON.parse(raw): [];
      return Array.isArray(parsed)? parsed: [];
    } catch { return []; }
  });
  const [mistakes, setMistakes] = useState<MistakeEntry[]>(()=>{
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('div_mistakes');
      const parsed = raw? JSON.parse(raw): [];
      return Array.isArray(parsed)? parsed: [];
    } catch { return []; }
  });
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  const generateQuestion = (): Question => {
    if (stage === 1) {
      const divisor = Math.floor(Math.random()*8)+2; // 2-9
      const quotient = Math.floor(Math.random()*8)+2; // 2-9
      const dividend = divisor * quotient;
      return { dividend, divisor, answer: quotient };
    }
    // stage 2: larger perfect division
    const divisor = Math.floor(Math.random()*9)+2; // 2-10
    const quotient = Math.floor(Math.random()*90)+10; // 10-99
    const dividend = divisor * quotient;
    return { dividend, divisor, answer: quotient };
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(()=> { setQuestion(generateQuestion()); }, [stage]);

  const getAnswerDigitCount = () => question.answer.toString().length;
  const getDigitInputsAsNumber = () => {
    const count = getAnswerDigitCount();
    const relevant = digitInputs.slice(-count);
    const str = relevant.join('');
    return str === ''? 0: parseInt(str);
  };
  const handleDigitChange = (idx: number, value: string) => setDigitInputs(prev => { const n=[...prev]; n[idx]=value; return n; });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = getDigitInputsAsNumber();
    const isCorrect = user === question.answer;
    setLastAnswerCorrect(isCorrect);
    setShowResult(true);
    if (isCorrect) {
      setStreak(s=> { const next=s+1; if (next>bestStreak) setBestStreak(next); return next; });
    } else if (getAnswerDigitCount() <= 5) {
      setStreak(0);
      const mistakeTypes: string[] = [];
      if (question.divisor <= 10 && user !== question.answer) mistakeTypes.push('factsRecallError');
      if (question.answer.toString().length !== user.toString().length) mistakeTypes.push('placeValueError');
      if (!mistakeTypes.length) mistakeTypes.push('generalComputation');
      const entry: MistakeEntry = { question: `${question.dividend}÷${question.divisor}`, userAnswer: user, correctAnswer: question.answer, dividend: question.dividend, divisor: question.divisor, mistakeType: mistakeTypes, timestamp: Date.now() };
      setMistakes(prev => [...prev, entry]);
    }
    const attempt: AttemptRecord = { q: `${question.dividend}÷${question.divisor}`, op:'division', a: question.dividend, b: question.divisor, answer: question.answer, userAnswer: getAnswerDigitCount()>5? null: user, correct: getAnswerDigitCount()>5? null: isCorrect, timestamp: Date.now(), stage };
    setAttemptHistory(prev => [...prev, attempt]);
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('all_attempts');
        const list = raw? JSON.parse(raw): [];
        list.push({ ...attempt });
        localStorage.setItem('all_attempts', JSON.stringify(list));
        window.dispatchEvent(new CustomEvent('ls-update',{detail:{key:'all_attempts'}}));
      } catch {}
    }

    setTimeout(()=> {
      setShowResult(false);
      setDigitInputs(['','','','','']);
      if (stage===1) {
        const correctSingles = attemptHistory.filter(a=> a.stage===1 && a.correct).length;
        const totalSingles = attemptHistory.filter(a=> a.stage===1 && typeof a.correct==='boolean').length;
        const acc = totalSingles? correctSingles/totalSingles:0;
        if (correctSingles>=30 && acc>=0.9) setStage(2);
      }
      setQuestion(generateQuestion());
    }, 2000);
  };

  useEffect(()=> { if (typeof window !== 'undefined') { localStorage.setItem('div_attempts', JSON.stringify(attemptHistory)); window.dispatchEvent(new CustomEvent('ls-update',{detail:{key:'div_attempts'}})); } }, [attemptHistory]);
  useEffect(()=> { if (typeof window !== 'undefined') { localStorage.setItem('div_mistakes', JSON.stringify(mistakes)); window.dispatchEvent(new CustomEvent('ls-update',{detail:{key:'div_mistakes'}})); } }, [mistakes]);
  useEffect(()=> { if (typeof window !== 'undefined') { localStorage.setItem('div_stage', String(stage)); window.dispatchEvent(new CustomEvent('ls-update',{detail:{key:'div_stage'}})); } }, [stage]);

  const isSubmitDisabled = showResult || digitInputs.slice(-Math.min(getAnswerDigitCount(),5)).some(d=>d==='');
  const accuracy = (()=> { const scored = attemptHistory.filter(a=> typeof a.correct==='boolean'); const correct = scored.filter(a=> a.correct).length; return scored.length? Math.round((correct/scored.length)*100):0; })();

  return {
    question: { num1: question.dividend, num2: question.divisor, answer: question.answer },
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
  };
}
