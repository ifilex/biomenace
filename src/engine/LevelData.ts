/**
 * @file /src/engine/LevelData.ts
 * Definitions for 6 expansive retro levels inspired by Apogee's Bio Menace.
 * Features increasing difficulty, distinctive themes, hazards, keycards, and enemies.
 */

import { LevelDefinition } from '../types/game';

// Tile Legend:
// 0: Air / Empty
// 1: Solid Metal / Block
// 2: Walkway / Girder
// 3: Pipe / Conduit
// 4: Ladder
// 5: Cyber Terminal / Console
// 6: Toxic Acid / Slime
// 7: Spikes Hazard
// 8: Exit Portal / Elevator

export const WEAPON_DEFINITIONS = {
  blaster: {
    id: 'blaster',
    name: 'Blaster de Plasma',
    damage: 25,
    fireRate: 0.22,
    ammoPerPickup: 100,
    speed: 550,
    color: '#00FFFF',
    description: 'Arma de servicio táctico con munición ilimitada y ráfagas estables.'
  },
  spreader: {
    id: 'spreader',
    name: 'Dispersor Triple',
    damage: 20,
    fireRate: 0.32,
    ammoPerPickup: 40,
    speed: 480,
    color: '#FF7700',
    description: 'Dispara un abanico de 3 proyectiles de fragmentación de alta dispersión.'
  },
  pulse: {
    id: 'pulse',
    name: 'Cañón de Pulso Pesado',
    damage: 65,
    fireRate: 0.45,
    ammoPerPickup: 25,
    speed: 620,
    color: '#9933FF',
    description: 'Haz concentrado capaz de atravesar blindajes y destruir drones pesados.'
  },
  grenade: {
    id: 'grenade',
    name: 'Granadas Bio-Térmicas',
    damage: 130,
    fireRate: 0.7,
    ammoPerPickup: 5,
    speed: 380,
    color: '#39FF14',
    description: 'Carga explosiva con arco parabólico y gran radio de onda expansiva.'
  }
} as const;

// Helper to generate a level grid cleanly
function buildGrid(width: number, height: number, fill: number = 0): number[][] {
  const grid: number[][] = [];
  for (let y = 0; y < height; y++) {
    grid.push(new Array(width).fill(fill));
  }
  return grid;
}

// -------------------------------------------------------------
// LEVEL 1: Metro Outpost - Periferia en Ruinas (Difficulty 1)
// -------------------------------------------------------------
function makeLevel1(): LevelDefinition {
  const w = 45;
  const h = 14;
  const t = buildGrid(w, h, 0);

  // Borders & ground floor
  for (let x = 0; x < w; x++) {
    t[h - 1][x] = 1;
    t[h - 2][x] = 1;
  }
  for (let y = 0; y < h; y++) {
    t[y][0] = 1;
    t[y][w - 1] = 1;
  }

  // Hazard pit at x=14..18
  for (let x = 14; x <= 18; x++) {
    t[h - 2][x] = 7; // spikes
  }

  // Elevated platforms
  for (let x = 6; x <= 12; x++) t[9][x] = 2;
  for (let x = 15; x <= 21; x++) t[7][x] = 2;
  for (let x = 24; x <= 30; x++) t[9][x] = 1;
  for (let x = 33; x <= 40; x++) t[8][x] = 2;

  // Ladder
  for (let y = 7; y <= 11; y++) t[y][22] = 4;

  // Computer console
  t[8][26] = 5;

  // Exit airlock at x=41
  t[11][41] = 8;

  return {
    id: 1,
    name: 'Metro Outpost',
    codeName: 'OPERACIÓN SECTOR 01',
    theme: 'outpost',
    description: 'Infiltra el perímetro urbano en ruinas. Elimina sabuesos mutantes y localiza la tarjeta de acceso roja.',
    width: w,
    height: h,
    tileSize: 32,
    playerStart: { x: 3 * 32, y: 10 * 32 },
    exitPortal: { x: 41 * 32, y: 10 * 32, requiresKey: 'red' },
    tiles: t,
    enemies: [
      { type: 'mutant_hound', x: 10 * 32, y: 11 * 32, patrolRange: 150 },
      { type: 'mutant_hound', x: 27 * 32, y: 8 * 32, patrolRange: 100 },
      { type: 'bio_drone', x: 18 * 32, y: 4 * 32, patrolRange: 120 },
      { type: 'mutant_hound', x: 36 * 32, y: 11 * 32, patrolRange: 180 }
    ],
    pickups: [
      { type: 'ammo_spreader', x: 9 * 32, y: 8 * 32 },
      { type: 'medikit', x: 17 * 32, y: 6 * 32 },
      { type: 'key_red', x: 28 * 32, y: 7 * 32 },
      { type: 'shield_cell', x: 35 * 32, y: 7 * 32 },
      { type: 'bio_disc', x: 8 * 32, y: 11 * 32 }
    ],
    hazards: [
      { x: 14 * 32, y: 12 * 32, width: 5 * 32, height: 32, type: 'spikes', damage: 25, active: true }
    ],
    doors: [
      { x: 39 * 32, y: 10 * 32, width: 32, height: 64, requiredKey: 'red', isOpen: false }
    ],
    checkpoints: [
      { id: 'cp1_1', x: 23 * 32, y: 11 * 32, reached: false }
    ],
    bgmTrack: 'outpost',
    difficultyRating: 1
  };
}

