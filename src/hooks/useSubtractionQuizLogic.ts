import { useState, useEffect } from 'react';

interface Question { minuend: number; subtrahend: number; answer: number }
interface AttemptRecord { q: string; op: 'subtraction'; a: number; b: number; answer: number; userAnswer: number | null; correct: boolean | null; timestamp: number; stage: number }
interface MistakeEntry { question: string; userAnswer: number; correctAnswer: number; minuend: number; subtrahend: number; mistakeType: string[]; timestamp: number }

// Stage 1: single-digit subtraction without borrow (minuend and subtrahend 0-9, minuend>=subtrahend)
// Stage 2: multi-digit subtraction with possible borrowing (up to 3 digits)

export function useSubtractionQuizLogic() {
  const [stage, setStage] = useState<number>(() => {
    if (typeof window === 'undefined') return 1;
    try {
      const raw = localStorage.getItem('sub_stage');
      return raw ? parseInt(raw,10) || 1 : 1;
    } catch { return 1; }
  });
  const [question, setQuestion] = useState<Question>({ minuend: 0, subtrahend: 0, answer: 0 });
  const [digitInputs, setDigitInputs] = useState<string[]>(['','','','','']);
  const [showResult, setShowResult] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);
  const [attemptHistory, setAttemptHistory] = useState<AttemptRecord[]>(()=> {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('sub_attempts');
      const parsed = raw? JSON.parse(raw): [];
      return Array.isArray(parsed)? parsed: [];
    } catch { return []; }
  });
  const [mistakes, setMistakes] = useState<MistakeEntry[]>(()=> {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('sub_mistakes');
      const parsed = raw? JSON.parse(raw): [];
      return Array.isArray(parsed)? parsed: [];
    } catch { return []; }
  });
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  // Borrow detection: returns true if any column requires borrowing
  const requiresBorrow = (minuend: number, subtrahend: number) => {
    const m = minuend.toString().padStart(Math.max(minuend.toString().length, subtrahend.toString().length), '0');
    const s = subtrahend.toString().padStart(m.length, '0');
    for (let i = m.length - 1; i >=0; i--) {
      if (parseInt(m[i]) < parseInt(s[i])) return true;
    }
    return false;
  };

  const generateQuestion = (): Question => {
    if (stage === 1) {
      let a = Math.floor(Math.random()*10);
      let b = Math.floor(Math.random()*10);
      if (b>a) [a,b] = [b,a];
      return { minuend: a, subtrahend: b, answer: a-b };
    }
    // stage 2 multi-digit (ensure non-negative)
    let a = Math.floor(Math.random()*900)+100; // 100-999
    let b = Math.floor(Math.random()*900)+100;
    if (b>a) [a,b] = [b,a];
    // occasionally pick smaller numbers to vary difficulty
    if (Math.random()<0.3) {
      a = Math.floor(Math.random()*100)+10;
      b = Math.floor(Math.random()*100)+10;
      if (b>a) [a,b] = [b,a];
    }
    return { minuend:a, subtrahend:b, answer:a-b };
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(()=> { setQuestion(generateQuestion()); }, [stage]);

  const getAnswerDigitCount = () => question.answer.toString().length;
  const getDigitInputsAsNumber = () => {
    const digitCount = getAnswerDigitCount();
    const relevant = digitInputs.slice(-digitCount);
    const str = relevant.join('');
    return str === ''? 0: parseInt(str);
  };

  const handleDigitChange = (idx: number, value: string) => {
    setDigitInputs(prev => { const next=[...prev]; next[idx]=value; return next; });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = getDigitInputsAsNumber();
    const isCorrect = user === question.answer;
    setLastAnswerCorrect(isCorrect);
    setShowResult(true);
    if (isCorrect) {
      setStreak(s => {
        const next = s+1; if (next>bestStreak) setBestStreak(next); return next; });
    } else if (getAnswerDigitCount() <= 5) {
      setStreak(0);
      const borrowNeeded = requiresBorrow(question.minuend, question.subtrahend);
      const mistakeTypes: string[] = [];
      if (borrowNeeded) mistakeTypes.push('borrowNeededMissed');
      if (question.minuend < 10 && question.subtrahend < 10 && user !== question.answer) mistakeTypes.push('basicFactsError');
      if (question.answer.toString().length !== user.toString().length) mistakeTypes.push('placeValueError');
      if (!mistakeTypes.length) mistakeTypes.push('generalError');
      const entry: MistakeEntry = { question: `${question.minuend}-${question.subtrahend}`, userAnswer: user, correctAnswer: question.answer, minuend: question.minuend, subtrahend: question.subtrahend, mistakeType: mistakeTypes, timestamp: Date.now() };
      setMistakes(prev => [...prev, entry]);
    }
    const attempt: AttemptRecord = { q: `${question.minuend}-${question.subtrahend}`, op:'subtraction', a: question.minuend, b: question.subtrahend, answer: question.answer, userAnswer: getAnswerDigitCount()>5? null: user, correct: getAnswerDigitCount()>5? null: isCorrect, timestamp: Date.now(), stage };
    setAttemptHistory(prev => [...prev, attempt]);
    // unified all_attempts append
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
      // auto-advance stage criteria: 40 correct single-digit with >=90% accuracy
      if (stage===1) {
        const single = attemptHistory.filter(a=> a.stage===1 && a.correct===true);
        const total = attemptHistory.filter(a=> a.stage===1 && typeof a.correct==='boolean');
        const acc = total.length? single.length/total.length:0;
        if (single.length>=30 && acc>=0.9) setStage(2);
      }
      setQuestion(generateQuestion());
    }, 2000);
  };

  useEffect(()=> { if (typeof window !== 'undefined') { localStorage.setItem('sub_attempts', JSON.stringify(attemptHistory)); window.dispatchEvent(new CustomEvent('ls-update',{detail:{key:'sub_attempts'}})); } }, [attemptHistory]);
  useEffect(()=> { if (typeof window !== 'undefined') { localStorage.setItem('sub_mistakes', JSON.stringify(mistakes)); window.dispatchEvent(new CustomEvent('ls-update',{detail:{key:'sub_mistakes'}})); } }, [mistakes]);
  useEffect(()=> { if (typeof window !== 'undefined') { localStorage.setItem('sub_stage', String(stage)); window.dispatchEvent(new CustomEvent('ls-update',{detail:{key:'sub_stage'}})); } }, [stage]);

  const isSubmitDisabled = showResult || digitInputs.slice(-Math.min(getAnswerDigitCount(),5)).some(d=>d==='');
  const accuracy = (()=> {
    const scored = attemptHistory.filter(a=> typeof a.correct==='boolean');
    const correct = scored.filter(a=> a.correct).length;
    return scored.length? Math.round((correct / scored.length)*100):0;
  })();

  return {
    question: { num1: question.minuend, num2: question.subtrahend, answer: question.answer },
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
