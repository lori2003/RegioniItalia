import {
  ArrowLeft,
  Award,
  Brain,
  CheckCircle2,
  Clock3,
  Cloud,
  Compass,
  Crown,
  Eye,
  Flame,
  Gauge,
  LayoutDashboard,
  Lightbulb,
  LockKeyhole,
  Map,
  MapPin,
  Menu,
  Moon,
  RefreshCw,
  RotateCcw,
  Route,
  Sparkles,
  Sun,
  Swords,
  Target,
  ThumbsDown,
  ThumbsUp,
  Trophy,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import './App.css';
import { Celebration } from './components/Celebration';
import type { CelebrationEvent } from './components/Celebration';
import { ItalyMap } from './components/ItalyMap';
import { provinceTypeLabels, REGIONS } from './data/regions';
import {
  addToReviewBox,
  applyMissionResult,
  BADGES,
  buildReviewSession,
  cardKey,
  createChallenge,
  createDefaultProgress,
  DIFFICULTIES,
  effectiveDifficulty,
  GAME_MODES,
  getLevelInfo,
  getMasteryMap,
  getRegion,
  getRegionMastery,
  isAnswerCorrect,
  normalizeAnswer,
  parseCardKey,
  PLAYER_NAME,
} from './lib/game';
import { loadProgress, refreshCloudProgress, saveProgress } from './lib/progressStore';
import { useTheme } from './lib/theme';
import type {
  Challenge,
  DifficultyId,
  GameModeId,
  GameProgress,
  MasteryLevel,
  RegionData,
  SessionKind,
  SyncStatus,
} from './types';

type View = 'home' | 'game' | 'summary';
type Section = 'cruscotto' | 'ripasso' | 'errori' | 'allenamento';
type AnswerStyle = 'click' | 'mente';
type SessionStats = { answered: number; correct: number; wrong: number; newCards: number };

const MASTERY_META: Record<MasteryLevel, { label: string; varName: string }> = {
  new: { label: 'Da scoprire', varName: '--m-new' },
  learning: { label: 'In apprendimento', varName: '--m-learning' },
  young: { label: 'Giovane', varName: '--m-young' },
  mature: { label: 'Matura', varName: '--m-mature' },
  mastered: { label: 'Padroneggiata', varName: '--m-mastered' },
};
const MASTERY_ORDER: MasteryLevel[] = ['new', 'learning', 'young', 'mature', 'mastered'];
const STREAK_MILESTONES = new Set([3, 5, 10, 15, 20, 30, 50]);

const SECTIONS: { id: Section; label: string; icon: ReactNode }[] = [
  { id: 'cruscotto', label: 'Cruscotto', icon: <LayoutDashboard size={19} /> },
  { id: 'ripasso', label: 'Ripasso', icon: <Sparkles size={19} /> },
  { id: 'errori', label: 'Box errori', icon: <XCircle size={19} /> },
  { id: 'allenamento', label: 'Allenamento', icon: <Swords size={19} /> },
];

function ThemeToggle({ theme, onToggle }: { theme: 'light' | 'dark'; onToggle: () => void }) {
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      role="switch"
      aria-checked={dark}
      aria-label={dark ? 'Passa al tema chiaro' : 'Passa al tema scuro'}
      title={dark ? 'Tema scuro attivo' : 'Tema chiaro attivo'}
    >
      <span className="theme-toggle__icon" aria-hidden="true">
        <Sun size={16} />
      </span>
      <span className="theme-toggle__icon" aria-hidden="true">
        <Moon size={16} />
      </span>
      <span className={`theme-toggle__thumb ${dark ? 'is-dark' : ''}`} aria-hidden="true" />
    </button>
  );
}