// -------------------------------------------------------------
// LEVEL 2: Laboratorios Bio-Gen (Difficulty 2)
// -------------------------------------------------------------
function makeLevel2(): LevelDefinition {
  const w = 50;
  const h = 15;
  const t = buildGrid(w, h, 0);

  // Outer boundaries
  for (let x = 0; x < w; x++) {
    t[h - 1][x] = 1;
    t[h - 2][x] = 1;
  }
  for (let y = 0; y < h; y++) {
    t[y][0] = 1;
    t[y][w - 1] = 1;
  }

  // Acid vats in floor at x=12..16 and x=28..33
  for (let x = 12; x <= 16; x++) t[h - 2][x] = 6;
  for (let x = 28; x <= 33; x++) t[h - 2][x] = 6;

  // Multi-tier laboratory platforms
  for (let x = 8; x <= 14; x++) t[10][x] = 2;
  for (let x = 15; x <= 22; x++) t[7][x] = 1;
  for (let x = 23; x <= 29; x++) t[10][x] = 2;
  for (let x = 32; x <= 40; x++) t[8][x] = 1;
  for (let x = 36; x <= 45; x++) t[5][x] = 2;

  // Ladders
  for (let y = 7; y <= 12; y++) t[y][15] = 4;
  for (let y = 5; y <= 10; y++) t[y][35] = 4;

  // Pipes overhead
  for (let x = 18; x <= 27; x++) t[3][x] = 3;

  // Terminal & exit
  t[6][20] = 5;
  t[7][38] = 5;
  t[4][46] = 8; // Exit high in lab

  return {
    id: 2,
    name: 'Laboratorios Bio-Gen',
    codeName: 'INVESTIGACIÓN ALFA',
    theme: 'biolab',
    description: 'Instalaciones infectadas con tinas de ácido bio-químico. Esquiva drones aéreos y desbloquea el montacargas.',
    width: w,
    height: h,
    tileSize: 32,
    playerStart: { x: 3 * 32, y: 11 * 32 },
    exitPortal: { x: 46 * 32, y: 3 * 32, requiresKey: 'blue' },
    tiles: t,
    enemies: [
      { type: 'mutant_hound', x: 9 * 32, y: 12 * 32, patrolRange: 120 },
      { type: 'bio_drone', x: 14 * 32, y: 5 * 32, patrolRange: 140 },
      { type: 'bio_drone', x: 26 * 32, y: 4 * 32, patrolRange: 160 },
      { type: 'slime_spitter', x: 20 * 32, y: 6 * 32, patrolRange: 90 },
      { type: 'mutant_hound', x: 36 * 32, y: 12 * 32, patrolRange: 180 },
      { type: 'bio_drone', x: 40 * 32, y: 3 * 32, patrolRange: 150 }
    ],
    pickups: [
      { type: 'ammo_pulse', x: 18 * 32, y: 6 * 32 },
      { type: 'key_blue', x: 25 * 32, y: 9 * 32 },
      { type: 'medikit', x: 37 * 32, y: 7 * 32 },
      { type: 'shield_cell', x: 10 * 32, y: 9 * 32 },
      { type: 'ammo_grenade', x: 42 * 32, y: 4 * 32 }
    ],
    hazards: [
      { x: 12 * 32, y: 13 * 32, width: 5 * 32, height: 32, type: 'acid', damage: 30, active: true },
      { x: 28 * 32, y: 13 * 32, width: 6 * 32, height: 32, type: 'acid', damage: 30, active: true }
    ],
    doors: [
      { x: 44 * 32, y: 3 * 32, width: 32, height: 64, requiredKey: 'blue', isOpen: false }
    ],
    checkpoints: [
      { id: 'cp2_1', x: 24 * 32, y: 9 * 32, reached: false }
    ],
    bgmTrack: 'biolab',
    difficultyRating: 2
  };
}

