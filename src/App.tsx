import {
  Award,
  CheckCircle2,
  Clock3,
  Cloud,
  Compass,
  Crown,
  Flame,
  Lightbulb,
  LockKeyhole,
  Map,
  MapPin,
  RefreshCw,
  RotateCcw,
  Route,
  Sparkles,
  Target,
  Trophy,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import './App.css';
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
  isAnswerCorrect,
  normalizeAnswer,
  parseCardKey,
  PLAYER_NAME,
} from './lib/game';
import { loadProgress, refreshCloudProgress, saveProgress } from './lib/progressStore';
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
type SessionStats = { answered: number; correct: number; wrong: number; newCards: number };

const MASTERY_META: Record<MasteryLevel, { label: string; className: string }> = {
  new: { label: 'Da scoprire', className: 'm-new' },
  learning: { label: 'In apprendimento', className: 'm-learning' },
  young: { label: 'Giovane', className: 'm-young' },
  mature: { label: 'Matura', className: 'm-mature' },
  mastered: { label: 'Padroneggiata', className: 'm-mastered' },
};
const MASTERY_ORDER: MasteryLevel[] = ['new', 'learning', 'young', 'mature', 'mastered'];

function App() {
  const [loginName, setLoginName] = useState(() => localStorage.getItem('italia-quest-login') ?? '');
  const [loginError, setLoginError] = useState('');
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);
  const [progress, setProgress] = useState<GameProgress | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ kind: 'idle', label: 'Pronto' });

  const [view, setView] = useState<View>('home');
  const [sessionKind, setSessionKind] = useState<SessionKind>('ripasso');
  const [sessionQueue, setSessionQueue] = useState<string[]>([]);
  const [sessionIndex, setSessionIndex] = useState(0);
  const [sessionStats, setSessionStats] = useState<SessionStats>({ answered: 0, correct: 0, wrong: 0, newCards: 0 });
  const [sessionWrongKeys, setSessionWrongKeys] = useState<string[]>([]);

  const [mode, setMode] = useState<GameModeId>('mappa');
  const [freeDifficulty, setFreeDifficulty] = useState<DifficultyId>('facile');
  const [activeDifficulty, setActiveDifficulty] = useState<DifficultyId>('facile');
  const [challenge, setChallenge] = useState<Challenge>(() => createChallenge('mappa', 'facile'));
  const [typedAnswer, setTypedAnswer] = useState('');
  const [feedback, setFeedback] = useState<{ correct: boolean; text: string } | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | undefined>();
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

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
  const targetMapRegion = feedback ? challenge.targetRegion : undefined;

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
  }, []);

  const startReview = useCallback(() => {
    if (!progress || !review || review.queue.length === 0) return;
    setSessionKind('ripasso');
    setSessionQueue(review.queue);
    setSessionIndex(0);
    setSessionStats({ answered: 0, correct: 0, wrong: 0, newCards: 0 });
    setSessionWrongKeys([]);
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
    setSyncStatus(result.status);
    setIsLoadingProgress(false);
  }

  function submitTypedAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!typedAnswer.trim()) return;
    completeMission(typedAnswer);
  }

  function advance() {
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
      setView('summary');
      return;
    }
    setSessionIndex(nextIndex);
    loadCardChallenge(sessionQueue[nextIndex], progress);
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
  }

  function goHome() {
    setView('home');
    setFeedback(null);
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
      <main className="login-screen">
        <section className="login-panel" aria-labelledby="login-title">
          <div className="brand-mark" aria-hidden="true">
            <Compass size={34} />
          </div>
          <p className="eyebrow">Italia Quest</p>
          <h1 id="login-title">La conquista delle regioni</h1>
          <p className="login-copy">
            Entra con il nome autorizzato e ritrova gli stessi progressi da desktop e telefono.
          </p>
          <form className="login-form" onSubmit={handleLogin}>
            <label htmlFor="player-name">Nome di accesso</label>
            <div className="login-row">
              <input
                id="player-name"
                value={loginName}
                onChange={(event) => setLoginName(event.target.value)}
                placeholder="Lorenzo"
                autoComplete="given-name"
              />
              <button type="submit" disabled={isLoadingProgress}>
                <LockKeyhole size={18} />
                Entra
              </button>
            </div>
            {loginError ? <p className="form-error">{loginError}</p> : null}
          </form>
          <div className="login-footnote">
            <Cloud size={16} />
            <span>{isLoadingProgress ? 'Carico i progressi...' : 'Supabase se configurato, fallback locale se offline.'}</span>
          </div>
        </section>
      </main>
    );
  }

  const masteredCount = masteryCounts.mastered;

  return (
    <main className="app-shell">
      <header className="topbar">
        <button type="button" className="title-block" onClick={goHome} aria-label="Torna alla home">
          <div className="brand-mark small" aria-hidden="true">
            <Map size={24} />
          </div>
          <div>
            <p className="eyebrow">Italia Quest</p>
            <h1>La conquista delle regioni</h1>
          </div>
        </button>
        <div className="status-row">
          <span className="pill streak-pill" title="Serie di risposte corrette">
            <Flame size={16} />
            {progress.streak}
          </span>
          <span className={`pill sync-pill ${syncStatus.kind}`}>
            <Cloud size={16} />
            {syncStatus.label}
          </span>
          <span className="pill player-pill">Lorenzo</span>
        </div>
      </header>

      {view === 'home' ? (
        <HomeView
          progress={progress}
          review={review}
          levelInfo={levelInfo}
          masteryMap={masteryMap}
          masteryCounts={masteryCounts}
          masteredCount={masteredCount}
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
          onReset={resetProgressAndRetest}
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
        <section className="game-grid">
          <section className="mission-panel" aria-labelledby="mission-title">
            {sessionKind !== 'libero' ? (
              <div className="session-bar">
                <div className="session-bar-head">
                  <span className="session-tag">
                    {sessionKind === 'errori' ? <XCircle size={15} /> : <Sparkles size={15} />}{' '}
                    {sessionKind === 'errori' ? 'Errori' : 'Ripasso'} · carta {Math.min(sessionIndex + 1, sessionQueue.length)}/{sessionQueue.length}
                  </span>
                  <button type="button" className="link-action" onClick={() => setView('summary')}>
                    Termina
                  </button>
                </div>
                <div className="progress-track">
                  <span style={{ width: `${sessionQueue.length ? Math.round((sessionIndex / sessionQueue.length) * 100) : 0}%` }} />
                </div>
              </div>
            ) : (
              <div className="free-controls">
                <div className="segmented small">
                  {(Object.keys(DIFFICULTIES) as DifficultyId[]).map((key) => (
                    <button
                      key={key}
                      type="button"
                      className={freeDifficulty === key ? 'active' : ''}
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
                      className={mode === key ? 'mode-chip active' : 'mode-chip'}
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

            <div className="mission-topline">
              <span className="pill mission-mode">{modeIcon(challenge.mode)}{GAME_MODES[challenge.mode].iconLabel}</span>
              {secondsLeft !== null ? (
                <span className={secondsLeft <= 6 ? 'pill timer danger' : 'pill timer'}>
                  <Clock3 size={16} />
                  {secondsLeft}s
                </span>
              ) : (
                <span className="pill timer calm">
                  <Clock3 size={16} />
                  No timer
                </span>
              )}
            </div>

            <h2 id="mission-title">{challenge.prompt}</h2>
            <p className="mission-description">{difficultySettings.description}</p>

            {challenge.hints.length > 0 ? (
              <div className="hint-list" aria-label="Suggerimenti">
                {challenge.hints.map((hint) => (
                  <span key={hint}>{hint}</span>
                ))}
              </div>
            ) : (
              <div className="hint-list empty">
                <span>Zero suggerimenti: richiamo a memoria.</span>
              </div>
            )}

            {challenge.expectsMapClick ? (
              <div className="map-instruction">
                <MapPin size={18} />
                Clicca direttamente sulla regione corretta nella mappa.
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
                <button type="submit" disabled={Boolean(feedback)}>
                  <CheckCircle2 size={18} />
                  Conferma
                </button>
              </form>
            )}

            {feedback ? (
              <div className={feedback.correct ? 'feedback correct' : 'feedback wrong'} aria-live="polite">
                {feedback.correct ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                <span>{feedback.text}</span>
              </div>
            ) : null}

            {feedback ? (
              <div className="recall-card">
                <span className="recall-head">
                  <Lightbulb size={15} /> Per ricordarla
                </span>
                <p className="recall-mnemonic">{activeRegion.mnemonic}</p>
                <p className="recall-clue">{activeRegion.cultureClue}</p>
              </div>
            ) : null}

            <div className="mission-actions">
              {feedback ? (
                <button type="button" className="primary-action" onClick={advance}>
                  <RefreshCw size={18} />
                  {sessionKind === 'libero' ? 'Nuova missione' : 'Continua'}
                </button>
              ) : (
                <span className="points-note">+{difficultySettings.points} punti se corretta</span>
              )}
              {feedback ? <span className="points-note">+{difficultySettings.points} punti</span> : null}
            </div>
          </section>

          <section className="map-panel" aria-label="Mappa">
            <ItalyMap
              targetRegion={targetMapRegion}
              selectedRegion={selectedRegion}
              masteryByRegion={masteryMap}
              expectsMapClick={challenge.expectsMapClick && !feedback}
              revealMastery={false}
              onRegionSelect={handleRegionSelect}
            />
          </section>

          <aside className="progress-panel" aria-label="Progressi">
            <div className="stat-card primary">
              <Trophy size={20} />
              <div>
                <span>Punteggio</span>
                <strong>{progress.score}</strong>
              </div>
            </div>
            <div className="stat-card">
              <Target size={20} />
              <div>
                <span>Padroneggiate</span>
                <strong>{masteredCount}/20</strong>
              </div>
            </div>
            <div className="stat-card">
              <Crown size={20} />
              <div>
                <span>Regioni</span>
                <strong>{progress.unlockedRegions.length}/20</strong>
              </div>
            </div>

            {levelInfo ? (
              <div className="level-box">
                <div className="level-heading">
                  <span>Livello {levelInfo.current.number}</span>
                  <strong>{levelInfo.current.title}</strong>
                </div>
                <div className="progress-track">
                  <span style={{ width: `${levelInfo.percent}%` }} />
                </div>
                <p>{levelInfo.next ? levelInfo.next.goal : 'Italia completata: ora punta a padroneggiare tutto.'}</p>
              </div>
            ) : null}

            <MasteryLegend counts={masteryCounts} />

            <div className="region-focus">
              <span className="control-label">Regione in focus</span>
              <h3>{activeRegion.shortName}</h3>
              <p>{activeRegion.mnemonic}</p>
              <div className="province-strip">
                {activeRegion.provinces.slice(0, 5).map((province) => (
                  <span key={province.name} title={provinceTypeLabels[province.type]}>
                    {province.code}
                  </span>
                ))}
              </div>
            </div>

            <div className="badge-list">
              <span className="control-label">Badge</span>
              {BADGES.map((badge) => {
                const earned = progress.badges.includes(badge.id);
                return (
                  <span key={badge.id} className={earned ? 'badge earned' : 'badge'} title={badge.requirement}>
                    <Award size={15} />
                    {badge.label}
                  </span>
                );
              })}
            </div>

            <p className="sync-detail">{syncStatus.detail}</p>
            <div className="retest-actions">
              <button type="button" className="outline-action" onClick={goHome}>
                <RotateCcw size={17} />
                Torna alla home
              </button>
            </div>
          </aside>
        </section>
      )}
    </main>
  );
}

type HomeViewProps = {
  progress: GameProgress;
  review: ReturnType<typeof buildReviewSession> | null;
  levelInfo: ReturnType<typeof getLevelInfo> | null;
  masteryMap: Record<string, MasteryLevel>;
  masteryCounts: Record<MasteryLevel, number>;
  masteredCount: number;
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
  onReset: () => void;
};

function HomeView({
  progress,
  review,
  levelInfo,
  masteryMap,
  masteryCounts,
  masteredCount,
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
  onReset,
}: HomeViewProps) {
  const dueCount = review?.dueCount ?? 0;
  const newInSession = review?.newInSession ?? 0;
  const toReview = review?.queue.length ?? 0;
  const totalCards = review?.totalCards ?? 0;
  const seenCards = totalCards - (review?.unseenTotal ?? totalCards);
  const errorBox = progress.reviewBox ?? [];

  return (
    <>
      <section className="home-actions">
        <article className="action-card primary">
          <div className="action-head">
            <span className="action-icon ripasso" aria-hidden="true">
              <Sparkles size={22} />
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
          <div className="action-metrics">
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
          {toReview > 0 ? (
            <button type="button" className="primary-action big" onClick={onStartReview}>
              <Sparkles size={18} />
              Inizia ripasso
            </button>
          ) : (
            <p className="all-clear">
              <CheckCircle2 size={16} /> Tutto in pari! Hai visto {seenCards}/{totalCards} carte e non ci sono ripassi
              in scadenza. Torna più tardi o allenati liberamente.
            </p>
          )}
        </article>

        <article className="action-card errori">
          <div className="action-head">
            <span className="action-icon errori" aria-hidden="true">
              <XCircle size={22} />
            </span>
            <div>
              <h2>Box errori</h2>
              <p>Le carte che hai sbagliato, da correggere quando vuoi.</p>
            </div>
          </div>
          {errorBox.length > 0 ? (
            <>
              <ul className="error-list">
                {errorBox.slice(0, 6).map((key) => {
                  const { mode: cardMode, regionName } = parseCardKey(key);
                  const region = getRegion(regionName);
                  const diff = effectiveDifficulty(progress, cardMode, regionName);
                  return (
                    <li key={key} className="error-item">
                      <span className="error-mode">
                        {modeIcon(cardMode)}
                        {GAME_MODES[cardMode].label}
                      </span>
                      <span className="error-region">{region?.shortName ?? regionName}</span>
                      <span className={`diff-tag ${diff}`}>{DIFFICULTIES[diff].label}</span>
                    </li>
                  );
                })}
              </ul>
              {errorBox.length > 6 ? <p className="muted-note">+{errorBox.length - 6} altre nel box</p> : null}
              <button type="button" className="primary-action big" onClick={() => onStartErrors(errorBox)}>
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

        <article className="action-card">
          <div className="action-head">
            <span className="action-icon libero" aria-hidden="true">
              <Compass size={22} />
            </span>
            <div>
              <h2>Allenamento libero</h2>
              <p>Gioca senza limiti: scegli modalità e difficoltà.</p>
            </div>
          </div>
          <div className="segmented small">
            {(Object.keys(DIFFICULTIES) as DifficultyId[]).map((key) => (
              <button
                key={key}
                type="button"
                className={freeDifficulty === key ? 'active' : ''}
                onClick={() => onSelectDifficulty(key)}
                title={DIFFICULTIES[key].description}
              >
                {DIFFICULTIES[key].label}
              </button>
            ))}
          </div>
          <div className="mode-chips home">
            {(Object.keys(GAME_MODES) as GameModeId[]).map((key) => (
              <button
                key={key}
                type="button"
                className={freeMode === key ? 'mode-chip active' : 'mode-chip'}
                onClick={() => onSelectMode(key)}
                title={GAME_MODES[key].description}
              >
                {modeIcon(key)}
                <span>{GAME_MODES[key].label}</span>
              </button>
            ))}
          </div>
          <button type="button" className="secondary-action big" onClick={() => onStartFree(freeMode, freeDifficulty)}>
            <Route size={18} />
            Gioca {GAME_MODES[freeMode].label}
          </button>
        </article>
      </section>

      <section className="home-overview">
        <div className="overview-stats">
          <div className="stat-card primary">
            <Trophy size={20} />
            <div>
              <span>Punteggio</span>
              <strong>{progress.score}</strong>
            </div>
          </div>
          <div className="stat-card">
            <Flame size={20} />
            <div>
              <span>Miglior serie</span>
              <strong>{progress.bestStreak}</strong>
            </div>
          </div>
          <div className="stat-card">
            <Target size={20} />
            <div>
              <span>Padroneggiate</span>
              <strong>{masteredCount}/20</strong>
            </div>
          </div>

          {levelInfo ? (
            <div className="level-box">
              <div className="level-heading">
                <span>Livello {levelInfo.current.number}</span>
                <strong>{levelInfo.current.title}</strong>
              </div>
              <div className="progress-track">
                <span style={{ width: `${levelInfo.percent}%` }} />
              </div>
              <p>{levelInfo.next ? levelInfo.next.goal : 'Italia completata: padroneggia ogni carta.'}</p>
            </div>
          ) : null}

          <MasteryLegend counts={masteryCounts} />

          <div className="region-focus">
            <span className="control-label">Regione in focus</span>
            <h3>{activeRegion.shortName}</h3>
            <p>{activeRegion.mnemonic}</p>
          </div>

          <div className="retest-actions">
            <button type="button" className="danger-action" onClick={onReset}>
              <RotateCcw size={17} />
              Riparti da zero
            </button>
          </div>
        </div>

        <div className="map-panel home" aria-label="Mappa della memoria">
          <p className="map-caption">Mappa della memoria · {selectedRegion ?? 'tocca una regione'}</p>
          <ItalyMap
            selectedRegion={selectedRegion}
            masteryByRegion={masteryMap}
            expectsMapClick={false}
            onRegionSelect={onRegionSelect}
          />
        </div>
      </section>
    </>
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
    <section className="summary-screen">
      <div className="summary-card">
        <span className="action-icon ripasso" aria-hidden="true">
          <Trophy size={26} />
        </span>
        <h2>Sessione completata</h2>
        <p>Hai allenato la memoria. La precisione di oggi è del {accuracy}%.</p>
        <div className="summary-stats">
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
          <div className="summary-prompt">
            <p>
              <XCircle size={16} /> Hai sbagliato {stats.wrong} {stats.wrong === 1 ? 'carta' : 'carte'}. Vuoi ripassarle subito?
            </p>
            <div className="summary-actions">
              <button type="button" className="primary-action big" onClick={onReviewNow}>
                <RefreshCw size={18} />
                Ripassale ora
              </button>
              <button type="button" className="outline-action" onClick={onToBox}>
                <Map size={17} />
                Mettile nel box
              </button>
            </div>
          </div>
        ) : (
          <div className="summary-actions">
            <button type="button" className="primary-action big" onClick={onHome}>
              <Map size={18} />
              Torna alla home
            </button>
            {canRepeat ? (
              <button type="button" className="outline-action" onClick={onAgain}>
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

function MasteryLegend({ counts }: { counts: Record<MasteryLevel, number> }) {
  return (
    <div className="mastery-legend">
      <span className="control-label">Padronanza</span>
      <div className="mastery-rows">
        {MASTERY_ORDER.map((level) => (
          <span key={level} className={`mastery-row ${MASTERY_META[level].className}`}>
            <i className="swatch" aria-hidden="true" />
            {MASTERY_META[level].label}
            <strong>{counts[level]}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}

function modeIcon(mode: GameModeId) {
  const size = 18;
  if (mode === 'mappa') return <Map size={size} />;
  if (mode === 'viaggio') return <Route size={size} />;
  if (mode === 'capoluoghi') return <Crown size={size} />;
  if (mode === 'province') return <MapPin size={size} />;
  if (mode === 'confini') return <Compass size={size} />;
  return <Lightbulb size={size} />;
}

export default App;
