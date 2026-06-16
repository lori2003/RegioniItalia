export type DifficultyId = 'facile' | 'medio' | 'difficile';

export type GameModeId =
  | 'mappa'
  | 'capoluoghi'
  | 'province'
  | 'confini'
  | 'viaggio'
  | 'cultura';

export type ProvinceType =
  | 'provincia'
  | 'provincia-autonoma'
  | 'citta-metropolitana'
  | 'libero-consorzio'
  | 'uts-statistica';

export type ProvinceUnit = {
  name: string;
  code: string;
  type: ProvinceType;
};

export type RegionData = {
  id: string;
  name: string;
  shortName: string;
  capital: string;
  area: 'Nord-Ovest' | 'Nord-Est' | 'Centro' | 'Sud' | 'Isole';
  provinces: ProvinceUnit[];
  borders: string[];
  nearby?: string[];
  majorCities: string[];
  hints: string[];
  mnemonic: string;
  cultureClue: string;
  aliases?: string[];
};

export type Challenge = {
  id: string;
  mode: GameModeId;
  prompt: string;
  targetRegion: string;
  correctDisplay: string;
  acceptedAnswers: string[];
  options: string[];
  hints: string[];
  expectsMapClick: boolean;
};

export type MissionStats = {
  played: number;
  correct: number;
};

export type ModeCoverage = {
  seenRegions: string[];
};

export type SessionKind = 'ripasso' | 'libero' | 'errori';

export type MasteryLevel = 'new' | 'learning' | 'young' | 'mature' | 'mastered';

export type MemoryCard = {
  box: number;
  due: string;
  reps: number;
  lapses: number;
  lastReviewed: string | null;
};

export type GameProgress = {
  playerName: 'Lorenzo';
  score: number;
  xp: number;
  correctAnswers: number;
  wrongAnswers: number;
  completedMissions: number;
  streak: number;
  bestStreak: number;
  unlockedRegions: string[];
  badges: string[];
  mistakes: Record<string, number>;
  modeStats: Record<GameModeId, MissionStats>;
  difficultyStats: Record<DifficultyId, MissionStats>;
  modeCoverage: Record<GameModeId, ModeCoverage>;
  memory: Record<string, MemoryCard>;
  newCardsToday: number;
  newCardsDate: string;
  reviewBox: string[];
  updatedAt: string;
};

export type SyncStatus = {
  kind: 'idle' | 'syncing' | 'cloud' | 'local' | 'error';
  label: string;
  detail?: string;
};