// -------------------------------------------------------------
// LEVEL 3: Alcantarillas Xenomorfas (Difficulty 3)
// -------------------------------------------------------------
function makeLevel3(): LevelDefinition {
  const w = 52;
  const h = 16;
  const t = buildGrid(w, h, 0);

  // Deep sewer floor
  for (let x = 0; x < w; x++) {
    t[h - 1][x] = 1;
    t[h - 2][x] = 6; // Vast toxic slime on sewer bed
  }
  for (let y = 0; y < h; y++) {
    t[y][0] = 1;
    t[y][w - 1] = 1;
  }
  // Safe starting dock
  t[h - 2][1] = 1;
  t[h - 2][2] = 1;
  t[h - 2][3] = 1;

  // Stepping stone platforms over toxic river
  for (let x = 5; x <= 8; x++) t[12][x] = 2;
  for (let x = 11; x <= 14; x++) t[10][x] = 1;
  for (let x = 17; x <= 22; x++) t[11][x] = 2;
  for (let x = 25; x <= 30; x++) t[8][x] = 1;
  for (let x = 33; x <= 37; x++) t[10][x] = 2;
  for (let x = 40; x <= 45; x++) t[12][x] = 1;
  for (let x = 46; x <= 50; x++) t[11][x] = 1;

  // Sewer drainage pipes
  for (let x = 8; x <= 20; x++) t[4][x] = 3;
  for (let x = 26; x <= 42; x++) t[3][x] = 3;

  // Ladders
  for (let y = 8; y <= 13; y++) t[y][25] = 4;
  for (let y = 4; y <= 8; y++) t[y][30] = 4;

  // Exit
  t[9][49] = 8;

  return {
    id: 3,
    name: 'Alcantarillas Xenomorfas',
    codeName: 'DRENAJE SUBTERRÁNEO',
    theme: 'sewer',
    description: 'Aguas fétidas y escupidores de ácido acechan en la oscuridad. El salto preciso es vital para evitar el lodo mortal.',
    width: w,
    height: h,
    tileSize: 32,
    playerStart: { x: 2 * 32, y: 12 * 32 },
    exitPortal: { x: 49 * 32, y: 8 * 32, requiresKey: 'red' },
    tiles: t,
    enemies: [
      { type: 'slime_spitter', x: 7 * 32, y: 11 * 32, patrolRange: 50 },
      { type: 'slime_spitter', x: 19 * 32, y: 10 * 32, patrolRange: 80 },
      { type: 'mutant_hound', x: 27 * 32, y: 7 * 32, patrolRange: 90 },
      { type: 'bio_drone', x: 35 * 32, y: 6 * 32, patrolRange: 140 },
      { type: 'slime_spitter', x: 42 * 32, y: 11 * 32, patrolRange: 70 }
    ],
    pickups: [
      { type: 'ammo_spreader', x: 12 * 32, y: 9 * 32 },
      { type: 'key_red', x: 29 * 32, y: 7 * 32 },
      { type: 'shield_cell', x: 20 * 32, y: 10 * 32 },
      { type: 'medikit', x: 36 * 32, y: 9 * 32 },
      { type: 'extra_life', x: 13 * 32, y: 3 * 32 }
    ],
    hazards: [
      { x: 4 * 32, y: 14 * 32, width: 45 * 32, height: 32, type: 'acid', damage: 35, active: true }
    ],
    doors: [
      { x: 47 * 32, y: 9 * 32, width: 32, height: 64, requiredKey: 'red', isOpen: false }
    ],
    checkpoints: [
      { id: 'cp3_1', x: 27 * 32, y: 7 * 32, reached: false }
    ],
    bgmTrack: 'sewer',
    difficultyRating: 3
  };
}

