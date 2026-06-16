import { allProvinceNames, REGIONS } from '../data/regions';
import type { Challenge, DifficultyId, GameModeId, GameProgress, ModeCoverage, RegionData } from '../types';

export const PLAYER_NAME = 'Lorenzo' as const;

export const DIFFICULTIES: Record<
  DifficultyId,
  {
    label: string;
    description: string;
    hints: number;
    optionCount: number;
    timeLimit: number | null;
    points: number;
  }
> = {
  facile: {
    label: 'Facile',
    description: 'Tanti suggerimenti, scelte guidate e nessun timer.',
    hints: 2,
    optionCount: 4,
    timeLimit: null,
    points: 10,
  },
  medio: {
    label: 'Medio',
    description: 'Un solo indizio, scelta multipla e timer morbido.',
    hints: 1,
    optionCount: 4,
    timeLimit: 35,
    points: 22,
  },
  difficile: {
    label: 'Difficile',
    description: 'Zero suggerimenti, risposta libera e tempo stretto.',
    hints: 0,
    optionCount: 0,
    timeLimit: 18,
    points: 45,
  },
};

export const GAME_MODES: Record<
  GameModeId,
  { label: string; iconLabel: string; description: string }
> = {
  mappa: {
    label: 'Mappa cieca',
    iconLabel: 'Mappa',
    description: 'Trova la regione giusta cliccando sulla mappa.',
  },
  capoluoghi: {
    label: 'Capoluoghi',
    iconLabel: 'Capitale',
    description: 'Collega regione e capoluogo regionale.',
  },
  province: {
    label: 'Province',
    iconLabel: 'Province',
    description: 'Riconosci province, citta metropolitane e unita territoriali.',
  },
  confini: {
    label: 'Confini',
    iconLabel: 'Confini',
    description: 'Ricostruisci chi tocca chi sulla carta italiana.',
  },
  viaggio: {
    label: 'Viaggio',
    iconLabel: 'Treno',
    description: 'Ragiona sui percorsi tra citta e regioni.',
  },
  cultura: {
    label: 'Indizi',
    iconLabel: 'Indizi',
    description: 'Indovina la regione da segnali culturali e geografici.',
  },
};

const JOURNEYS = [
  {
    from: 'Torino',
    to: 'Bari',
    route: ['Piemonte', 'Lombardia', 'Emilia-Romagna', 'Marche', 'Abruzzo', 'Molise', 'Puglia'],
  },
  {
    from: 'Milano',
    to: 'Napoli',
    route: ['Lombardia', 'Emilia-Romagna', 'Toscana', 'Lazio', 'Campania'],
  },
  {
    from: 'Venezia',
    to: 'Trieste',
    route: ['Veneto', 'Friuli-Venezia Giulia'],
  },
  {
    from: 'Firenze',
    to: 'Palermo',
    route: ['Toscana', 'Lazio', 'Campania', 'Calabria', 'Sicilia'],
  },
  {
    from: 'Genova',
    to: 'Pisa',
    route: ['Liguria', 'Toscana'],
  },
  {
    from: 'Cagliari',
    to: 'Sassari',
    route: ['Sardegna'],
  },
];

export const BADGES = [
  { id: 'primo-territorio', label: 'Primo territorio', requirement: 'Sblocca 1 regione.' },
  { id: 'mano-sicura', label: 'Mano sicura', requirement: 'Fai 5 risposte corrette di fila.' },
  { id: 'cartografo-5', label: 'Cartografo 5', requirement: 'Sblocca 5 regioni.' },
  { id: 'mezza-italia', label: 'Mezza Italia', requirement: 'Sblocca 10 regioni.' },
  { id: 'isole-sbloccate', label: 'Rotta delle isole', requirement: 'Sblocca Sicilia e Sardegna.' },
  { id: 'italia-completa', label: 'Italia completa', requirement: 'Sblocca tutte le regioni.' },
];

export const LEVELS = [
  { number: 1, title: 'Esploratore', threshold: 0, goal: 'Riconosci le regioni principali.' },
  { number: 2, title: 'Cartografo', threshold: 4, goal: 'Posiziona regioni e aree geografiche.' },
  { number: 3, title: 'Ambasciatore', threshold: 8, goal: 'Consolida i capoluoghi.' },
  { number: 4, title: 'Maestro dei confini', threshold: 12, goal: 'Memorizza le regioni confinanti.' },
  { number: 5, title: 'Archivista', threshold: 16, goal: 'Aggiungi province e citta metropolitane.' },
  { number: 6, title: 'Grande viaggiatore', threshold: 20, goal: 'Completa l’Italia senza aiuti.' },
];

