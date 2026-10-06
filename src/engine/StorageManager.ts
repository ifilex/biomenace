/**
 * @file /src/engine/StorageManager.ts
 * Robust Local Persistence & Autosave Engine between game maps and checkpoints.
 * 100% Offline-capable with fallback in-memory caching.
 */

import { GameSaveData, GameSettings, WeaponType } from '../types/game';

const SAVE_KEY = 'biomenace_8bit_autosave_v1';
const SETTINGS_KEY = 'biomenace_8bit_settings_v1';

export const DEFAULT_SETTINGS: GameSettings = {
  musicVolume: 0.6,
  sfxVolume: 0.7,
  crtFilter: true,
  showTouchControls: true,
  autoBreathingPrompt: true,
  pushNotificationsEnabled: true,
  rumbleEnabled: true
};

export const DEFAULT_SAVE_DATA: GameSaveData = {
  currentLevel: 1,
  score: 0,
  lives: 3,
  health: 100,
  maxHealth: 100,
  shield: 50,
  ammo: {
    blaster: 999,
    spreader: 60,
    pulse: 30,
    grenade: 5
  },
  grenades: 5,
  unlockedLevels: [1],
  highestScore: 0,
  timestamp: Date.now(),
  neuroStatsSummary: {
    avgReactionMs: 275,
    avgFocus: 85,
    anxietyEventsCount: 0
  }
};

export class StorageManager {
  private memSave: GameSaveData = { ...DEFAULT_SAVE_DATA };
  private memSettings: GameSettings = { ...DEFAULT_SETTINGS };

  constructor() {
    this.loadSettings();
    this.loadSave();
  }

  // Save game automatically between maps or at checkpoints
  public autoSaveGame(data: Partial<GameSaveData>): GameSaveData {
    const current = this.loadSave();
    const updated: GameSaveData = {
      ...current,
      ...data,
      unlockedLevels: Array.from(new Set([...current.unlockedLevels, ...(data.unlockedLevels || [data.currentLevel || current.currentLevel])])).sort((a, b) => a - b),
      highestScore: Math.max(current.highestScore, data.score || current.score),
      timestamp: Date.now()
    };

    this.memSave = updated;

    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage unavailable, using in-memory store:', e);
    }

    return updated;
  }

  public loadSave(): GameSaveData {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.memSave = { ...DEFAULT_SAVE_DATA, ...parsed };
        return this.memSave;
      }
    } catch {}
    return this.memSave;
  }

  public resetSave(): GameSaveData {
    this.memSave = { ...DEFAULT_SAVE_DATA };
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {}
    return this.memSave;
  }

  public saveSettings(settings: Partial<GameSettings>): GameSettings {
    const current = this.loadSettings();
    const updated = { ...current, ...settings };
    this.memSettings = updated;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    } catch {}
    return updated;
  }

  public loadSettings(): GameSettings {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        this.memSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
        return this.memSettings;
      }
    } catch {}
    return this.memSettings;
  }
}

export const storage = new StorageManager();