// -------------------------------------------------------------
// LEVEL 4: Complejo Cibernético Overdrive (Difficulty 4)
// -------------------------------------------------------------
function makeLevel4(): LevelDefinition {
  const w = 55;
  const h = 15;
  const t = buildGrid(w, h, 0);

  for (let x = 0; x < w; x++) {
    t[h - 1][x] = 1;
    t[h - 2][x] = 1;
  }
  for (let y = 0; y < h; y++) {
    t[y][0] = 1;
    t[y][w - 1] = 1;
  }

  // Laser gaps & electric pits
  for (let x = 16; x <= 19; x++) t[h - 2][x] = 7;
  for (let x = 32; x <= 36; x++) t[h - 2][x] = 7;

  // High-tech metal walkways
  for (let x = 6; x <= 13; x++) t[9][x] = 1;
  for (let x = 15; x <= 22; x++) t[7][x] = 2;
  for (let x = 24; x <= 30; x++) t[10][x] = 1;
  for (let x = 32; x <= 38; x++) t[6][x] = 1;
  for (let x = 41; x <= 48; x++) t[9][x] = 2;

  // Ladders
  for (let y = 7; y <= 12; y++) t[y][14] = 4;
  for (let y = 6; y <= 12; y++) t[y][31] = 4;

  // Terminals
  t[8][9] = 5;
  t[5][34] = 5;

  // Exit
  t[11][51] = 8;

  return {
    id: 4,
    name: 'Complejo Cibernético',
    codeName: 'BÓVEDA OVERDRIVE',
    theme: 'cyber',
    description: 'Armaduras robóticas automatizadas y rayos defensivos de alta energía. Requiere la tarjeta amarilla de seguridad.',
    width: w,
    height: h,
    tileSize: 32,
    playerStart: { x: 3 * 32, y: 11 * 32 },
    exitPortal: { x: 51 * 32, y: 10 * 32, requiresKey: 'yellow' },
    tiles: t,
    enemies: [
      { type: 'cyber_enforcer', x: 10 * 32, y: 7 * 32, patrolRange: 100 },
      { type: 'bio_drone', x: 18 * 32, y: 4 * 32, patrolRange: 150 },
      { type: 'cyber_enforcer', x: 26 * 32, y: 8 * 32, patrolRange: 110 },
      { type: 'cyber_enforcer', x: 35 * 32, y: 4 * 32, patrolRange: 90 },
      { type: 'bio_drone', x: 44 * 32, y: 6 * 32, patrolRange: 140 }
    ],
    pickups: [
      { type: 'ammo_pulse', x: 11 * 32, y: 8 * 32 },
      { type: 'ammo_grenade', x: 18 * 32, y: 6 * 32 },
      { type: 'key_yellow', x: 36 * 32, y: 5 * 32 },
      { type: 'shield_cell', x: 27 * 32, y: 9 * 32 },
      { type: 'medikit', x: 45 * 32, y: 8 * 32 }
    ],
    hazards: [
      { x: 16 * 32, y: 13 * 32, width: 4 * 32, height: 32, type: 'spikes', damage: 30, active: true },
      { x: 32 * 32, y: 13 * 32, width: 5 * 32, height: 32, type: 'spikes', damage: 30, active: true },
      { x: 23 * 32, y: 4 * 32, width: 16, height: 64, type: 'laser_beam', damage: 40, active: true }
    ],
    doors: [
      { x: 49 * 32, y: 11 * 32, width: 32, height: 64, requiredKey: 'yellow', isOpen: false }
    ],
    checkpoints: [
      { id: 'cp4_1', x: 27 * 32, y: 9 * 32, reached: false }
    ],
    bgmTrack: 'cyber',
    difficultyRating: 4
  };
}