function App() {
  const { theme, toggleTheme } = useTheme();

  const [loginName, setLoginName] = useState(() => localStorage.getItem('italia-quest-login') ?? '');
  const [loginError, setLoginError] = useState('');
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);
  const [progress, setProgress] = useState<GameProgress | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ kind: 'idle', label: 'Pronto' });

  const [view, setView] = useState<View>('home');
  const [section, setSection] = useState<Section>('cruscotto');
  const [navOpen, setNavOpen] = useState(false);
  const [sessionKind, setSessionKind] = useState<SessionKind>('ripasso');
  const [sessionQueue, setSessionQueue] = useState<string[]>([]);
  const [sessionIndex, setSessionIndex] = useState(0);
  const [sessionStats, setSessionStats] = useState<SessionStats>({ answered: 0, correct: 0, wrong: 0, newCards: 0 });
  const [sessionWrongKeys, setSessionWrongKeys] = useState<string[]>([]);
  const [answerStyle, setAnswerStyle] = useState<AnswerStyle>('click');
  const [selfTestRevealed, setSelfTestRevealed] = useState(false);

  const [mode, setMode] = useState<GameModeId>('mappa');
  const [freeDifficulty, setFreeDifficulty] = useState<DifficultyId>('facile');
  const [activeDifficulty, setActiveDifficulty] = useState<DifficultyId>('facile');
  const [challenge, setChallenge] = useState<Challenge>(() => createChallenge('mappa', 'facile'));
  const [typedAnswer, setTypedAnswer] = useState('');
  const [feedback, setFeedback] = useState<{ correct: boolean; text: string } | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | undefined>();
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [celebration, setCelebration] = useState<CelebrationEvent | null>(null);
  const celebrationSeq = useRef(0);

  const levelInfo = useMemo(() => (progress ? getLevelInfo(progress) : null), [progress]);
  const masteryMap = useMemo(() => (progress ? getMasteryMap(progress) : {}), [progress]);
  const review = useMemo(() => (progress ? buildReviewSession(progress) : null), [progress]);
  const masteryCounts = useMemo(() => {
    const counts: Record<MasteryLevel, number> = { new: 0, learning: 0, young: 0, mature: 0, mastered: 0 };
    Object.values(masteryMap).forEach((level) => {
      counts[level] += 1;
    });
    return counts;
  }, [masteryMap]);

  const activeRegion = useMemo(
    () => getRegion(selectedRegion ?? challenge.targetRegion) ?? REGIONS[0],
    [challenge.targetRegion, selectedRegion],
  );
  const difficultySettings = DIFFICULTIES[activeDifficulty];
  const requiresFreeText = !challenge.expectsMapClick && challenge.options.length === 0;
  const isSelfTest = sessionKind !== 'libero' && answerStyle === 'mente';
  const isSelfTestMappa = isSelfTest && challenge.mode === 'mappa';
  const targetMapRegion = feedback || (isSelfTestMappa && selfTestRevealed) ? challenge.targetRegion : undefined;

  const persist = useCallback(async (nextProgress: GameProgress) => {
    setProgress(nextProgress);
    setSyncStatus({ kind: 'syncing', label: 'Salvo' });
    const status = await saveProgress(nextProgress);
    setSyncStatus(status);
  }, []);

  const loadCardChallenge = useCallback((key: string, fromProgress: GameProgress) => {
    const { mode: cardMode, regionName } = parseCardKey(key);
    const diff = effectiveDifficulty(fromProgress, cardMode, regionName);
    setMode(cardMode);
    setActiveDifficulty(diff);
    setChallenge(createChallenge(cardMode, diff, fromProgress, regionName));
    setSecondsLeft(DIFFICULTIES[diff].timeLimit);
    setFeedback(null);
    setTypedAnswer('');
    setSelectedRegion(undefined);
    setSelfTestRevealed(false);
  }, []);

  const startReview = useCallback(() => {
    if (!progress || !review || review.queue.length === 0) return;
    setSessionKind('ripasso');
    setSessionQueue(review.queue);
    setSessionIndex(0);
    setSessionStats({ answered: 0, correct: 0, wrong: 0, newCards: 0 });
    setSessionWrongKeys([]);
    setAnswerStyle('click');
    setCelebration(null);
    loadCardChallenge(review.queue[0], progress);
    setView('game');
  }, [loadCardChallenge, progress, review]);

  const startErrorSession = useCallback(
    (keys: string[], fromProgress: GameProgress) => {
      if (keys.length === 0) return;
      setSessionKind('errori');
      setSessionQueue(keys);
      setSessionIndex(0);
      setSessionStats({ answered: 0, correct: 0, wrong: 0, newCards: 0 });
      setSessionWrongKeys([]);
      setAnswerStyle('click');
      setCelebration(null);
      loadCardChallenge(keys[0], fromProgress);
      setView('game');
    },
    [loadCardChallenge],
  );

  const startFree = useCallback(
    (nextMode: GameModeId, nextDifficulty: DifficultyId) => {
      if (!progress) return;
      setSessionKind('libero');
      setSessionQueue([]);
      setMode(nextMode);
      setFreeDifficulty(nextDifficulty);
      setActiveDifficulty(nextDifficulty);
      setChallenge(createChallenge(nextMode, nextDifficulty, progress));
      setSecondsLeft(DIFFICULTIES[nextDifficulty].timeLimit);
      setFeedback(null);
      setTypedAnswer('');
      setSelectedRegion(undefined);
      setSessionWrongKeys([]);
      setAnswerStyle('click');
      setSelfTestRevealed(false);
      setCelebration(null);
      setView('game');
    },
    [progress],
  );

  const completeMission = useCallback(
    (answer: string, forcedCorrect?: boolean, customMessage?: string) => {
      if (!progress || feedback) return;
      const correct = forcedCorrect ?? isAnswerCorrect(answer, challenge);
      const key = cardKey(challenge.mode, challenge.targetRegion);
      const wasNew = !progress.memory?.[key];
      const nextProgress = applyMissionResult(progress, challenge, activeDifficulty, correct, sessionKind);

      if (correct) {
        const region = getRegion(challenge.targetRegion);
        const shortName = region?.shortName ?? challenge.targetRegion;
        const newlyUnlocked =
          !progress.unlockedRegions.includes(challenge.targetRegion) &&
          nextProgress.unlockedRegions.includes(challenge.targetRegion);
        const newlyMastered =
          getRegionMastery(nextProgress, challenge.targetRegion) === 'mastered' &&
          getRegionMastery(progress, challenge.targetRegion) !== 'mastered';
        const streak = nextProgress.streak;
        celebrationSeq.current += 1;
        setCelebration({
          id: celebrationSeq.current,
          points: DIFFICULTIES[activeDifficulty].points,
          streak,
          captured: newlyUnlocked ? shortName : undefined,
          mastered: newlyMastered ? shortName : undefined,
          milestone: STREAK_MILESTONES.has(streak) ? streak : undefined,
        });
      }

      const base = customMessage
        ? `${customMessage} La risposta era ${challenge.correctDisplay}.`
        : correct
          ? `Esatto: ${challenge.correctDisplay}.`
          : `Non ancora. La risposta era ${challenge.correctDisplay}.`;

      setFeedback({ correct, text: base });
      setSessionStats((stats) => ({
        answered: stats.answered + 1,
        correct: stats.correct + (correct ? 1 : 0),
        wrong: stats.wrong + (correct ? 0 : 1),
        newCards: stats.newCards + (wasNew && sessionKind === 'ripasso' ? 1 : 0),
      }));
      if (!correct) setSessionWrongKeys((keys) => (keys.includes(key) ? keys : [...keys, key]));
      void persist(nextProgress);
    },
    [activeDifficulty, challenge, feedback, persist, progress, sessionKind],
  );

  const advance = useCallback(() => {
    if (!progress) return;

    if (sessionKind === 'libero') {
      setActiveDifficulty(freeDifficulty);
      setChallenge(createChallenge(mode, freeDifficulty, progress));
      setSecondsLeft(DIFFICULTIES[freeDifficulty].timeLimit);
      setFeedback(null);
      setTypedAnswer('');
      setSelectedRegion(undefined);
      return;
    }

    const nextIndex = sessionIndex + 1;
    if (nextIndex >= sessionQueue.length) {
      setCelebration(null);
      setView('summary');
      return;
    }
    setSessionIndex(nextIndex);
    loadCardChallenge(sessionQueue[nextIndex], progress);
  }, [freeDifficulty, loadCardChallenge, mode, progress, sessionIndex, sessionKind, sessionQueue]);

  useEffect(() => {
    if (view !== 'game' || !feedback) return;
    const delay = feedback.correct ? 1300 : 2600;
    const timer = window.setTimeout(advance, delay);
    return () => window.clearTimeout(timer);
  }, [advance, feedback, view]);

  useEffect(() => {
    if (view !== 'game' || !progress || feedback || secondsLeft === null || secondsLeft <= 0) return;

    const timer = window.setTimeout(() => {
      setSecondsLeft((value) => {
        if (value === null || value <= 0) return value;
        if (value === 1) {
          window.setTimeout(() => completeMission('', false, 'Tempo scaduto.'), 0);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [completeMission, feedback, progress, secondsLeft, view]);

  useEffect(() => {
    if (!progress) return;

    const onFocus = () => {
      refreshCloudProgress(progress).then((result) => {
        setProgress(result.progress);
        setSyncStatus(result.status);
      });
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') onFocus();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [progress]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizeAnswer(loginName);
    if (normalized !== normalizeAnswer(PLAYER_NAME)) {
      setLoginError('Accesso riservato: inserisci Lorenzo.');
      return;
    }

    setLoginError('');
    setIsLoadingProgress(true);
    setSyncStatus({ kind: 'syncing', label: 'Sincronizzo' });
    const result = await loadProgress();
    localStorage.setItem('italia-quest-login', PLAYER_NAME);
    setProgress(result.progress);
    setView('home');
    setSection('cruscotto');
    setSyncStatus(result.status);
    setIsLoadingProgress(false);
  }

  function submitTypedAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!typedAnswer.trim()) return;
    completeMission(typedAnswer);
  }

  function changeFreeMode(nextMode: GameModeId) {
    if (!progress) return;
    setMode(nextMode);
    setActiveDifficulty(freeDifficulty);
    setChallenge(createChallenge(nextMode, freeDifficulty, progress));
    setSecondsLeft(DIFFICULTIES[freeDifficulty].timeLimit);
    setFeedback(null);
    setTypedAnswer('');
    setSelectedRegion(undefined);
  }

  function changeFreeDifficulty(nextDifficulty: DifficultyId) {
    if (!progress) return;
    setFreeDifficulty(nextDifficulty);
    setActiveDifficulty(nextDifficulty);
    setChallenge(createChallenge(mode, nextDifficulty, progress));
    setSecondsLeft(DIFFICULTIES[nextDifficulty].timeLimit);
    setFeedback(null);
    setTypedAnswer('');
    setSelectedRegion(undefined);
  }

  function handleRegionSelect(regionName: string) {
    if (view === 'game' && challenge.expectsMapClick && !feedback) {
      setSelectedRegion(regionName);
      completeMission(regionName);
      return;
    }
    setSelectedRegion(regionName);
  }

  function resetProgressAndRetest() {
    const confirmed = window.confirm('Azzerare punteggio, badge, regioni e memoria per ripartire da zero?');
    if (!confirmed) return;
    const freshProgress = createDefaultProgress();
    void persist(freshProgress);
    setView('home');
    setSection('cruscotto');
  }

  function goToSection(next: Section) {
    setSection(next);
    setView('home');
    setFeedback(null);
    setNavOpen(false);
  }

  function goHome() {
    setView('home');
    setFeedback(null);
    setCelebration(null);
  }

  function summaryReviewNow() {
    if (!progress) return;
    const next = addToReviewBox(progress, sessionWrongKeys);
    void persist(next);
    startErrorSession(sessionWrongKeys, next);
  }

  function summaryToBox() {
    if (!progress) return;
    const next = addToReviewBox(progress, sessionWrongKeys);
    void persist(next);
    setSessionWrongKeys([]);
    goHome();
  }

  if (!progress) {
    return (
      <main className="login">
        <div className="login__topbar">
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
        <section className="login__card" aria-labelledby="login-title">
          <span className="login__badge" aria-hidden="true">
            <Compass size={32} />
          </span>
          <p className="eyebrow">Atlante d'Italia</p>
          <h1 id="login-title">Impara le regioni, una carta alla volta</h1>
          <p className="login__copy">
            Ripetizione spaziata, mappa interattiva e progressi sincronizzati tra desktop e telefono.
          </p>
          <form className="login__form" onSubmit={handleLogin}>
            <label htmlFor="player-name">Nome di accesso</label>
            <div className="login__row">
              <input
                id="player-name"
                value={loginName}
                onChange={(event) => setLoginName(event.target.value)}
                placeholder="Lorenzo"
                autoComplete="given-name"
              />
              <button type="submit" className="btn btn--brand" disabled={isLoadingProgress}>
                <LockKeyhole size={18} />
                Entra
              </button>
            </div>
            {loginError ? <p className="form-error">{loginError}</p> : null}
          </form>
          <div className="login__foot">
            <Cloud size={16} />
            <span>
              {isLoadingProgress ? 'Carico i progressi...' : 'Supabase se configurato, altrimenti salvataggio locale.'}
            </span>
          </div>
        </section>
      </main>
    );
  }

  const masteredCount = masteryCounts.mastered;
  const pageTitle =
    view === 'game'
      ? sessionKind === 'libero'
        ? 'Allenamento libero'
        : sessionKind === 'errori'
          ? 'Correzione errori'
          : 'Ripasso del giorno'
      : view === 'summary'
        ? 'Riepilogo sessione'
        : SECTIONS.find((item) => item.id === section)?.label ?? 'Cruscotto';

  const streakLevel = progress.streak >= 10 ? 'is-blazing' : progress.streak >= 5 ? 'is-hot' : '';

  return (
    <div className={`atlas ${navOpen ? 'is-nav-open' : ''}`}>
      {celebration ? <Celebration key={celebration.id} event={celebration} /> : null}
      <button
        type="button"
        className="atlas__scrim"
        aria-label="Chiudi il menu"
        tabIndex={navOpen ? 0 : -1}
        onClick={() => setNavOpen(false)}
      />

      <aside className="atlas__rail" aria-label="Navigazione principale">
        <button type="button" className="atlas__brand" onClick={() => goToSection('cruscotto')}>
          <span className="atlas__logo" aria-hidden="true">
            <Compass size={22} />
          </span>
          <span className="atlas__brand-text">
            <strong>Atlante</strong>
            <small>d'Italia</small>
          </span>
        </button>

        <nav className="atlas__nav">
          {SECTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`atlas__nav-item ${view === 'home' && section === item.id ? 'is-active' : ''}`}
              onClick={() => goToSection(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="atlas__rail-foot">
          <div className="atlas__player">
            <span className="atlas__avatar" aria-hidden="true">
              {PLAYER_NAME.charAt(0)}
            </span>
            <span>
              <strong>{PLAYER_NAME}</strong>
              <small className={`sync-dot sync-dot--${syncStatus.kind}`}>{syncStatus.label}</small>
            </span>
          </div>
          <button type="button" className="atlas__reset" onClick={resetProgressAndRetest}>
            <RotateCcw size={16} />
            Riparti da zero
          </button>
        </div>
      </aside>

      <div className="atlas__body">
        <header className="atlas__topbar">
          <button type="button" className="icon-btn atlas__menu" onClick={() => setNavOpen((open) => !open)} aria-label="Apri il menu">
            <Menu size={20} />
          </button>
          <div className="atlas__heading">
            <p className="eyebrow">Atlante d'Italia</p>
            <h1>{pageTitle}</h1>
          </div>
          <div className="atlas__topbar-actions">
            <span
              key={`streak-${progress.streak}`}
              className={`chip chip--streak ${streakLevel}`}
              title="Serie di risposte corrette"
            >
              <Flame size={15} />
              {progress.streak}
            </span>
            <span className="chip" title="Punteggio totale">
              <Trophy size={15} />
              {progress.score}
            </span>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </header>

        <main className="atlas__content">
          {view === 'home' ? (
            <HomeView
              progress={progress}
              review={review}
              levelInfo={levelInfo}
              masteryMap={masteryMap}
              masteryCounts={masteryCounts}
              masteredCount={masteredCount}
              section={section}
              freeMode={mode}
              freeDifficulty={freeDifficulty}
              selectedRegion={selectedRegion}
              activeRegion={activeRegion}
              onStartReview={startReview}
              onStartFree={startFree}
              onStartErrors={(keys) => startErrorSession(keys, progress)}
              onSelectMode={setMode}
              onSelectDifficulty={setFreeDifficulty}
              onRegionSelect={setSelectedRegion}
              onGoSection={goToSection}
            />
          ) : view === 'summary' ? (
            <SummaryView
              stats={sessionStats}
              masteredCount={masteredCount}
              showErrorPrompt={sessionKind === 'ripasso' && sessionWrongKeys.length > 0}
              onHome={goHome}
              onReviewNow={summaryReviewNow}
              onToBox={summaryToBox}
              onAgain={startReview}
              canRepeat={Boolean(review && review.queue.length > 0)}
            />
          ) : (
            <section className="game">
              <div className="game__main">
                <div className="panel mission">
                  <div className="mission__head">
                    <button type="button" className="btn btn--ghost" onClick={goHome}>
                      <ArrowLeft size={18} />
                      Home
                    </button>
                    {sessionKind !== 'libero' ? (
                      <button type="button" className="link-action" onClick={() => setView('summary')}>
                        Termina sessione
                      </button>
                    ) : null}
                  </div>

                  {sessionKind !== 'libero' ? (
                    <div className="session-bar">
                      <span className="session-bar__tag">
                        {sessionKind === 'errori' ? <XCircle size={15} /> : <Sparkles size={15} />}
                        {sessionKind === 'errori' ? 'Errori' : 'Ripasso'} · carta{' '}
                        {Math.min(sessionIndex + 1, sessionQueue.length)}/{sessionQueue.length}
                      </span>
                      <div className="track">
                        <span style={{ width: `${sessionQueue.length ? Math.round((sessionIndex / sessionQueue.length) * 100) : 0}%` }} />
                      </div>
                    </div>
                  ) : (
                    <div className="free-controls">
                      <div className="segmented">
                        {(Object.keys(DIFFICULTIES) as DifficultyId[]).map((key) => (
                          <button
                            key={key}
                            type="button"
                            className={freeDifficulty === key ? 'is-active' : ''}
                            onClick={() => changeFreeDifficulty(key)}
                            title={DIFFICULTIES[key].description}
                          >
                            {DIFFICULTIES[key].label}
                          </button>
                        ))}
                      </div>
                      <div className="mode-chips">
                        {(Object.keys(GAME_MODES) as GameModeId[]).map((key) => (
                          <button
                            key={key}
                            type="button"
                            className={mode === key ? 'mode-chip is-active' : 'mode-chip'}
                            onClick={() => changeFreeMode(key)}
                            title={GAME_MODES[key].description}
                          >
                            {modeIcon(key)}
                            <span>{GAME_MODES[key].label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mission__topline">
                    <span className="chip chip--mode">
                      {modeIcon(challenge.mode)}
                      {GAME_MODES[challenge.mode].iconLabel}
                    </span>
                    {secondsLeft !== null ? (
                      <span className={secondsLeft <= 6 ? 'chip chip--timer is-danger' : 'chip chip--timer'}>
                        <Clock3 size={15} />
                        {secondsLeft}s
                      </span>
                    ) : (
                      <span className="chip chip--timer">
                        <Clock3 size={15} />
                        No timer
                      </span>
                    )}
                  </div>

                  <h2 className="mission__prompt">{challenge.prompt}</h2>
                  <p className="mission__desc">{difficultySettings.description}</p>

                  {sessionKind !== 'libero' ? (
                    <div className="answer-style">
                      <span className="control-label">Come vuoi rispondere?</span>
                      <div className="segmented segmented--two">
                        <button
                          type="button"
                          className={answerStyle === 'click' ? 'is-active' : ''}
                          disabled={Boolean(feedback)}
                          onClick={() => {
                            setAnswerStyle('click');
                            setSelfTestRevealed(false);
                          }}
                        >
                          {challenge.mode === 'mappa' ? <MapPin size={15} /> : <CheckCircle2 size={15} />}
                          {challenge.mode === 'mappa' ? 'Clicca la mappa' : 'Rispondi'}
                        </button>
                        <button
                          type="button"
                          className={answerStyle === 'mente' ? 'is-active' : ''}
                          disabled={Boolean(feedback)}
                          onClick={() => {
                            setAnswerStyle('mente');
                            setSelfTestRevealed(false);
                          }}
                        >
                          <Brain size={15} /> A mente
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {challenge.hints.length > 0 ? (
                    <div className="hint-list" aria-label="Suggerimenti">
                      {challenge.hints.map((hint) => (
                        <span key={hint}>
                          <Lightbulb size={13} />
                          {hint}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="hint-list is-empty">
                      <span>Zero suggerimenti: richiamo a memoria.</span>
                    </div>
                  )}

                  {challenge.expectsMapClick && !isSelfTest ? (
                    <div className="map-instruction">
                      <MapPin size={18} />
                      Clicca direttamente sulla regione corretta nella mappa.
                    </div>
                  ) : isSelfTest ? (
                    <div className="self-test">
                      {feedback ? null : !selfTestRevealed ? (
                        <>
                          <p className="self-test__hint">
                            {isSelfTestMappa
                              ? `Visualizza a mente dove si trova ${challenge.correctDisplay}, poi rivela la risposta.`
                              : 'Pensa alla risposta a mente, poi rivelala.'}
                          </p>
                          <button type="button" className="btn btn--brand" onClick={() => setSelfTestRevealed(true)}>
                            <Eye size={18} />
                            Mostra la risposta
                          </button>
                        </>
                      ) : (
                        <>
                          <p className="self-test__hint">
                            {isSelfTestMappa ? (
                              <>
                                La regione corretta è evidenziata sulla mappa: <strong>{challenge.correctDisplay}</strong>.
                              </>
                            ) : (
                              <>
                                Risposta corretta: <strong>{challenge.correctDisplay}</strong>.
                              </>
                            )}{' '}
                            L'avevi indovinata a mente?
                          </p>
                          <div className="self-test__grade">
                            <button
                              type="button"
                              className="btn btn--ok"
                              onClick={() => completeMission('', true, 'Autovalutazione: sapevi la risposta.')}
                            >
                              <ThumbsUp size={18} />
                              L'avevo indovinata
                            </button>
                            <button
                              type="button"
                              className="btn btn--outline"
                              onClick={() => completeMission('', false, 'Autovalutazione: da ripassare.')}
                            >
                              <ThumbsDown size={18} />
                              Non la sapevo
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ) : challenge.options.length > 0 ? (
                    <div className="answer-grid">
                      {challenge.options.map((option) => (
                        <button key={option} type="button" disabled={Boolean(feedback)} onClick={() => completeMission(option)}>
                          {option}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <form className="answer-form" onSubmit={submitTypedAnswer}>
                      <input
                        value={typedAnswer}
                        onChange={(event) => setTypedAnswer(event.target.value)}
                        placeholder={requiresFreeText ? 'Scrivi la risposta' : ''}
                        disabled={Boolean(feedback)}
                        autoFocus
                      />
                      <button type="submit" className="btn btn--brand" disabled={Boolean(feedback)}>
                        <CheckCircle2 size={18} />
                        Conferma
                      </button>
                    </form>
                  )}

                  {feedback ? (
                    <div className={feedback.correct ? 'feedback is-correct' : 'feedback is-wrong'} aria-live="polite">
                      {feedback.correct ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                      <span>{feedback.text}</span>
                    </div>
                  ) : null}

                  {feedback ? (
                    <div className="recall">
                      <span className="recall__head">
                        <Lightbulb size={15} /> Per ricordarla
                      </span>
                      <p className="recall__mnemonic">{activeRegion.mnemonic}</p>
                      <p className="recall__clue">{activeRegion.cultureClue}</p>
                    </div>
                  ) : null}

                  {feedback ? (
                    <div className="auto-advance" aria-hidden="true">
                      <span style={{ animationDuration: `${feedback.correct ? 1300 : 2600}ms` }} />
                    </div>
                  ) : null}

                  <div className="mission__foot">
                    {feedback ? (
                      <button type="button" className="btn btn--brand" onClick={advance}>
                        <RefreshCw size={18} />
                        Avanti subito
                      </button>
                    ) : (
                      <span className="points-note">+{difficultySettings.points} punti se corretta</span>
                    )}
                    {feedback ? <span className="points-note">+{difficultySettings.points} punti</span> : null}
                  </div>
                </div>
              </div>

              <aside className="game__side">
                <div className="panel map-panel">
                  <ItalyMap
                    targetRegion={targetMapRegion}
                    selectedRegion={selectedRegion}
                    masteryByRegion={masteryMap}
                    expectsMapClick={challenge.expectsMapClick && !feedback && !isSelfTestMappa}
                    revealMastery={false}
                    capturedRegion={feedback?.correct ? challenge.targetRegion : undefined}
                    captureKey={celebration?.id}
                    onRegionSelect={handleRegionSelect}
                  />
                </div>
                <div className="mini-stats">
                  <StatTile icon={<Trophy size={18} />} label="Punteggio" value={progress.score} tone="brand" />
                  <StatTile icon={<Target size={18} />} label="Padroneggiate" value={`${masteredCount}/20`} />
                  <StatTile icon={<Crown size={18} />} label="Regioni" value={`${progress.unlockedRegions.length}/20`} />
                </div>
              </aside>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

type HomeViewProps = {
  progress: GameProgress;
  review: ReturnType<typeof buildReviewSession> | null;
  levelInfo: ReturnType<typeof getLevelInfo> | null;
  masteryMap: Record<string, MasteryLevel>;
  masteryCounts: Record<MasteryLevel, number>;
  masteredCount: number;
  section: Section;
  freeMode: GameModeId;
  freeDifficulty: DifficultyId;
  selectedRegion?: string;
  activeRegion: RegionData;
  onStartReview: () => void;
  onStartFree: (mode: GameModeId, difficulty: DifficultyId) => void;
  onStartErrors: (keys: string[]) => void;
  onSelectMode: (mode: GameModeId) => void;
  onSelectDifficulty: (difficulty: DifficultyId) => void;
  onRegionSelect: (regionName: string) => void;
  onGoSection: (section: Section) => void;
};

function HomeView({
  progress,
  review,
  levelInfo,
  masteryMap,
  masteryCounts,
  masteredCount,
  section,
  freeMode,
  freeDifficulty,
  selectedRegion,
  activeRegion,
  onStartReview,
  onStartFree,
  onStartErrors,
  onSelectMode,
  onSelectDifficulty,
  onRegionSelect,
  onGoSection,
}: HomeViewProps) {
  const dueCount = review?.dueCount ?? 0;
  const newInSession = review?.newInSession ?? 0;
  const toReview = review?.queue.length ?? 0;
  const totalCards = review?.totalCards ?? 0;
  const seenCards = totalCards - (review?.unseenTotal ?? totalCards);
  const errorBox = progress.reviewBox ?? [];

  const mapBlock = (
    <div className="panel map-panel map-panel--home">
      <p className="map-caption">
        <Map size={15} /> Mappa della memoria · {selectedRegion ?? 'tocca una regione'}
      </p>
      <ItalyMap
        selectedRegion={selectedRegion}
        masteryByRegion={masteryMap}
        expectsMapClick={false}
        onRegionSelect={onRegionSelect}
      />
      <MasteryLegend counts={masteryCounts} />
    </div>
  );

  if (section === 'ripasso') {
    return (
      <div className="home home--single">
        <ReviewCard
          toReview={toReview}
          newInSession={newInSession}
          dueCount={dueCount}
          seenCards={seenCards}
          totalCards={totalCards}
          onStartReview={onStartReview}
        />
        {mapBlock}
      </div>
    );
  }

  if (section === 'errori') {
    return (
      <div className="home home--single">
        <ErrorBoxCard progress={progress} errorBox={errorBox} onStartErrors={onStartErrors} />
        {mapBlock}
      </div>
    );
  }

  if (section === 'allenamento') {
    return (
      <div className="home home--single">
        <FreeCard
          freeMode={freeMode}
          freeDifficulty={freeDifficulty}
          onSelectMode={onSelectMode}
          onSelectDifficulty={onSelectDifficulty}
          onStartFree={onStartFree}
        />
        {mapBlock}
      </div>
    );
  }

  // section === 'cruscotto'
  return (
    <div className="home">
      <div className="home__col">
        <div className="stat-grid">
          <StatTile icon={<Trophy size={18} />} label="Punteggio" value={progress.score} tone="brand" />
          <StatTile icon={<Flame size={18} />} label="Miglior serie" value={progress.bestStreak} tone="accent" />
          <StatTile icon={<Target size={18} />} label="Padroneggiate" value={`${masteredCount}/20`} />
          <StatTile icon={<Crown size={18} />} label="Regioni" value={`${progress.unlockedRegions.length}/20`} />
        </div>

        {levelInfo ? (
          <div className="panel level-box">
            <div className="level-box__head">
              <span className="level-box__num">
                <Gauge size={16} /> Livello {levelInfo.current.number}
              </span>
              <strong>{levelInfo.current.title}</strong>
            </div>
            <div className="track">
              <span style={{ width: `${levelInfo.percent}%` }} />
            </div>
            <p>{levelInfo.next ? levelInfo.next.goal : 'Italia completata: ora punta a padroneggiare tutto.'}</p>
          </div>
        ) : null}

        <div className="quick-actions">
          <button type="button" className="quick-action quick-action--brand" onClick={() => onGoSection('ripasso')}>
            <Sparkles size={20} />
            <span>
              <strong>Ripasso del giorno</strong>
              <small>{toReview > 0 ? `${toReview} carte pronte` : 'tutto in pari'}</small>
            </span>
          </button>
          <button type="button" className="quick-action" onClick={() => onGoSection('errori')}>
            <XCircle size={20} />
            <span>
              <strong>Box errori</strong>
              <small>{errorBox.length > 0 ? `${errorBox.length} da correggere` : 'nessun errore'}</small>
            </span>
          </button>
          <button type="button" className="quick-action" onClick={() => onGoSection('allenamento')}>
            <Swords size={20} />
            <span>
              <strong>Allenamento libero</strong>
              <small>senza limiti</small>
            </span>
          </button>
        </div>

        <div className="panel region-focus">
          <span className="control-label">Regione in focus</span>
          <h3>{activeRegion.shortName}</h3>
          <p>{activeRegion.mnemonic}</p>
          <div className="province-strip">
            {activeRegion.provinces.slice(0, 6).map((province) => (
              <span key={province.name} title={provinceTypeLabels[province.type]}>
                {province.code}
              </span>
            ))}
          </div>
        </div>

        <div className="panel badge-box">
          <span className="control-label">Badge</span>
          <div className="badge-list">
            {BADGES.map((badge) => {
              const earned = progress.badges.includes(badge.id);
              return (
                <span key={badge.id} className={earned ? 'badge is-earned' : 'badge'} title={badge.requirement}>
                  <Award size={15} />
                  {badge.label}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <div className="home__col">{mapBlock}</div>
    </div>
  );
}

function ReviewCard({
  toReview,
  newInSession,
  dueCount,
  seenCards,
  totalCards,
  onStartReview,
}: {
  toReview: number;
  newInSession: number;
  dueCount: number;
  seenCards: number;
  totalCards: number;
  onStartReview: () => void;
}) {
  return (
    <article className="panel action-card action-card--brand">
      <div className="action-card__head">
        <span className="action-card__icon" aria-hidden="true">
          <Sparkles size={24} />
        </span>
        <div>
          <h2>Ripasso del giorno</h2>
          <p>
            {toReview > 0
              ? `Sessione di ${toReview} carte: ${newInSession} ${newInSession === 1 ? 'nuova' : 'nuove'}${dueCount > 0 ? ` e ${dueCount} in ripasso` : ''}.`
              : 'Hai studiato tutte le carte disponibili: nessun ripasso in scadenza ora.'}
          </p>
        </div>
      </div>
      <div className="metrics">
        <div>
          <strong>{newInSession}</strong>
          <span>nuove in sessione</span>
        </div>
        <div>
          <strong>{dueCount}</strong>
          <span>in scadenza</span>
        </div>
        <div>
          <strong>
            {seenCards}
            <small>/{totalCards}</small>
          </strong>
          <span>carte viste</span>
        </div>
      </div>
      <p className="note">
        <Brain size={15} /> Su ogni carta puoi rispondere a mente: ci pensi, riveli la risposta e ti autovaluti con "Lo
        sapevo" / "Non lo sapevo".
      </p>
      {toReview > 0 ? (
        <button type="button" className="btn btn--brand btn--block" onClick={onStartReview}>
          <Sparkles size={18} />
          Inizia ripasso
        </button>
      ) : (
        <p className="all-clear">
          <CheckCircle2 size={16} /> Tutto in pari! Hai visto {seenCards}/{totalCards} carte e non ci sono ripassi in
          scadenza. Torna più tardi o allenati liberamente.
        </p>
      )}
    </article>
  );
}

function ErrorBoxCard({
  progress,
  errorBox,
  onStartErrors,
}: {
  progress: GameProgress;
  errorBox: string[];
  onStartErrors: (keys: string[]) => void;
}) {
  return (
    <article className="panel action-card">
      <div className="action-card__head">
        <span className="action-card__icon action-card__icon--danger" aria-hidden="true">
          <XCircle size={24} />
        </span>
        <div>
          <h2>Box errori</h2>
          <p>Le carte che hai sbagliato, da correggere quando vuoi.</p>
        </div>
      </div>
      {errorBox.length > 0 ? (
        <>
          <ul className="error-list">
            {errorBox.slice(0, 8).map((key) => {
              const { mode: cardMode, regionName } = parseCardKey(key);
              const region = getRegion(regionName);
              const diff = effectiveDifficulty(progress, cardMode, regionName);
              return (
                <li key={key} className="error-item">
                  <span className="error-item__mode">
                    {modeIcon(cardMode)}
                    {GAME_MODES[cardMode].label}
                  </span>
                  <span className="error-item__region">{region?.shortName ?? regionName}</span>
                  <span className={`diff-tag diff-tag--${diff}`}>{DIFFICULTIES[diff].label}</span>
                </li>
              );
            })}
          </ul>
          {errorBox.length > 8 ? <p className="note">+{errorBox.length - 8} altre nel box</p> : null}
          <button type="button" className="btn btn--brand btn--block" onClick={() => onStartErrors(errorBox)}>
            <RefreshCw size={18} />
            Correggi errori ({errorBox.length})
          </button>
        </>
      ) : (
        <p className="all-clear">
          <CheckCircle2 size={16} /> Nessun errore in sospeso. Quando sbagli una carta finisce qui.
        </p>
      )}
    </article>
  );
}

function FreeCard({
  freeMode,
  freeDifficulty,
  onSelectMode,
  onSelectDifficulty,
  onStartFree,
}: {
  freeMode: GameModeId;
  freeDifficulty: DifficultyId;
  onSelectMode: (mode: GameModeId) => void;
  onSelectDifficulty: (difficulty: DifficultyId) => void;
  onStartFree: (mode: GameModeId, difficulty: DifficultyId) => void;
}) {
  return (
    <article className="panel action-card">
      <div className="action-card__head">
        <span className="action-card__icon" aria-hidden="true">
          <Swords size={24} />
        </span>
        <div>
          <h2>Allenamento libero</h2>
          <p>Gioca senza limiti: scegli modalità e difficoltà, con aiuti e mappa interattiva.</p>
        </div>
      </div>
      <span className="control-label">Difficoltà</span>
      <div className="segmented">
        {(Object.keys(DIFFICULTIES) as DifficultyId[]).map((key) => (
          <button
            key={key}
            type="button"
            className={freeDifficulty === key ? 'is-active' : ''}
            onClick={() => onSelectDifficulty(key)}
            title={DIFFICULTIES[key].description}
          >
            {DIFFICULTIES[key].label}
          </button>
        ))}
      </div>
      <span className="control-label">Modalità</span>
      <div className="mode-chips">
        {(Object.keys(GAME_MODES) as GameModeId[]).map((key) => (
          <button
            key={key}
            type="button"
            className={freeMode === key ? 'mode-chip is-active' : 'mode-chip'}
            onClick={() => onSelectMode(key)}
            title={GAME_MODES[key].description}
          >
            {modeIcon(key)}
            <span>{GAME_MODES[key].label}</span>
          </button>
        ))}
      </div>
      <button type="button" className="btn btn--brand btn--block" onClick={() => onStartFree(freeMode, freeDifficulty)}>
        <Route size={18} />
        Gioca {GAME_MODES[freeMode].label}
      </button>
    </article>
  );
}

function SummaryView({
  stats,
  masteredCount,
  showErrorPrompt,
  onHome,
  onReviewNow,
  onToBox,
  onAgain,
  canRepeat,
}: {
  stats: SessionStats;
  masteredCount: number;
  showErrorPrompt: boolean;
  onHome: () => void;
  onReviewNow: () => void;
  onToBox: () => void;
  onAgain: () => void;
  canRepeat: boolean;
}) {
  const accuracy = stats.answered > 0 ? Math.round((stats.correct / stats.answered) * 100) : 0;
  return (
    <section className="summary">
      <div className="panel summary__card">
        <span className="action-card__icon" aria-hidden="true">
          <Trophy size={26} />
        </span>
        <h2>Sessione completata</h2>
        <p>Hai allenato la memoria. La precisione di oggi è del {accuracy}%.</p>
        <div className="metrics metrics--four">
          <div>
            <strong>{stats.correct}</strong>
            <span>corrette</span>
          </div>
          <div>
            <strong>{stats.wrong}</strong>
            <span>sbagliate</span>
          </div>
          <div>
            <strong>{stats.newCards}</strong>
            <span>nuove esplorate</span>
          </div>
          <div>
            <strong>{masteredCount}/20</strong>
            <span>padroneggiate</span>
          </div>
        </div>

        {showErrorPrompt ? (
          <div className="summary__prompt">
            <p>
              <XCircle size={16} /> Hai sbagliato {stats.wrong} {stats.wrong === 1 ? 'carta' : 'carte'}. Vuoi ripassarle
              subito?
            </p>
            <div className="summary__actions">
              <button type="button" className="btn btn--brand btn--block" onClick={onReviewNow}>
                <RefreshCw size={18} />
                Ripassale ora
              </button>
              <button type="button" className="btn btn--outline" onClick={onToBox}>
                <Map size={17} />
                Mettile nel box
              </button>
            </div>
          </div>
        ) : (
          <div className="summary__actions">
            <button type="button" className="btn btn--brand btn--block" onClick={onHome}>
              <Map size={18} />
              Torna alla home
            </button>
            {canRepeat ? (
              <button type="button" className="btn btn--outline" onClick={onAgain}>
                <RefreshCw size={17} />
                Altro ripasso
              </button>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}

function StatTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  tone?: 'brand' | 'accent';
}) {
  return (
    <div className={`stat-tile ${tone ? `stat-tile--${tone}` : ''}`}>
      <span className="stat-tile__icon" aria-hidden="true">
        {icon}
      </span>
      <div>
        <span className="stat-tile__label">{label}</span>
        <strong className="stat-tile__value">{value}</strong>
      </div>
    </div>
  );
}

function MasteryLegend({ counts }: { counts: Record<MasteryLevel, number> }) {
  return (
    <div className="mastery-legend">
      {MASTERY_ORDER.map((level) => (
        <span key={level} className="mastery-legend__row">
          <i className="swatch" style={{ background: `var(${MASTERY_META[level].varName})` }} aria-hidden="true" />
          {MASTERY_META[level].label}
          <strong>{counts[level]}</strong>
        </span>
      ))}
    </div>
  );
}

function modeIcon(mode: GameModeId) {
  const size = 17;
  if (mode === 'mappa') return <Map size={size} />;
  if (mode === 'viaggio') return <Route size={size} />;
  if (mode === 'capoluoghi') return <Crown size={size} />;
  if (mode === 'province') return <MapPin size={size} />;
  if (mode === 'confini') return <Compass size={size} />;
  return <Lightbulb size={size} />;
}

export default App;
