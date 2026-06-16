import {
  Award,
  CheckCircle2,
  Clock3,
  Cloud,
  Compass,
  Crown,
  Flame,
  LockKeyhole,
  Map,
  MapPin,
  RefreshCw,
  Route,
  Trophy,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import './App.css';
import { ItalyMap } from './components/ItalyMap';
import { provinceTypeLabels, REGIONS } from './data/regions';
import {
  applyMissionResult,
  BADGES,
  createChallenge,
  DIFFICULTIES,
  GAME_MODES,
  getLevelInfo,
  getRegion,
  isAnswerCorrect,
  normalizeAnswer,
  PLAYER_NAME,
} from './lib/game';
import { loadProgress, refreshCloudProgress, saveProgress } from './lib/progressStore';
import type { Challenge, DifficultyId, GameModeId, GameProgress, SyncStatus } from './types';

function App() {
  const [loginName, setLoginName] = useState(() => localStorage.getItem('italia-quest-login') ?? '');
  const [loginError, setLoginError] = useState('');
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);
  const [progress, setProgress] = useState<GameProgress | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    kind: 'idle',
    label: 'Pronto',
  });
  const [difficulty, setDifficulty] = useState<DifficultyId>('facile');
  const [mode, setMode] = useState<GameModeId>('mappa');
  const [challenge, setChallenge] = useState<Challenge>(() => createChallenge('mappa', 'facile'));
  const [typedAnswer, setTypedAnswer] = useState('');
  const [feedback, setFeedback] = useState<{ correct: boolean; text: string } | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | undefined>();
  const [secondsLeft, setSecondsLeft] = useState<number | null>(DIFFICULTIES.facile.timeLimit);

  const levelInfo = useMemo(() => (progress ? getLevelInfo(progress) : null), [progress]);
  const activeRegion = useMemo(
    () => getRegion(selectedRegion ?? challenge.targetRegion) ?? REGIONS[0],
    [challenge.targetRegion, selectedRegion],
  );
  const modeStats = progress?.modeStats[mode];
  const difficultySettings = DIFFICULTIES[difficulty];
  const requiresFreeText = !challenge.expectsMapClick && challenge.options.length === 0;

  const startMission = useCallback((nextMode = mode, nextDifficulty = difficulty) => {
    setMode(nextMode);
    setDifficulty(nextDifficulty);
    setChallenge(createChallenge(nextMode, nextDifficulty));
    setSecondsLeft(DIFFICULTIES[nextDifficulty].timeLimit);
    setFeedback(null);
    setTypedAnswer('');
    setSelectedRegion(undefined);
  }, [mode, difficulty]);

  const persist = useCallback(async (nextProgress: GameProgress) => {
    setProgress(nextProgress);
    setSyncStatus({ kind: 'syncing', label: 'Salvo' });
    const status = await saveProgress(nextProgress);
    setSyncStatus(status);
  }, []);

  const completeMission = useCallback(
    (answer: string, forcedCorrect?: boolean, customMessage?: string) => {
      if (!progress || feedback) return;
      const correct = forcedCorrect ?? isAnswerCorrect(answer, challenge);
      const nextProgress = applyMissionResult(progress, challenge, difficulty, correct);
      const text = customMessage
        ? `${customMessage} Risposta: ${challenge.correctDisplay}.`
        : correct
          ? `Missione completata: ${challenge.correctDisplay}.`
          : `Non ancora. La risposta era: ${challenge.correctDisplay}.`;

      setFeedback({ correct, text });
      void persist(nextProgress);
    },
    [challenge, difficulty, feedback, persist, progress],
  );

  useEffect(() => {
    if (!progress || feedback || secondsLeft === null || secondsLeft <= 0) return;

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
  }, [completeMission, feedback, progress, secondsLeft]);

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
    setSyncStatus(result.status);
    setIsLoadingProgress(false);
  }

  function submitTypedAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!typedAnswer.trim()) return;
    completeMission(typedAnswer);
  }

  function nextMission() {
    startMission(mode, difficulty);
  }

  function handleRegionSelect(regionName: string) {
    setSelectedRegion(regionName);
    if (challenge.expectsMapClick) {
      completeMission(regionName);
    }
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

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="title-block">
          <div className="brand-mark small" aria-hidden="true">
            <Map size={24} />
          </div>
          <div>
            <p className="eyebrow">Italia Quest</p>
            <h1>La conquista delle regioni</h1>
          </div>
        </div>
        <div className="status-row">
          <span className={`sync-pill ${syncStatus.kind}`}>
            <Cloud size={16} />
            {syncStatus.label}
          </span>
          <span className="player-pill">Lorenzo</span>
        </div>
      </header>

      <section className="control-band" aria-label="Impostazioni partita">
        <div className="segmented-group">
          <span className="control-label">Difficolta</span>
          <div className="segmented">
            {(Object.keys(DIFFICULTIES) as DifficultyId[]).map((key) => (
              <button
                key={key}
                type="button"
                className={difficulty === key ? 'active' : ''}
                onClick={() => startMission(mode, key)}
                title={DIFFICULTIES[key].description}
              >
                {DIFFICULTIES[key].label}
              </button>
            ))}
          </div>
        </div>
        <div className="segmented-group modes">
          <span className="control-label">Modalita</span>
          <div className="mode-grid">
            {(Object.keys(GAME_MODES) as GameModeId[]).map((key) => (
              <button
                key={key}
                type="button"
                className={mode === key ? 'mode-button active' : 'mode-button'}
                onClick={() => startMission(key, difficulty)}
                title={GAME_MODES[key].description}
              >
                {modeIcon(key)}
                <span>{GAME_MODES[key].label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="game-grid">
        <section className="mission-panel" aria-labelledby="mission-title">
          <div className="mission-topline">
            <span className="mission-mode">{GAME_MODES[mode].iconLabel}</span>
            {secondsLeft !== null ? (
              <span className={secondsLeft <= 6 ? 'timer danger' : 'timer'}>
                <Clock3 size={16} />
                {secondsLeft}s
              </span>
            ) : (
              <span className="timer calm">
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
              <span>Zero suggerimenti: modalita difficile attiva.</span>
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

          <div className="mission-actions">
            <button type="button" className="secondary-action" onClick={nextMission}>
              <RefreshCw size={18} />
              Nuova missione
            </button>
            <span className="points-note">+{difficultySettings.points} punti se corretta</span>
          </div>
        </section>

        <section className="map-panel" aria-label="Mappa">
          <ItalyMap
            targetRegion={difficulty === 'facile' ? challenge.targetRegion : undefined}
            selectedRegion={selectedRegion}
            unlockedRegions={progress.unlockedRegions}
            expectsMapClick={challenge.expectsMapClick}
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
            <Flame size={20} />
            <div>
              <span>Serie</span>
              <strong>{progress.streak}</strong>
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
              <p>{levelInfo.next ? levelInfo.next.goal : 'Italia completata: ora punta al difficile senza errori.'}</p>
            </div>
          ) : null}

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
          <p className="mode-stat">
            Questa modalita: {modeStats?.correct ?? 0}/{modeStats?.played ?? 0} corrette.
          </p>
        </aside>
      </section>
    </main>
  );
}

function modeIcon(mode: GameModeId) {
  const size = 18;
  if (mode === 'mappa') return <Map size={size} />;
  if (mode === 'viaggio') return <Route size={size} />;
  if (mode === 'capoluoghi') return <Crown size={size} />;
  if (mode === 'province') return <MapPin size={size} />;
  if (mode === 'confini') return <Compass size={size} />;
  return <Award size={size} />;
}

export default App;