// -------------------------------------------------------------
// LEVEL 5: Colmena Mutante Alfa (Difficulty 5)
// -------------------------------------------------------------
function makeLevel5(): LevelDefinition {
  const w = 55;
  const h = 16;
  const t = buildGrid(w, h, 0);

  for (let x = 0; x < w; x++) {
    t[h - 1][x] = 1;
    t[h - 2][x] = 1;
  }
  for (let y = 0; y < h; y++) {
    t[y][0] = 1;
    t[y][w - 1] = 1;
  }

  // Spikes and toxic pools interspersed
  for (let x = 11; x <= 15; x++) t[h - 2][x] = 6;
  for (let x = 25; x <= 29; x++) t[h - 2][x] = 7;
  for (let x = 38; x <= 42; x++) t[h - 2][x] = 6;

  // Organic biomass platforms
  for (let x = 7; x <= 12; x++) t[11][x] = 2;
  for (let x = 14; x <= 20; x++) t[8][x] = 1;
  for (let x = 22; x <= 28; x++) t[11][x] = 2;
  for (let x = 30; x <= 37; x++) t[7][x] = 1;
  for (let x = 40; x <= 47; x++) t[10][x] = 2;

  // Ladders made of bio-tendrils
  for (let y = 8; y <= 13; y++) t[y][13] = 4;
  for (let y = 7; y <= 13; y++) t[y][29] = 4;

  // Exit airlock to the Core
  t[12][51] = 8;

  return {
    id: 5,
    name: 'Colmena Mutante Alfa',
    codeName: 'INFESTACIÓN GÉNESIS',
    theme: 'hive',
    description: 'El corazón biológico de la abominación. Destruye los capullos incubadores antes de entrar al Reactor Omega.',
    width: w,
    height: h,
    tileSize: 32,
    playerStart: { x: 3 * 32, y: 12 * 32 },
    exitPortal: { x: 51 * 32, y: 11 * 32, requiresKey: 'red' },
    tiles: t,
    enemies: [
      { type: 'hive_pod', x: 17 * 32, y: 6 * 32, patrolRange: 0 },
      { type: 'mutant_hound', x: 10 * 32, y: 13 * 32, patrolRange: 140 },
      { type: 'bio_drone', x: 22 * 32, y: 4 * 32, patrolRange: 150 },
      { type: 'slime_spitter', x: 26 * 32, y: 10 * 32, patrolRange: 60 },
      { type: 'hive_pod', x: 34 * 32, y: 5 * 32, patrolRange: 0 },
      { type: 'cyber_enforcer', x: 44 * 32, y: 8 * 32, patrolRange: 90 }
    ],
    pickups: [
      { type: 'ammo_grenade', x: 15 * 32, y: 7 * 32 },
      { type: 'medikit', x: 23 * 32, y: 10 * 32 },
      { type: 'key_red', x: 36 * 32, y: 6 * 32 },
      { type: 'shield_cell', x: 43 * 32, y: 9 * 32 },
      { type: 'extra_life', x: 19 * 32, y: 4 * 32 }
    ],
    hazards: [
      { x: 11 * 32, y: 14 * 32, width: 5 * 32, height: 32, type: 'acid', damage: 35, active: true },
      { x: 25 * 32, y: 14 * 32, width: 5 * 32, height: 32, type: 'spikes', damage: 35, active: true },
      { x: 38 * 32, y: 14 * 32, width: 5 * 32, height: 32, type: 'acid', damage: 35, active: true }
    ],
    doors: [
      { x: 49 * 32, y: 12 * 32, width: 32, height: 64, requiredKey: 'red', isOpen: false }
    ],
    checkpoints: [
      { id: 'cp5_1', x: 31 * 32, y: 6 * 32, reached: false }
    ],
    bgmTrack: 'hive',
    difficultyRating: 5
  };
}

