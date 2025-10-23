import { useState, useEffect, useRef } from 'react';
import { classifyQuestion } from '@/utils/subskillClassifier';
import { ADDITION_SUBSKILL_TARGETS, selectTargetSubskill, generateRandomAddition, generateTargetedAddition } from '@/utils/commonAdaptive';

interface Question {
  num1: number;
  num2: number;
  answer: number;
  targetSubskill?: string; // adaptive targeting metadata
}

interface Progress {
  [key: string]: number;
}

interface MistakeEntry {
  question: string;
  userAnswer: number;
  correctAnswer: number;
  num1: number;
  num2: number;
  mistakeType: string[];
  timestamp: number;
  subskills?: string[]; // classification of the question
}

interface SubskillProgress {
  [subskillId: string]: {
    correct: number;
    attempts: number;
  };
}

// Subskill targets now sourced from shared adaptive engine
const SUBSKILL_TARGETS = ADDITION_SUBSKILL_TARGETS;


// Random & targeted generation delegated to shared adaptive engine
const generateRandomQuestion = (): Question => generateRandomAddition();
const generateTargetedQuestion = (subskill: string): Question => generateTargetedAddition(subskill);

export function useQuizLogic() {
  // Initialize with a default question to avoid hydration mismatch
  const [question, setQuestion] = useState<Question>({ num1: 0, num2: 0, answer: 0 });
  const [digitInputs, setDigitInputs] = useState<string[]>(['', '', '', '', '', '', '', '', '']); // Support up to 9 digits
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [progress, setProgress] = useState<Progress>({});
  const [mistakes, setMistakes] = useState<MistakeEntry[]>([]);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);
  const [lastUserAnswer, setLastUserAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [adaptiveMode, setAdaptiveMode] = useState<boolean>(false);
  const [subskillProgress, setSubskillProgress] = useState<SubskillProgress>({});
  const [celebration, setCelebration] = useState<string | null>(null);
  const [practiceQueue, setPracticeQueue] = useState<Array<{ num1: number; num2: number }>>([]);
  const lastQueueWriteRef = useRef<string>('');
  // ---- Staged Addition Progression ----
  // Stage 1: Single-digit facts (0-9 + 0-9)
  // Stage 2: Multi-digit & adaptive logic
  const [additionStage, setAdditionStage] = useState<number>(1);
  const SINGLE_DIGIT_MASTERY_TARGET = 40; // raw correct count threshold basis
  const SINGLE_DIGIT_ACCURACY_REQUIRED = 0.9; // 90% accuracy requirement
  const [singleDigitStats, setSingleDigitStats] = useState<{ correct: number; attempts: number }>({ correct: 0, attempts: 0 });

  // Current question subskills (for overlay / chips)
  const currentSubskills = classifyQuestion(question.num1, question.num2);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  // Attempt history (all answered questions, correct or incorrect) for addition
  interface AttemptRecord { q: string; num1: number; num2: number; answer: number; userAnswer: number | null; correct: boolean | null; timestamp: number; stage: number }
  const [attemptHistory, setAttemptHistory] = useState<AttemptRecord[]>([]);

  // Initial one-time load (no dependency on stage yet)
  useEffect(() => {
    const savedProgress = localStorage.getItem('progress');
    if (savedProgress) setProgress(JSON.parse(savedProgress));
    const savedMistakes = localStorage.getItem('mistakes');
    if (savedMistakes) {
      try {
        interface MistakeStorageShape { question?: string; questionKey?: string; userAnswer: number; correctAnswer: number; num1: number; num2: number; timestamp: number; mistakeType?: string[]; subskills?: string[]; }
        const parsed: unknown = JSON.parse(savedMistakes);
        const normalized: MistakeEntry[] = Array.isArray(parsed)
          ? parsed.map((m: MistakeStorageShape) => ({
              question: m.question || m.questionKey || `${m.num1}+${m.num2}`,
              userAnswer: m.userAnswer,
              correctAnswer: m.correctAnswer,
              num1: m.num1,
              num2: m.num2,
              mistakeType: m.mistakeType ?? [],
              timestamp: m.timestamp,
              subskills: m.subskills
            }))
          : [];
        setMistakes(normalized);
      } catch { localStorage.removeItem('mistakes'); }
    }
    const savedAdaptive = localStorage.getItem('adaptiveMode');
    if (savedAdaptive) setAdaptiveMode(savedAdaptive === 'true');
    const savedSubskills = localStorage.getItem('subskillProgress');
    if (savedSubskills) setSubskillProgress(JSON.parse(savedSubskills));
    const savedAttempts = localStorage.getItem('attempts');
    if (savedAttempts) {
      try { const parsed = JSON.parse(savedAttempts); if (Array.isArray(parsed)) setAttemptHistory(parsed); } catch {}
    }
    const savedStage = localStorage.getItem('addition_stage');
    if (savedStage) { const ps = parseInt(savedStage,10); if (ps === 2) setAdditionStage(2); }
    const savedSD = localStorage.getItem('single_digit_stats');
    if (savedSD) { try { const parsed = JSON.parse(savedSD); if (parsed && typeof parsed.correct === 'number') setSingleDigitStats(parsed); } catch {} }
    const savedQueue = localStorage.getItem('practice_queue');
    if (savedQueue) {
      try {
        const parsed = JSON.parse(savedQueue);
        if (Array.isArray(parsed)) setPracticeQueue(parsed.filter(q => typeof q.num1 === 'number' && typeof q.num2 === 'number'));
      } catch {}
    }
    // Listen for external queue mutations (e.g. fact grid enqueue)
    const queueListener = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.key === 'practice_queue') {
        try {
          const raw = localStorage.getItem('practice_queue');
          if (raw && raw !== lastQueueWriteRef.current) {
            // Only update if external change (not our own write)
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              setPracticeQueue(parsed.filter(q => typeof q.num1 === 'number' && typeof q.num2 === 'number'));
            }
          }
        } catch {}
      }
    };
    window.addEventListener('ls-update', queueListener);
    return () => window.removeEventListener('ls-update', queueListener);
  }, []);

  // Generate initial question after stage known
  useEffect(() => {
    // Only set if initial placeholder (0+0) still present
    setQuestion(additionStage === 1 ? generateSingleDigitQuestion() : generateRandomQuestion());
  }, [additionStage]);

  // Reset digit inputs when question changes
  useEffect(() => {
    if (!showResult) {
      setDigitInputs(['', '', '', '', '', '', '', '', '']);
    }
  }, [question, showResult]);

  useEffect(() => {
    localStorage.setItem('progress', JSON.stringify(progress));
    window.dispatchEvent(new CustomEvent('ls-update', { detail: { key: 'progress' } }));
  }, [progress]);

  useEffect(() => {
    localStorage.setItem('mistakes', JSON.stringify(mistakes));
    window.dispatchEvent(new CustomEvent('ls-update', { detail: { key: 'mistakes' } }));
  }, [mistakes]);

  useEffect(() => {
    localStorage.setItem('adaptiveMode', String(adaptiveMode));
    window.dispatchEvent(new CustomEvent('ls-update', { detail: { key: 'adaptiveMode' } }));
  }, [adaptiveMode]);

  useEffect(() => {
    localStorage.setItem('subskillProgress', JSON.stringify(subskillProgress));
    window.dispatchEvent(new CustomEvent('ls-update', { detail: { key: 'subskillProgress' } }));
  }, [subskillProgress]);
  useEffect(() => {
    localStorage.setItem('addition_stage', String(additionStage));
    window.dispatchEvent(new CustomEvent('ls-update', { detail: { key: 'addition_stage' } }));
  }, [additionStage]);
  useEffect(() => {
    localStorage.setItem('single_digit_stats', JSON.stringify(singleDigitStats));
    window.dispatchEvent(new CustomEvent('ls-update', { detail: { key: 'single_digit_stats' } }));
  }, [singleDigitStats]);

  useEffect(() => {
    const savedAudio = localStorage.getItem('audioEnabled');
    if (savedAudio != null) setAudioEnabled(savedAudio === 'true');
  }, []);

  useEffect(() => {
    localStorage.setItem('audioEnabled', String(audioEnabled));
    window.dispatchEvent(new CustomEvent('ls-update', { detail: { key: 'audioEnabled' } }));
  }, [audioEnabled]);
  useEffect(() => {
    localStorage.setItem('attempts', JSON.stringify(attemptHistory));
    window.dispatchEvent(new CustomEvent('ls-update', { detail: { key: 'attempts' } }));
  }, [attemptHistory]);
  useEffect(() => {
    const serialized = JSON.stringify(practiceQueue);
    lastQueueWriteRef.current = serialized;
    localStorage.setItem('practice_queue', serialized);
    window.dispatchEvent(new CustomEvent('ls-update', { detail: { key: 'practice_queue' } }));
  }, [practiceQueue]);

  const getAnswerDigitCount = () => {
    return question.answer.toString().length;
  };

  const getDigitInputsAsNumber = () => {
    const digitCount = getAnswerDigitCount();
    const relevantDigits = digitInputs.slice(-digitCount);
    const numberStr = relevantDigits.join('');
    return numberStr === '' ? 0 : parseInt(numberStr);
  };

  const handleDigitChange = (index: number, value: string) => {
    const newDigits = [...digitInputs];
    newDigits[index] = value;
    setDigitInputs(newDigits);
  };

  const isSubskillMastered = (id: string) => {
    const target = SUBSKILL_TARGETS[id] || 10;
    const stats = subskillProgress[id];
    return stats ? stats.correct >= target : false;
  };

  const selectTargetSubskillLocal = (): string | undefined => selectTargetSubskill(subskillProgress, SUBSKILL_TARGETS);

  // Generate next question honoring stage & adaptive mode
  const nextQuestion = () => {
    if (additionStage === 1) {
      return generateSingleDigitQuestion();
    }
    if (adaptiveMode) {
      const target = selectTargetSubskillLocal();
      if (target) return generateTargetedQuestion(target);
    }
    return generateRandomQuestion();
  };

  const generateSingleDigitQuestion = (): Question => {
    const num1 = Math.floor(Math.random() * 10);
    const num2 = Math.floor(Math.random() * 10);
    return { num1, num2, answer: num1 + num2 };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let isCorrect: boolean;
    
    if (getAnswerDigitCount() > 4) {
      // For answers longer than 4 digits, just show the answer (no input required)
      isCorrect = false; // Consider it a learning opportunity, not a quiz
      setLastAnswerCorrect(null); // Special state for "learning mode"
      setLastUserAnswer(null);
    } else {
      // For 4 digits or less, check the user's input
      const userNumber = getDigitInputsAsNumber();
      isCorrect = userNumber === question.answer;
      setLastAnswerCorrect(isCorrect);
      setLastUserAnswer(userNumber);
    }
    
    setShowResult(true);

    const classification = classifyQuestion(question.num1, question.num2);

  if (isCorrect) {
      setScore(score + 1);
      setStreak(prev => {
        const next = prev + 1;
        setBestStreak(b => {
          const updated = Math.max(b, next);
            if (updated !== b) {
              setCelebration('new-best-streak');
            } else if ([5,10,20,50].includes(next)) {
              setCelebration(`streak-${next}`);
            }
          return updated;
        });
        return next;
      });
      const questionKey = `${question.num1}+${question.num2}`;
      setProgress((prev) => ({
        ...prev,
        [questionKey]: (prev[questionKey] || 0) + 1,
      }));
      // update subskill progress
      setSubskillProgress(prev => {
        const updated = { ...prev };
        classification.forEach(id => {
          if (!updated[id]) updated[id] = { correct: 0, attempts: 0 };
          updated[id] = { correct: updated[id].correct + 1, attempts: updated[id].attempts + 1 };
        });
        return updated;
      });
      // Track single-digit mastery if in stage 1
      if (additionStage === 1 && question.num1 < 10 && question.num2 < 10) {
        setSingleDigitStats(prev => ({ correct: prev.correct + 1, attempts: prev.attempts + 1 }));
      } else if (additionStage === 1) {
        // Defensive: any non single-digit during stage 1 counts as attempt
        setSingleDigitStats(prev => ({ ...prev, attempts: prev.attempts + 1 }));
      }
    } else if (getAnswerDigitCount() <= 4) {
      if (streak !== 0) setStreak(0);
      // Track mistakes for analysis (only for problems students can input)
      const userAnswer = getDigitInputsAsNumber();
      const mistakeEntry: MistakeEntry = {
        question: `${question.num1}+${question.num2}`,
        userAnswer,
        correctAnswer: question.answer,
        num1: question.num1,
        num2: question.num2,
        mistakeType: [], // Will be analyzed in the component
        timestamp: Date.now(),
        subskills: classification
      };
      
  setMistakes(prev => [...prev, mistakeEntry]); // Keep full history in localStorage
      // record attempts even if incorrect
      setSubskillProgress(prev => {
        const updated = { ...prev };
        classification.forEach(id => {
          if (!updated[id]) updated[id] = { correct: 0, attempts: 0 };
          updated[id] = { correct: updated[id].correct, attempts: updated[id].attempts + 1 };
        });
        return updated;
      });
      if (additionStage === 1 && question.num1 < 10 && question.num2 < 10) {
        setSingleDigitStats(prev => ({ ...prev, attempts: prev.attempts + 1 }));
      } else if (additionStage === 1) {
        setSingleDigitStats(prev => ({ ...prev, attempts: prev.attempts + 1 }));
      }
    }

    setAttempts(attempts + 1);
    // Record attempt (correct or incorrect). For long answers >4 digits treated as learning preview (correct=null)
    const record: AttemptRecord = {
      q: `${question.num1}+${question.num2}`,
      num1: question.num1,
      num2: question.num2,
      answer: question.answer,
      userAnswer: getAnswerDigitCount() > 4 ? null : getDigitInputsAsNumber(),
      correct: getAnswerDigitCount() > 4 ? null : isCorrect,
      timestamp: Date.now(),
      stage: additionStage
    };
    setAttemptHistory(prev => [...prev, record]);
    
    // Hide result after 2 seconds and generate new question
    setTimeout(() => {
      setShowResult(false);
      setDigitInputs(['', '', '', '', '', '', '', '', '']); // Reset all 9 digit inputs
      // If practice queue has items, consume first
      if (practiceQueue.length > 0) {
        const [head, ...rest] = practiceQueue;
        setPracticeQueue(rest);
        setQuestion({ num1: head.num1, num2: head.num2, answer: head.num1 + head.num2 });
      } else {
        setQuestion(nextQuestion());
      }
      setLastAnswerCorrect(null);
      // Auto-advance: evaluate after question resolution
      if (additionStage === 1 && singleDigitStats.correct >= SINGLE_DIGIT_MASTERY_TARGET) {
        const acc = singleDigitStats.attempts > 0 ? singleDigitStats.correct / singleDigitStats.attempts : 0;
        if (acc >= SINGLE_DIGIT_ACCURACY_REQUIRED) {
          setAdditionStage(2);
        }
      }
    }, 2000);
  };

  const accuracy = attempts > 0 ? Math.round((score / attempts) * 100) : 0;

  const isSubmitDisabled = showResult || (getAnswerDigitCount() <= 4 && digitInputs.slice(-Math.min(getAnswerDigitCount(), 4)).some(digit => digit === ''));

  const loadSpecificQuestion = (num1: number, num2: number) => {
    setShowResult(false);
    const answer = num1 + num2;
    setQuestion({ num1, num2, answer });
    setDigitInputs(['', '', '', '', '', '', '', '', '']);
    setLastAnswerCorrect(null);
  };

  const clearProgressHistory = () => {
    setProgress({});
    localStorage.removeItem('progress');
  };

  const clearMistakes = () => {
    setMistakes([]);
    localStorage.removeItem('mistakes');
  };

  const enqueuePractice = (num1: number, num2: number) => {
    setPracticeQueue(prev => [...prev, { num1, num2 }]);
  };

  const removePracticeAt = (index: number) => {
    setPracticeQueue(prev => prev.filter((_, i) => i !== index));
  };

  const clearPracticeQueue = () => setPracticeQueue([]);

  const clearCelebration = () => setCelebration(null);

  // Manual stage override controls (educator / debug tools)
  const resetSingleDigitProgress = () => {
    setSingleDigitStats({ correct: 0, attempts: 0 });
    setAdditionStage(1);
  };
  const forceAdvanceToStageTwo = () => setAdditionStage(2);
  const forceReturnToStageOne = () => setAdditionStage(1);

  return {
    question,
    digitInputs,
    score,
    attempts,
    streak,
    bestStreak,
    progress,
    mistakes,
    lastAnswerCorrect,
    showResult,
    accuracy,
    isSubmitDisabled,
    getAnswerDigitCount,
    handleDigitChange,
    handleSubmit,
    adaptiveMode,
    setAdaptiveMode,
    subskillProgress,
  lastUserAnswer,
    currentSubskills,
    celebration,
    clearCelebration,
    practiceQueue,
    enqueuePractice,
    removePracticeAt,
    clearPracticeQueue,
    isSubskillMastered
    ,loadSpecificQuestion
    ,clearProgressHistory
    ,clearMistakes
    ,audioEnabled
    ,setAudioEnabled
    ,additionStage
    ,singleDigitStats
    ,SINGLE_DIGIT_MASTERY_TARGET
    ,SINGLE_DIGIT_ACCURACY_REQUIRED
    ,resetSingleDigitProgress
    ,forceAdvanceToStageTwo
    ,forceReturnToStageOne
  };
}