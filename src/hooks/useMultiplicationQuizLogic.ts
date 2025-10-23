import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { classifyMultiplication } from '@/utils/multSubskillClassifier';
import { MULT_SUBSKILL_TARGETS, selectTargetSubskill, generateTargetedMultiplication, generateRandomMultiplication } from '@/utils/commonAdaptive';

interface Question {
  a: number;
  b: number;
  answer: number;
  targetSubskill?: string;
}

interface Progress { [key: string]: number }
interface MistakeEntry {
  question: string;
  userAnswer: number;
  correctAnswer: number;
  a: number;
  b: number;
  mistakeType: string[];
  timestamp: number;
  subskills?: string[];
}

interface SubskillStats { correct: number; attempts: number }
interface SubskillProgress { [id: string]: SubskillStats }

// Subskill targets centralized in shared adaptive utility
const SUBSKILL_TARGETS = MULT_SUBSKILL_TARGETS;

// Delegate random & targeted generation to shared adaptive engine
const generateRandomQuestion = (): Question => generateRandomMultiplication();
const generateTargetedQuestion = (subskill: string): Question => generateTargetedMultiplication(subskill);

export function useMultiplicationQuizLogic() {
  const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  const [question, setQuestion] = useState<Question>({ a: 0, b: 0, answer: 0 });
  const [inputValue, setInputValue] = useState('');
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [progress, setProgress] = useState<Progress>({});
  const [mistakes, setMistakes] = useState<MistakeEntry[]>([]);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [adaptiveMode, setAdaptiveMode] = useState(false);
  const [subskillProgress, setSubskillProgress] = useState<SubskillProgress>({});
  const [celebration, setCelebration] = useState<string | null>(null);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const [practiceQueue, setPracticeQueue] = useState<Array<{ a: number; b: number }>>([]);
  const lastQueueWriteRef = useRef<string>('');
  // Attempt history for multiplication
  interface MultAttempt { q: string; a: number; b: number; answer: number; userAnswer: number | null; correct: boolean; timestamp: number }
  const [attemptHistory, setAttemptHistory] = useState<MultAttempt[]>([]);
  // ---- Staged Multiplication ----
  // Stage 1: Master tables 2-9 (facts form a*b where anchor table = current focus, other factor 2-9)
  // Stage 2: General & adaptive (existing logic with multi-digit possible)
  const [multStage, setMultStage] = useState<number>(1);
  const TABLES = useMemo(() => [2,3,4,5,6,7,8,9], []);
  const PER_TABLE_TARGET = 12; // raw correct facts needed per table
  const PER_TABLE_ACCURACY_REQUIRED = 0.9; // 90% accuracy across attempts for that table
  interface TableProgress { [table: number]: { correct: number; attempts: number } }
  const [tableProgress, setTableProgress] = useState<TableProgress>({});
  const [currentTableIndex, setCurrentTableIndex] = useState<number>(0); // index into TABLES for active focus

  const activeTable = TABLES[currentTableIndex];

  const currentSubskills = classifyMultiplication(question.a, question.b);

  // One-time load of persisted values (TABLES constant remains stable)
  useEffect(() => {
    // load from localStorage (namespaced keys to avoid collision)
    const p = localStorage.getItem('mult_progress'); if (p) setProgress(JSON.parse(p));
    const m = localStorage.getItem('mult_mistakes'); if (m) {
      try {
        interface StoredMistake { question?: string; questionKey?: string; userAnswer: number; correctAnswer: number; a: number; b: number; mistakeType?: string[]; timestamp: number; subskills?: string[] }
        const parsed: unknown = JSON.parse(m);
        const normalized: MistakeEntry[] = Array.isArray(parsed) ? parsed.map((x: StoredMistake) => ({
          question: x.question || x.questionKey || `${x.a}x${x.b}`,
          userAnswer: x.userAnswer,
          correctAnswer: x.correctAnswer,
          a: x.a,
          b: x.b,
          mistakeType: x.mistakeType ?? [],
          timestamp: x.timestamp,
          subskills: x.subskills
        })) : [];
        setMistakes(normalized);
      } catch {}
    }
    const s = localStorage.getItem('mult_subskills'); if (s) setSubskillProgress(JSON.parse(s));
    const adapt = localStorage.getItem('mult_adaptive'); if (adapt) setAdaptiveMode(adapt === 'true');
    const aud = localStorage.getItem('mult_audio'); if (aud) setAudioEnabled(aud === 'true');
    const at = localStorage.getItem('mult_attempts'); if (at) { try { const parsed = JSON.parse(at); if (Array.isArray(parsed)) setAttemptHistory(parsed); } catch {} }
    const stageStored = localStorage.getItem('mult_stage'); if (stageStored) { const s = parseInt(stageStored,10); if (s===2) setMultStage(2); }
    const tableProgStored = localStorage.getItem('mult_tables_progress');
    if (tableProgStored) { try { const parsed = JSON.parse(tableProgStored); if (parsed && typeof parsed === 'object') setTableProgress(parsed); } catch {} }
    const tableIndexStored = localStorage.getItem('mult_table_index'); if (tableIndexStored) { const idx = parseInt(tableIndexStored,10); if (!isNaN(idx) && idx >=0 && idx < TABLES.length) setCurrentTableIndex(idx); }
    const queue = localStorage.getItem('mult_practice_queue');
    if (queue) {
      try { const parsed = JSON.parse(queue); if (Array.isArray(parsed)) setPracticeQueue(parsed.filter(q => typeof q.a === 'number' && typeof q.b === 'number')); } catch {}
    }
    const queueListener = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.key === 'mult_practice_queue') {
        try {
          const raw = localStorage.getItem('mult_practice_queue');
          if (raw && raw !== lastQueueWriteRef.current) {
            // Only update if external change (not our own write)
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) setPracticeQueue(parsed.filter(q => typeof q.a === 'number' && typeof q.b === 'number'));
          }
        } catch {}
      }
    };
    window.addEventListener('ls-update', queueListener);
    return () => window.removeEventListener('ls-update', queueListener);
  }, [TABLES.length]);

  const generateStageOneQuestion = useCallback((table: number): Question => {
    const b = rand(2,9);
    const a = table;
    return Math.random() < 0.5 ? { a, b, answer: a*b } : { a: b, b: a, answer: a*b };
  }, []);

  // Set initial / stage-changed question once state loaded
  useEffect(() => {
    setQuestion(multStage === 1 ? generateStageOneQuestion(TABLES[currentTableIndex]) : generateRandomQuestion());
  }, [multStage, currentTableIndex, TABLES, generateStageOneQuestion]);

  useEffect(() => { localStorage.setItem('mult_progress', JSON.stringify(progress)); window.dispatchEvent(new CustomEvent('ls-update', { detail: { key: 'mult_progress' } })); }, [progress]);
  useEffect(() => { localStorage.setItem('mult_mistakes', JSON.stringify(mistakes)); window.dispatchEvent(new CustomEvent('ls-update', { detail: { key: 'mult_mistakes' } })); }, [mistakes]);
  useEffect(() => { localStorage.setItem('mult_subskills', JSON.stringify(subskillProgress)); window.dispatchEvent(new CustomEvent('ls-update', { detail: { key: 'mult_subskills' } })); }, [subskillProgress]);
  useEffect(() => { localStorage.setItem('mult_adaptive', String(adaptiveMode)); window.dispatchEvent(new CustomEvent('ls-update', { detail: { key: 'mult_adaptive' } })); }, [adaptiveMode]);
  useEffect(() => { localStorage.setItem('mult_audio', String(audioEnabled)); window.dispatchEvent(new CustomEvent('ls-update', { detail: { key: 'mult_audio' } })); }, [audioEnabled]);
  useEffect(() => { localStorage.setItem('mult_attempts', JSON.stringify(attemptHistory)); window.dispatchEvent(new CustomEvent('ls-update', { detail: { key: 'mult_attempts' } })); }, [attemptHistory]);
  useEffect(() => { localStorage.setItem('mult_stage', String(multStage)); window.dispatchEvent(new CustomEvent('ls-update', { detail: { key: 'mult_stage' } })); }, [multStage]);
  useEffect(() => { localStorage.setItem('mult_tables_progress', JSON.stringify(tableProgress)); window.dispatchEvent(new CustomEvent('ls-update', { detail: { key: 'mult_tables_progress' } })); }, [tableProgress]);
  useEffect(() => { localStorage.setItem('mult_table_index', String(currentTableIndex)); window.dispatchEvent(new CustomEvent('ls-update', { detail: { key: 'mult_table_index' } })); }, [currentTableIndex]);
  useEffect(() => { 
    const serialized = JSON.stringify(practiceQueue); 
    lastQueueWriteRef.current = serialized; 
    localStorage.setItem('mult_practice_queue', serialized); 
    window.dispatchEvent(new CustomEvent('ls-update', { detail: { key: 'mult_practice_queue' } })); 
  }, [practiceQueue]);

  const selectTargetSubskillLocal = (): string | undefined => selectTargetSubskill(subskillProgress, SUBSKILL_TARGETS);

  // (moved earlier)

  const nextQuestion = () => {
    if (multStage === 1) {
      return generateStageOneQuestion(TABLES[currentTableIndex]);
    }
    if (adaptiveMode) {
      const target = selectTargetSubskillLocal();
      if (target) return generateTargetedQuestion(target);
    }
    return generateRandomQuestion();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const userAnswer = inputValue === '' ? NaN : parseInt(inputValue, 10);
    const isCorrect = userAnswer === question.answer;
    setLastAnswerCorrect(isCorrect);
    setShowResult(true);
    const classification = classifyMultiplication(question.a, question.b);

  if (isCorrect) {
      setScore(s => s + 1);
      setStreak(prev => {
        const next = prev + 1;
        setBestStreak(b => {
          const updated = Math.max(b, next);
          if (updated !== b) setCelebration('new-best-streak');
          else if ([5,10,20,50].includes(next)) setCelebration(`streak-${next}`);
          return updated;
        });
        return next;
      });
      const key = `${question.a}x${question.b}`;
      setProgress(prev => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
      setSubskillProgress(prev => {
        const updated = { ...prev };
        classification.forEach(id => {
          if (!updated[id]) updated[id] = { correct:0, attempts:0 };
          updated[id] = { correct: updated[id].correct + 1, attempts: updated[id].attempts + 1 };
        });
        return updated;
      });
      // Stage 1 table progress tracking
      if (multStage === 1 && TABLES.includes(question.a) || (multStage ===1 && TABLES.includes(question.b))) {
        const table = TABLES.includes(question.a) ? question.a : question.b;
        setTableProgress(prev => {
          const copy = { ...prev };
          if (!copy[table]) copy[table] = { correct:0, attempts:0 };
          copy[table] = { correct: copy[table].correct + 1, attempts: copy[table].attempts + 1 };
          return copy;
        });
      }
    } else {
      if (streak !== 0) setStreak(0);
      const mistake: MistakeEntry = {
        question: `${question.a}x${question.b}`,
        userAnswer: isNaN(userAnswer) ? -1 : userAnswer,
        correctAnswer: question.answer,
        a: question.a,
        b: question.b,
        mistakeType: [],
        timestamp: Date.now(),
        subskills: classification
      };
      setMistakes(prev => [...prev, mistake]);
      setSubskillProgress(prev => {
        const updated = { ...prev };
        classification.forEach(id => {
          if (!updated[id]) updated[id] = { correct:0, attempts:0 };
          updated[id] = { correct: updated[id].correct, attempts: updated[id].attempts + 1 };
        });
        return updated;
      });
      if (multStage === 1 && TABLES.includes(question.a) || (multStage ===1 && TABLES.includes(question.b))) {
        const table = TABLES.includes(question.a) ? question.a : question.b;
        setTableProgress(prev => {
          const copy = { ...prev };
          if (!copy[table]) copy[table] = { correct:0, attempts:0 };
          copy[table] = { correct: copy[table].correct, attempts: copy[table].attempts + 1 };
          return copy;
        });
      }
    }
    setAttempts(a => a + 1);
    // Record attempt
    const attempt: MultAttempt = {
      q: `${question.a}x${question.b}`,
      a: question.a,
      b: question.b,
      answer: question.answer,
      userAnswer: inputValue === '' ? null : (isNaN(parseInt(inputValue,10)) ? null : parseInt(inputValue,10)),
      correct: isCorrect,
      timestamp: Date.now()
    };
    setAttemptHistory(prev => [...prev, attempt]);
    setTimeout(() => {
      setShowResult(false);
      setInputValue('');
      if (practiceQueue.length > 0) {
        const [head, ...rest] = practiceQueue;
        setPracticeQueue(rest);
        setQuestion({ a: head.a, b: head.b, answer: head.a * head.b });
      } else {
        setQuestion(nextQuestion());
      }
      setLastAnswerCorrect(null);
      // Auto advance table index / stage
      if (multStage === 1) {
        // Check if current table mastered
        const prog = tableProgress[TABLES[currentTableIndex]];
        if (prog && prog.correct >= PER_TABLE_TARGET) {
          const acc = prog.attempts > 0 ? prog.correct / prog.attempts : 0;
          if (acc >= PER_TABLE_ACCURACY_REQUIRED) {
          // advance to next table or stage 2
          if (currentTableIndex < TABLES.length - 1) {
            setCurrentTableIndex(i => i + 1);
          } else {
            setMultStage(2); // all tables mastered
          }
          }
        }
      }
    }, 1500);
  };

  const loadSpecificQuestion = (a: number, b: number) => {
    setShowResult(false);
    setQuestion({ a, b, answer: a * b });
    setInputValue('');
    setLastAnswerCorrect(null);
  };
  const clearProgressHistory = () => { setProgress({}); localStorage.removeItem('mult_progress'); };
  const clearMistakes = () => { setMistakes([]); localStorage.removeItem('mult_mistakes'); };
  const enqueuePractice = (a: number, b: number) => setPracticeQueue(prev => [...prev, { a, b }]);
  const removePracticeAt = (i: number) => setPracticeQueue(prev => prev.filter((_, idx) => idx !== i));
  const clearPracticeQueue = () => setPracticeQueue([]);
  const clearCelebration = () => setCelebration(null);

  // Manual stage & table override helpers
  const resetTablesProgress = () => {
    setTableProgress({});
    setCurrentTableIndex(0);
    setMultStage(1);
  };
  const forceAdvanceToStageTwo = () => setMultStage(2);
  const forceReturnToStageOne = () => setMultStage(1);
  const jumpToTable = (table: number) => {
    const idx = TABLES.indexOf(table);
    if (idx !== -1) {
      setCurrentTableIndex(idx);
      setMultStage(1);
    }
  };

  const accuracy = attempts > 0 ? Math.round((score / attempts) * 100) : 0;
  const isSubmitDisabled = showResult || inputValue.trim() === '';
  const isSubskillMastered = (id: string) => {
    const t = SUBSKILL_TARGETS[id] || 10;
    const stats = subskillProgress[id];
    return stats ? stats.correct >= t : false;
  };

  return {
    question,
    inputValue,
    setInputValue,
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
    handleSubmit,
    adaptiveMode,
    setAdaptiveMode,
    subskillProgress,
    currentSubskills,
    celebration,
    clearCelebration,
    practiceQueue,
    enqueuePractice,
    removePracticeAt,
    clearPracticeQueue,
    isSubskillMastered,
    loadSpecificQuestion,
    clearProgressHistory,
    clearMistakes,
    audioEnabled,
    setAudioEnabled
    ,multStage
    ,tableProgress
    ,PER_TABLE_TARGET
    ,PER_TABLE_ACCURACY_REQUIRED
    ,activeTable
    ,currentTableIndex
    ,resetTablesProgress
    ,forceAdvanceToStageTwo
    ,forceReturnToStageOne
    ,jumpToTable
  };
}