// -------------------------------------------------------------
// LEVEL 6: Reactor Omega - Núcleo Final (Difficulty 6 - BOSS)
// -------------------------------------------------------------
function makeLevel6(): LevelDefinition {
  const w = 50;
  const h = 16;
  const t = buildGrid(w, h, 0);

  // Sturdy arena floor
  for (let x = 0; x < w; x++) {
    t[h - 1][x] = 1;
    t[h - 2][x] = 1;
  }
  for (let y = 0; y < h; y++) {
    t[y][0] = 1;
    t[y][w - 1] = 1;
  }

  // Energy hazard pits on the edges of the boss arena
  for (let x = 5; x <= 8; x++) t[h - 2][x] = 7;
  for (let x = 40; x <= 43; x++) t[h - 2][x] = 7;

  // Combat tiers & platforms for jumping around the boss
  for (let x = 10; x <= 16; x++) t[10][x] = 1;
  for (let x = 18; x <= 26; x++) t[7][x] = 2; // high vantage point
  for (let x = 28; x <= 34; x++) t[10][x] = 1;

  // Ladders to access high tier
  for (let y = 7; y <= 13; y++) t[y][10] = 4;
  for (let y = 7; y <= 13; y++) t[y][34] = 4;

  // Reactor core computer banks
  t[9][13] = 5;
  t[9][31] = 5;

  // Final Victory Evacuation Portal (opens when boss dies)
  t[12][45] = 8;

  return {
    id: 6,
    name: 'Reactor Omega',
    codeName: 'BATALLA FINAL: PROYECTO NÉMESIS',
    theme: 'core',
    description: 'El Titán Bio-Cibernético Omega ha despertado. Utiliza todas tus armas, esquiva sus ráfagas de plasma y salva la Tierra.',
    width: w,
    height: h,
    tileSize: 32,
    playerStart: { x: 4 * 32, y: 12 * 32 },
    exitPortal: { x: 45 * 32, y: 11 * 32 },
    tiles: t,
    enemies: [
      // THE OMEGA TITAN BOSS (Massive health, multi-phase)
      { type: 'omega_boss', x: 26 * 32, y: 9 * 32, patrolRange: 160 },
      { type: 'bio_drone', x: 14 * 32, y: 3 * 32, patrolRange: 180 },
      { type: 'bio_drone', x: 32 * 32, y: 3 * 32, patrolRange: 180 }
    ],
    pickups: [
      { type: 'ammo_pulse', x: 12 * 32, y: 9 * 32 },
      { type: 'ammo_grenade', x: 22 * 32, y: 6 * 32 },
      { type: 'medikit', x: 30 * 32, y: 9 * 32 },
      { type: 'shield_cell', x: 20 * 32, y: 6 * 32 },
      { type: 'extra_life', x: 24 * 32, y: 5 * 32 }
    ],
    hazards: [
      { x: 5 * 32, y: 14 * 32, width: 4 * 32, height: 32, type: 'spikes', damage: 40, active: true },
      { x: 40 * 32, y: 14 * 32, width: 4 * 32, height: 32, type: 'spikes', damage: 40, active: true }
    ],
    doors: [],
    checkpoints: [
      { id: 'cp6_1', x: 8 * 32, y: 13 * 32, reached: false }
    ],
    bgmTrack: 'core',
    difficultyRating: 6
  };
}

export const ALL_LEVELS: Record<number, () => LevelDefinition> = {
  1: makeLevel1,
  2: makeLevel2,
  3: makeLevel3,
  4: makeLevel4,
  5: makeLevel5,
  6: makeLevel6
};

export function getLevel(id: number): LevelDefinition {
  const factory = ALL_LEVELS[id] || ALL_LEVELS[1];
  return factory();
}
