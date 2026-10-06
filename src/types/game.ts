/**
 * @file /src/types/game.ts
 * Core types, interfaces, and state structures for the Bio-Menace 8-Bit Retro Game Engine.
 */

export type WeaponType = 'blaster' | 'spreader' | 'pulse' | 'grenade';

export interface WeaponDef {
  id: WeaponType;
  name: string;
  damage: number;
  fireRate: number; // in seconds
  ammoPerPickup: number;
  speed: number;
  color: string;
  description: string;
}

export type EnemyType = 
  | 'mutant_hound'
  | 'bio_drone'
  | 'slime_spitter'
  | 'cyber_enforcer'
  | 'hive_pod'
  | 'omega_boss';

export interface Entity {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  isGrounded: boolean;
  facing: 'left' | 'right';
}

export interface Player extends Entity {
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  lives: number;
  score: number;
  currentWeapon: WeaponType;
  ammo: Record<WeaponType, number>;
  grenades: number;
  keys: {
    red: boolean;
    blue: boolean;
    yellow: boolean;
  };
  isInvulnerable: boolean;
  invulnerableTimer: number;
  isShooting: boolean;
  shootCooldown: number;
  isDashing: boolean;
  dashTimer: number;
  dashCooldown: number;
  animFrame: number;
  animTimer: number;
  onLadder: boolean;
}

export interface Enemy extends Entity {
  type: EnemyType;
  health: number;
  maxHealth: number;
  damage: number;
  scoreValue: number;
  shootTimer: number;
  aiState: 'patrol' | 'chase' | 'attack' | 'retreat';
  patrolMinX: number;
  patrolMaxX: number;
  animFrame: number;
  animTimer: number;
  phase?: number; // for boss
  bossRage?: boolean;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  isEnemy: boolean;
  weaponType?: WeaponType;
  lifetime: number;
  color: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
  gravity?: number;
}

export type PickupType = 
  | 'medikit'
  | 'shield_cell'
  | 'ammo_spreader'
  | 'ammo_pulse'
  | 'ammo_grenade'
  | 'key_red'
  | 'key_blue'
  | 'key_yellow'
  | 'bio_disc'
  | 'extra_life';

export interface Pickup {
  id: string;
  x: number;
  y: number;
  type: PickupType;
  collected: boolean;
  animOffset: number;
}

export interface Hazard {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'acid' | 'spikes' | 'laser_beam' | 'electric_field';
  damage: number;
  active: boolean;
  cycleTimer?: number;
}

export interface LevelDefinition {
  id: number;
  name: string;
  codeName: string;
  theme: 'outpost' | 'biolab' | 'sewer' | 'cyber' | 'hive' | 'core';
  description: string;
  width: number; // in tiles
  height: number; // in tiles
  tileSize: number; // default 32
  playerStart: { x: number; y: number };
  exitPortal: { x: number; y: number; requiresKey?: 'red' | 'blue' | 'yellow' };
  tiles: number[][]; // 2D array of tile indices
  enemies: Array<{ type: EnemyType; x: number; y: number; patrolRange?: number }>;
  pickups: Array<{ type: PickupType; x: number; y: number }>;
  hazards: Hazard[];
  doors: Array<{ x: number; y: number; width: number; height: number; requiredKey: 'red' | 'blue' | 'yellow'; isOpen: boolean }>;
  checkpoints: Array<{ id: string; x: number; y: number; reached: boolean }>;
  bgmTrack: string;
  difficultyRating: number; // 1 to 6
}

export interface NeuroCognitiveMetrics {
  reactionTimeMs: number;
  recentReactionTimes: number[];
  inputJitterFreq: number; // panic mashing detection (inputs per second)
  hazardCollisions: number;
  spatialOrientationScore: number; // 0 - 100%
  focusScore: number; // 0 - 100%
  stressLevel: number; // 0 - 100%
  anxietyDetected: boolean;
  evaluatedSamples: number;
  calmnessHistory: number[]; // last 30 intervals
  cognitiveLoadCategory: 'CALMO' | 'ENFOCADO' | 'ALERTA' | 'ESTRÉS ELEVADO';
  estimatedBpm: number;
}

export interface GameSaveData {
  currentLevel: number;
  score: number;
  lives: number;
  health: number;
  maxHealth: number;
  shield: number;
  ammo: Record<WeaponType, number>;
  grenades: number;
  unlockedLevels: number[];
  highestScore: number;
  timestamp: number;
  neuroStatsSummary: {
    avgReactionMs: number;
    avgFocus: number;
    anxietyEventsCount: number;
  };
}

export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  crtFilter: boolean;
  showTouchControls: boolean;
  autoBreathingPrompt: boolean;
  pushNotificationsEnabled: boolean;
  rumbleEnabled: boolean;
}

export interface InGameNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'achievement' | 'warning' | 'calm' | 'item';
  durationMs: number;
  timestamp: number;
}
