import { useEffect, useState } from 'react';
import { QuizFacade } from '../application/QuizFacade';
import { Question, ProgressMap, Mistake, SubskillProgressMap, StreakState, SettingsState } from '../domain/models';

// New hook built on DDD facade. Existing useQuizLogic remains for transitional compatibility.
export function useQuizApp() {
  const facadeRef = useState(() => new QuizFacade())[0];
  const [question, setQuestion] = useState<Question | null>(null);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [subskillProgress, setSubskillProgress] = useState<SubskillProgressMap>({});
  const [streak, setStreak] = useState<StreakState>({ streak:0, bestStreak:0 });
  const [settings, setSettings] = useState<SettingsState>({ audioEnabled:true });
  const [adaptiveMode, setAdaptiveMode] = useState(false);
  const [celebration, setCelebration] = useState<string | null>(null);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);

  useEffect(() => {
    const init = facadeRef.loadInitialState();
    setQuestion(init.question);
    setProgress(init.progress);
    setMistakes(init.mistakes);
    setSubskillProgress(init.subskills);
    setStreak(init.streak);
    setSettings(init.settings);
  }, [facadeRef]);

  const submit = (userAnswer?: number) => {
    if(!question) return;
    const result = facadeRef.submitAnswer({
      question,
      userAnswer,
      answerDigitLimit: 4,
      subskillProgress,
      progress,
      streak
    });
    setProgress(result.updatedProgress);
    if(result.updatedMistakes.length) setMistakes(m => [...m, ...result.updatedMistakes]);
    setSubskillProgress(result.updatedSubskills);
    setStreak(result.updatedStreak);
    setCelebration(result.celebrationTag);
    setLastAnswerCorrect(result.isCorrect);
    // generate next after delay similar to existing UX
    setTimeout(() => {
      setLastAnswerCorrect(null);
      setQuestion(facadeRef.generateNext(adaptiveMode, result.updatedSubskills));
    }, 2000);
  };

  const reattempt = (n1: number, n2: number) => {
    setQuestion(facadeRef.loadSpecific(n1,n2));
    setLastAnswerCorrect(null);
  };

  const clearProgress = () => { facadeRef.clearProgress(); setProgress({}); };
  const clearMistakes = () => { facadeRef.clearMistakes(); setMistakes([]); };
  const clearAll = () => { facadeRef.clearAll(); setProgress({}); setMistakes([]); };

  const setAudioEnabled = (val: boolean) => { const next = { ...settings, audioEnabled: val }; setSettings(next); facadeRef.saveSettings(next); };

  return {
    question,
    progress,
    mistakes,
    subskillProgress,
    streak,
    settings,
    adaptiveMode,
    setAdaptiveMode,
    celebration,
    lastAnswerCorrect,
    submit,
    reattempt,
    clearProgress,
    clearMistakes,
    clearAll,
    setAudioEnabled
  };
}