export function createEmptyStats<T extends string>(keys: T[]): Record<T, { played: number; correct: number }> {
  return keys.reduce(
    (acc, key) => ({
      ...acc,
      [key]: { played: 0, correct: 0 },
    }),
    {} as Record<T, { played: number; correct: number }>,
  );
}

export function createEmptyCoverage<T extends string>(keys: T[]): Record<T, ModeCoverage> {
  return keys.reduce(
    (acc, key) => ({
      ...acc,
      [key]: { seenRegions: [] },
    }),
    {} as Record<T, ModeCoverage>,
  );
}

export function createDefaultProgress(): GameProgress {
  return {
    playerName: PLAYER_NAME,
    score: 0,
    xp: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    completedMissions: 0,
    streak: 0,
    bestStreak: 0,
    unlockedRegions: [],
    badges: [],
    mistakes: {},
    modeStats: createEmptyStats(Object.keys(GAME_MODES) as GameModeId[]),
    difficultyStats: createEmptyStats(Object.keys(DIFFICULTIES) as DifficultyId[]),
    modeCoverage: createEmptyCoverage(Object.keys(GAME_MODES) as GameModeId[]),
    updatedAt: new Date().toISOString(),
  };
}

export function normalizeAnswer(value: string) {
  return value
    .toLocaleLowerCase('it-IT')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function randomItem<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function unique(items: string[]) {
  return [...new Set(items)];
}

function getJourneySteps() {
  return JOURNEYS.flatMap((journey) => {
    if (journey.route.length <= 1) {
      return [
        {
          journey,
          current: journey.route[0],
          next: journey.route[0],
        },
      ];
    }

    return journey.route.slice(0, -1).map((current, index) => ({
      journey,
      current,
      next: journey.route[index + 1],
    }));
  });
}

export function getModeCoverageTargets(mode: GameModeId) {
  if (mode === 'viaggio') {
    return unique(getJourneySteps().map((step) => step.next));
  }

  return REGIONS.map((region) => region.name);
}

function getSeenRegions(progress: GameProgress, mode: GameModeId) {
  const validTargets = new Set(getModeCoverageTargets(mode));
  return unique(progress.modeCoverage[mode]?.seenRegions ?? []).filter((regionName) => validTargets.has(regionName));
}

function pickRegionForMode(mode: GameModeId, progress?: GameProgress) {
  const targets = getModeCoverageTargets(mode);
  const seen = progress ? new Set(getSeenRegions(progress, mode)) : new Set<string>();
  const unseenTargets = targets.filter((target) => !seen.has(target));
  const targetName = randomItem(unseenTargets.length > 0 ? unseenTargets : targets);
  return getRegion(targetName) ?? randomItem(REGIONS);
}

function pickJourneyStep(progress?: GameProgress) {
  const steps = getJourneySteps();
  const seen = progress ? new Set(getSeenRegions(progress, 'viaggio')) : new Set<string>();
  const unseenSteps = steps.filter((step) => !seen.has(step.next));
  return randomItem(unseenSteps.length > 0 ? unseenSteps : steps);
}

function optionsWith(correct: string, pool: string[], count: number) {
  if (count === 0) return [];
  const wrong = shuffle(pool.filter((item) => normalizeAnswer(item) !== normalizeAnswer(correct)));
  return shuffle(unique([correct, ...wrong]).slice(0, count));
}

function acceptedRegionAnswers(region: RegionData) {
  return unique([region.name, region.shortName, ...(region.aliases ?? [])]);
}

function createChallengeId() {
  const cryptoApi = globalThis.crypto;

  if (typeof cryptoApi?.randomUUID === 'function') {
    return cryptoApi.randomUUID();
  }

  if (typeof cryptoApi?.getRandomValues === 'function') {
    const bytes = cryptoApi.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0'));
    return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex
      .slice(8, 10)
      .join('')}-${hex.slice(10).join('')}`;
  }

  return `challenge-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getRegion(name: string) {
  const normalized = normalizeAnswer(name);
  return REGIONS.find((region) =>
    acceptedRegionAnswers(region).some((answer) => normalizeAnswer(answer) === normalized),
  );
}

export function createChallenge(mode: GameModeId, difficulty: DifficultyId, progress?: GameProgress): Challenge {
  const region = pickRegionForMode(mode, progress);
  const settings = DIFFICULTIES[difficulty];
  const optionCount = settings.optionCount;
  const baseHints = region.hints.slice(0, settings.hints);

  if (mode === 'mappa') {
    return {
      id: createChallengeId(),
      mode,
      prompt: `Trova ${region.shortName} sulla mappa.`,
      targetRegion: region.name,
      correctDisplay: region.shortName,
      acceptedAnswers: acceptedRegionAnswers(region),
      options: [],
      hints: baseHints,
      expectsMapClick: true,
    };
  }

  if (mode === 'capoluoghi') {
    const reverse = Math.random() > 0.55;
    return {
      id: createChallengeId(),
      mode,
      prompt: reverse
        ? `${region.capital} e il capoluogo di quale regione?`
        : `Qual e il capoluogo di ${region.shortName}?`,
      targetRegion: region.name,
      correctDisplay: reverse ? region.shortName : region.capital,
      acceptedAnswers: reverse ? acceptedRegionAnswers(region) : [region.capital],
      options: reverse
        ? optionsWith(region.shortName, REGIONS.map((item) => item.shortName), optionCount)
        : optionsWith(region.capital, REGIONS.map((item) => item.capital), optionCount),
      hints: baseHints,
      expectsMapClick: false,
    };
  }

  if (mode === 'province') {
    const province = randomItem(region.provinces);
    const hardAnswers = region.provinces.flatMap((item) => [item.name, item.code]);
    return {
      id: createChallengeId(),
      mode,
      prompt:
        optionCount > 0
          ? `Quale unita territoriale appartiene a ${region.shortName}?`
          : `Scrivi una provincia, citta metropolitana o unita territoriale di ${region.shortName}.`,
      targetRegion: region.name,
      correctDisplay: optionCount > 0 ? province.name : region.provinces.map((item) => item.name).join(', '),
      acceptedAnswers: optionCount > 0 ? [province.name, province.code] : hardAnswers,
      options: optionsWith(province.name, allProvinceNames, optionCount),
      hints: [
        ...baseHints,
        `Citta principali: ${region.majorCities.slice(0, 3).join(', ')}.`,
      ].slice(0, settings.hints),
      expectsMapClick: false,
    };
  }

  if (mode === 'confini') {
    const hasBorders = region.borders.length > 0;
    const border = hasBorders ? randomItem(region.borders) : 'Nessuna';
    return {
      id: createChallengeId(),
      mode,
      prompt: hasBorders
        ? `Quale regione confina con ${region.shortName}?`
        : `${region.shortName} ha confini terrestri con altre regioni?`,
      targetRegion: region.name,
      correctDisplay: border,
      acceptedAnswers: hasBorders ? region.borders : ['nessuna', 'nessuna regione', 'no'],
      options: hasBorders
        ? optionsWith(border, REGIONS.map((item) => item.name), optionCount)
        : optionsWith('Nessuna', REGIONS.map((item) => item.shortName), optionCount),
      hints: baseHints,
      expectsMapClick: false,
    };
  }

  if (mode === 'viaggio') {
    const step = pickJourneyStep(progress);
    const journey = step.journey;
    const current = step.current;
    const next = step.next;
    return {
      id: createChallengeId(),
      mode,
      prompt:
        journey.route.length > 1
          ? `Viaggio ${journey.from} -> ${journey.to}: quale regione viene subito dopo ${current}?`
          : `Viaggio ${journey.from} -> ${journey.to}: in quale regione resti per tutto il tragitto?`,
      targetRegion: next,
      correctDisplay: next,
      acceptedAnswers: acceptedRegionAnswers(getRegion(next) ?? region),
      options: optionsWith(next, REGIONS.map((item) => item.shortName), optionCount),
      hints: [`Percorso: ${journey.route.join(' -> ')}.`].slice(0, settings.hints),
      expectsMapClick: false,
    };
  }

  return {
    id: createChallengeId(),
    mode,
    prompt: `Indizio esplorazione: ${region.cultureClue}`,
    targetRegion: region.name,
    correctDisplay: region.shortName,
    acceptedAnswers: acceptedRegionAnswers(region),
    options: optionsWith(region.shortName, REGIONS.map((item) => item.shortName), optionCount),
    hints: baseHints,
    expectsMapClick: false,
  };
}

export function isAnswerCorrect(answer: string, challenge: Challenge) {
  const normalized = normalizeAnswer(answer);
  return challenge.acceptedAnswers.some((accepted) => normalizeAnswer(accepted) === normalized);
}

export function getLevelInfo(progress: GameProgress) {
  const unlocked = progress.unlockedRegions.length;
  const current = LEVELS.reduce((best, level) => (unlocked >= level.threshold ? level : best), LEVELS[0]);
  const next = LEVELS.find((level) => level.threshold > unlocked);
  return {
    current,
    next,
    percent: next ? Math.min(100, Math.round((unlocked / next.threshold) * 100)) : 100,
  };
}

export function getModeCoverageInfo(progress: GameProgress, mode: GameModeId) {
  const targets = getModeCoverageTargets(mode);
  const seenRegions = getSeenRegions(progress, mode);
  const missingRegions = targets.filter((target) => !seenRegions.includes(target));

  return {
    unitLabel: mode === 'viaggio' ? 'tappe' : 'regioni',
    seenRegions,
    missingRegions,
    seenCount: seenRegions.length,
    remainingCount: missingRegions.length,
    total: targets.length,
    percent: targets.length > 0 ? Math.round((seenRegions.length / targets.length) * 100) : 0,
  };
}

export function resetModeCoverage(progress: GameProgress, mode: GameModeId) {
  const next: GameProgress = structuredClone(progress);
  next.modeCoverage = {
    ...createEmptyCoverage(Object.keys(GAME_MODES) as GameModeId[]),
    ...(next.modeCoverage ?? {}),
    [mode]: { seenRegions: [] },
  };
  next.updatedAt = new Date().toISOString();
  return next;
}

export function applyMissionResult(
  progress: GameProgress,
  challenge: Challenge,
  difficulty: DifficultyId,
  correct: boolean,
) {
  const next: GameProgress = structuredClone(progress);
  const modeStat = next.modeStats[challenge.mode] ?? { played: 0, correct: 0 };
  const difficultyStat = next.difficultyStats[difficulty] ?? { played: 0, correct: 0 };

  modeStat.played += 1;
  difficultyStat.played += 1;
  next.completedMissions += 1;

  const modeTargets = new Set(getModeCoverageTargets(challenge.mode));
  const modeCoverage = next.modeCoverage[challenge.mode] ?? { seenRegions: [] };
  if (modeTargets.has(challenge.targetRegion) && !modeCoverage.seenRegions.includes(challenge.targetRegion)) {
    modeCoverage.seenRegions.push(challenge.targetRegion);
  }

  if (correct) {
    const points = DIFFICULTIES[difficulty].points;
    next.score += points;
    next.xp += points;
    next.correctAnswers += 1;
    next.streak += 1;
    next.bestStreak = Math.max(next.bestStreak, next.streak);
    modeStat.correct += 1;
    difficultyStat.correct += 1;

    if (!next.unlockedRegions.includes(challenge.targetRegion)) {
      next.unlockedRegions.push(challenge.targetRegion);
    }
  } else {
    next.wrongAnswers += 1;
    next.streak = 0;
    next.mistakes[challenge.correctDisplay] = (next.mistakes[challenge.correctDisplay] ?? 0) + 1;
  }

  next.modeStats[challenge.mode] = modeStat;
  next.difficultyStats[difficulty] = difficultyStat;
  next.modeCoverage[challenge.mode] = modeCoverage;
  next.badges = computeBadges(next);
  next.updatedAt = new Date().toISOString();
  return next;
}

export function computeBadges(progress: GameProgress) {
  const unlocked = new Set(progress.unlockedRegions);
  const next = new Set(progress.badges);

  if (unlocked.size >= 1) next.add('primo-territorio');
  if (progress.bestStreak >= 5) next.add('mano-sicura');
  if (unlocked.size >= 5) next.add('cartografo-5');
  if (unlocked.size >= 10) next.add('mezza-italia');
  if (unlocked.has('Sicilia') && unlocked.has('Sardegna')) next.add('isole-sbloccate');
  if (unlocked.size >= REGIONS.length) next.add('italia-completa');

  return [...next];
}
