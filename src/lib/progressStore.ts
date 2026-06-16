import type { GameModeId, GameProgress, SyncStatus } from '../types';
import { createDefaultProgress, PLAYER_NAME } from './game';
import { isSupabaseConfigured, supabase } from './supabase';

const LOCAL_KEY = 'italia-quest-progress-lorenzo';
const TABLE_NAME = 'game_progress';

type ProgressRow = {
  player_name: 'Lorenzo';
  progress: GameProgress;
  updated_at: string;
};

export type LoadProgressResult = {
  progress: GameProgress;
  status: SyncStatus;
};

function readLocalProgress() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return null;
    return normalizeProgress(JSON.parse(raw) as Partial<GameProgress>);
  } catch {
    return null;
  }
}

function writeLocalProgress(progress: GameProgress) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(progress));
}

function normalizeProgress(progress: Partial<GameProgress>): GameProgress {
  const fallback = createDefaultProgress();
  const modeCoverage = { ...fallback.modeCoverage };
  (Object.keys(fallback.modeCoverage) as GameModeId[]).forEach((mode) => {
    modeCoverage[mode] = {
      ...fallback.modeCoverage[mode],
      ...(progress.modeCoverage?.[mode] ?? {}),
    };
  });

  return {
    ...fallback,
    ...progress,
    playerName: PLAYER_NAME,
    modeStats: {
      ...fallback.modeStats,
      ...(progress.modeStats ?? {}),
    },
    difficultyStats: {
      ...fallback.difficultyStats,
      ...(progress.difficultyStats ?? {}),
    },
    modeCoverage,
    mistakes: progress.mistakes ?? {},
    unlockedRegions: progress.unlockedRegions ?? [],
    badges: progress.badges ?? [],
    memory: progress.memory ?? {},
    newCardsToday: progress.newCardsToday ?? 0,
    newCardsDate: progress.newCardsDate ?? fallback.newCardsDate,
    reviewBox: progress.reviewBox ?? [],
    updatedAt: progress.updatedAt ?? new Date().toISOString(),
  };
}

function newerProgress(localProgress: GameProgress | null, cloudProgress: GameProgress | null) {
  if (!localProgress && !cloudProgress) return createDefaultProgress();
  if (!localProgress) return cloudProgress!;
  if (!cloudProgress) return localProgress;

  return new Date(localProgress.updatedAt).getTime() > new Date(cloudProgress.updatedAt).getTime()
    ? localProgress
    : cloudProgress;
}

export async function loadProgress(): Promise<LoadProgressResult> {
  const localProgress = readLocalProgress();

  if (!isSupabaseConfigured || !supabase) {
    const progress = localProgress ?? createDefaultProgress();
    writeLocalProgress(progress);
    return {
      progress,
      status: {
        kind: 'local',
        label: 'Locale',
        detail: 'Supabase non e configurato: i progressi restano su questo dispositivo.',
      },
    };
  }

  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('player_name, progress, updated_at')
      .eq('player_name', PLAYER_NAME)
      .maybeSingle();

    if (error) throw error;

    const row = data as ProgressRow | null;
    const cloudProgress = row?.progress ? normalizeProgress(row.progress) : null;
    const progress = newerProgress(localProgress, cloudProgress);

    writeLocalProgress(progress);

    if (!cloudProgress || progress.updatedAt !== cloudProgress.updatedAt) {
      await saveProgress(progress);
    }

    return {
      progress,
      status: {
        kind: 'cloud',
        label: 'Supabase',
        detail: 'Progressi sincronizzati tra dispositivi.',
      },
    };
  } catch (error) {
    const progress = localProgress ?? createDefaultProgress();
    writeLocalProgress(progress);
    return {
      progress,
      status: {
        kind: 'error',
        label: 'Locale',
        detail: error instanceof Error ? error.message : 'Sincronizzazione Supabase non disponibile.',
      },
    };
  }
}

export async function saveProgress(progress: GameProgress): Promise<SyncStatus> {
  const normalized = normalizeProgress(progress);
  writeLocalProgress(normalized);

  if (!isSupabaseConfigured || !supabase) {
    return {
      kind: 'local',
      label: 'Locale',
      detail: 'Salvato sul dispositivo. Configura Supabase per sincronizzare PC e telefono.',
    };
  }

  try {
    const { error } = await supabase.from(TABLE_NAME).upsert({
      player_name: PLAYER_NAME,
      progress: normalized,
      updated_at: normalized.updatedAt,
    });

    if (error) throw error;

    return {
      kind: 'cloud',
      label: 'Supabase',
      detail: 'Salvataggio cloud completato.',
    };
  } catch (error) {
    return {
      kind: 'error',
      label: 'Locale',
      detail: error instanceof Error ? error.message : 'Salvataggio cloud non riuscito.',
    };
  }
}

export async function refreshCloudProgress(current: GameProgress): Promise<LoadProgressResult> {
  const loaded = await loadProgress();
  const progress = newerProgress(current, loaded.progress);
  if (progress.updatedAt !== loaded.progress.updatedAt) {
    await saveProgress(progress);
  }
  return {
    progress,
    status: loaded.status,
  };
}
