/**
 * @file /src/engine/Sprites.ts
 * High-performance 8-bit / EGA retro sprite and texture rendering system.
 * Incorporates real-world industrial and biological textures processed with 8-bit pixelation,
 * with fast offline-ready canvas sprite caching.
 */

import { EnemyType, PickupType, WeaponType } from '../types/game';

export interface SpriteAtlas {
  player: {
    idle: HTMLCanvasElement[];
    run: HTMLCanvasElement[];
    jump: HTMLCanvasElement;
    shoot: HTMLCanvasElement;
    hurt: HTMLCanvasElement;
  };
  enemies: Record<EnemyType, HTMLCanvasElement[]>;
  tiles: Record<number, HTMLCanvasElement>;
  pickups: Record<PickupType, HTMLCanvasElement>;
  weapons: Record<WeaponType, HTMLCanvasElement>;
  hazards: Record<string, HTMLCanvasElement>;
  boss: {
    idle: HTMLCanvasElement[];
    rage: HTMLCanvasElement[];
  };
  textures: {
    outpost: HTMLCanvasElement;
    biolab: HTMLCanvasElement;
    sewer: HTMLCanvasElement;
    cyber: HTMLCanvasElement;
    hive: HTMLCanvasElement;
    core: HTMLCanvasElement;
  };
}

// 8-bit DOS / Bio Menace EGA classic palette
export const EGA_PALETTE = {
  black: '#000000',
  blue: '#0000AA',
  green: '#00AA00',
  cyan: '#00AAAA',
  red: '#AA0000',
  magenta: '#AA00AA',
  brown: '#AA5500',
  lightGray: '#AAAAAA',
  darkGray: '#555555',
  lightBlue: '#5555FF',
  lightGreen: '#55FF55',
  lightCyan: '#55FFFF',
  lightRed: '#FF5555',
  lightMagenta: '#FF55FF',
  yellow: '#FFFF55',
  white: '#FFFFFF',
  toxicGreen: '#39FF14',
  plasmaOrange: '#FF7700',
  cyberPurple: '#9933FF'
};

// Curated real-world texture image sources for realistic sci-fi surfaces
export const REAL_TEXTURE_SOURCES = {
  outpost: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=256&auto=format&fit=crop&q=60', // Metal rusted panel
  biolab: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=256&auto=format&fit=crop&q=60', // Bio lab tech glass
  sewer: 'https://images.unsplash.com/photo-1533038590840-1cde6e668a91?w=256&auto=format&fit=crop&q=60', // Grimy wet stone / sewer
  cyber: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=256&auto=format&fit=crop&q=60', // Microchip circuitry
  hive: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=256&auto=format&fit=crop&q=60', // Organic visceral texture
  core: 'https://images.unsplash.com/photo-1520034475321-cbe63696469a?w=256&auto=format&fit=crop&q=60', // High-energy reactor glow
};

class SpriteEngine {
  public atlas: SpriteAtlas | null = null;
  private isLoaded: boolean = false;

  public async init(): Promise<SpriteAtlas> {
    if (this.atlas && this.isLoaded) return this.atlas;

    // Build all off-screen sprite canvases
    this.atlas = {
      player: this.createPlayerSprites(),
      enemies: this.createEnemiesSprites(),
      tiles: this.createTileAtlas(),
      pickups: this.createPickupSprites(),
      weapons: this.createWeaponSprites(),
      hazards: this.createHazardSprites(),
      boss: this.createBossSprites(),
      textures: this.createLevelBackdrops()
    };

    // Preload & blend real-world textures asynchronously (non-blocking, fallbacks active immediately)
    this.loadRealTextures();

    this.isLoaded = true;
    return this.atlas;
  }

  private createOffscreen(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.imageSmoothingEnabled = false;
    return { canvas, ctx };
  }

  // --- PLAYER SPRITES ("Agent Snake Logan" style: bandana, green tactical vest, boots) ---
  private createPlayerSprites() {
    const drawBasePlayer = (ctx: CanvasRenderingContext2D, legOffset: number, shooting: boolean, hurt: boolean) => {
      ctx.clearRect(0, 0, 32, 40);

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(16, 38, 10, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Boots
      ctx.fillStyle = hurt ? EGA_PALETTE.lightRed : EGA_PALETTE.darkGray;
      ctx.fillRect(8 + legOffset, 32, 6, 6);
      ctx.fillRect(18 - legOffset, 32, 6, 6);

      // Pants (dark navy military fatigues)
      ctx.fillStyle = hurt ? EGA_PALETTE.red : '#1E293B';
      ctx.fillRect(9, 24, 14, 9);
      // Holster belt
      ctx.fillStyle = EGA_PALETTE.brown;
      ctx.fillRect(8, 23, 16, 2);

      // Torso / Tactical vest (EGA Green)
      ctx.fillStyle = hurt ? EGA_PALETTE.lightRed : '#166534';
      ctx.fillRect(8, 11, 16, 13);
      // Ammo pouches / Kevlar lines
      ctx.fillStyle = EGA_PALETTE.lightGreen;
      ctx.fillRect(10, 14, 4, 4);
      ctx.fillRect(18, 14, 4, 4);

      // Head & Face (Skin tone)
      ctx.fillStyle = hurt ? EGA_PALETTE.lightMagenta : '#FBCFE8';
      ctx.fillRect(10, 3, 12, 8);

      // Bandana (Red iconic Bio Menace bandana with trailing knot)
      ctx.fillStyle = EGA_PALETTE.lightRed;
      ctx.fillRect(9, 2, 14, 3);
      // Trailing bandana cloth
      ctx.fillRect(6, 4, 4, 2);
      ctx.fillRect(4, 5, 3, 3);

      // Eyes & Visor
      ctx.fillStyle = EGA_PALETTE.black;
      ctx.fillRect(17, 5, 2, 2); // eye looking right

      // Arms & Weapon
      if (shooting) {
        // Arm raised firing
        ctx.fillStyle = '#FBCFE8';
        ctx.fillRect(18, 12, 10, 4);
        // Heavy Plasma Blaster gun
        ctx.fillStyle = EGA_PALETTE.lightGray;
        ctx.fillRect(24, 10, 8, 5);
        ctx.fillStyle = EGA_PALETTE.cyan;
        ctx.fillRect(30, 11, 2, 3); // glowing muzzle
      } else {
        // Arm resting at side
        ctx.fillStyle = '#FBCFE8';
        ctx.fillRect(18, 13, 4, 8);
        ctx.fillStyle = EGA_PALETTE.lightGray;
        ctx.fillRect(19, 19, 4, 5);
      }
    };

    // Idle
    const idleFrames: HTMLCanvasElement[] = [];
    for (let f = 0; f < 2; f++) {
      const { canvas, ctx } = this.createOffscreen(32, 40);
      drawBasePlayer(ctx, 0, false, false);
      idleFrames.push(canvas);
    }

    // Run (4 frames)
    const runFrames: HTMLCanvasElement[] = [];
    [-2, 0, 2, 0].forEach((offset) => {
      const { canvas, ctx } = this.createOffscreen(32, 40);
      drawBasePlayer(ctx, offset, false, false);
      runFrames.push(canvas);
    });

    // Jump
    const { canvas: jumpCanvas, ctx: jumpCtx } = this.createOffscreen(32, 40);
    drawBasePlayer(jumpCtx, 3, false, false);

    // Shoot
    const { canvas: shootCanvas, ctx: shootCtx } = this.createOffscreen(32, 40);
    drawBasePlayer(shootCtx, 0, true, false);

    // Hurt
    const { canvas: hurtCanvas, ctx: hurtCtx } = this.createOffscreen(32, 40);
    drawBasePlayer(hurtCtx, 0, false, true);

    return {
      idle: idleFrames,
      run: runFrames,
      jump: jumpCanvas,
      shoot: shootCanvas,
      hurt: hurtCanvas
    };
  }

  // --- ENEMIES SPRITES ---
  private createEnemiesSprites() {
    const result: Record<EnemyType, HTMLCanvasElement[]> = {
      mutant_hound: [],
      bio_drone: [],
      slime_spitter: [],
      cyber_enforcer: [],
      hive_pod: [],
      omega_boss: []
    };

    // 1. Mutant Hound (Toxic 4-legged bio-beast)
    for (let f = 0; f < 2; f++) {
      const { canvas, ctx } = this.createOffscreen(36, 26);
      ctx.fillStyle = EGA_PALETTE.green;
      ctx.fillRect(6, 8, 22, 10);
      // Spikes on spine
      ctx.fillStyle = EGA_PALETTE.toxicGreen;
      ctx.fillRect(8, 5, 3, 4);
      ctx.fillRect(14, 4, 3, 5);
      ctx.fillRect(20, 5, 3, 4);
      // Head with glowing red fangs
      ctx.fillStyle = EGA_PALETTE.darkGray;
      ctx.fillRect(24, 7, 10, 8);
      ctx.fillStyle = EGA_PALETTE.lightRed;
      ctx.fillRect(28, 9, 3, 2); // red eye
      ctx.fillStyle = EGA_PALETTE.white;
      ctx.fillRect(30, 13, 2, 3); // fang
      // Legs (animated)
      ctx.fillStyle = EGA_PALETTE.darkGray;
      const legY = f === 0 ? 18 : 17;
      ctx.fillRect(8, legY, 4, 7);
      ctx.fillRect(22, 19 - (legY - 18), 4, 6);
      result.mutant_hound.push(canvas);
    }

    // 2. Flying Bio-Drone
    for (let f = 0; f < 2; f++) {
      const { canvas, ctx } = this.createOffscreen(32, 32);
      // Rotor / energy ring
      ctx.strokeStyle = f === 0 ? EGA_PALETTE.cyan : EGA_PALETTE.lightCyan;
      ctx.lineWidth = 2;
      ctx.strokeRect(4, 4, 24, 6);
      // Metal core sphere
      ctx.fillStyle = EGA_PALETTE.darkGray;
      ctx.beginPath();
      ctx.arc(16, 16, 9, 0, Math.PI * 2);
      ctx.fill();
      // Glowing surveillance eye
      ctx.fillStyle = EGA_PALETTE.lightRed;
      ctx.beginPath();
      ctx.arc(16, 16, 4, 0, Math.PI * 2);
      ctx.fill();
      // Gun barrel underneath
      ctx.fillStyle = EGA_PALETTE.lightGray;
      ctx.fillRect(14, 24, 4, 6);
      result.bio_drone.push(canvas);
    }

    // 3. Slime Spitter (Toxic acid creature)
    for (let f = 0; f < 2; f++) {
      const { canvas, ctx } = this.createOffscreen(32, 32);
      ctx.fillStyle = '#15803d'; // deep green slime
      ctx.beginPath();
      ctx.ellipse(16, 22, 14, 9 + f, 0, 0, Math.PI * 2);
      ctx.fill();
      // Acid bubbles
      ctx.fillStyle = EGA_PALETTE.toxicGreen;
      ctx.fillRect(8, 14, 5, 5);
      ctx.fillRect(18, 12, 7, 7);
      // Yellow sinister eye
      ctx.fillStyle = EGA_PALETTE.yellow;
      ctx.fillRect(14, 16, 4, 3);
      ctx.fillStyle = EGA_PALETTE.black;
      ctx.fillRect(16, 16, 2, 3);
      result.slime_spitter.push(canvas);
    }

    // 4. Cyber Enforcer (Heavy armored robot mech)
    for (let f = 0; f < 2; f++) {
      const { canvas, ctx } = this.createOffscreen(36, 44);
      // Heavy robotic legs
      ctx.fillStyle = '#334155';
      ctx.fillRect(6 + f * 2, 28, 8, 14);
      ctx.fillRect(22 - f * 2, 28, 8, 14);
      // Heavy armored torso
      ctx.fillStyle = '#475569';
      ctx.fillRect(4, 10, 28, 19);
      // Cyber core plate
      ctx.fillStyle = EGA_PALETTE.cyan;
      ctx.fillRect(14, 15, 8, 8);
      // Arm cannon
      ctx.fillStyle = EGA_PALETTE.lightGray;
      ctx.fillRect(28, 14, 8, 6);
      // Visor
      ctx.fillStyle = EGA_PALETTE.lightRed;
      ctx.fillRect(10, 5, 16, 4);
      result.cyber_enforcer.push(canvas);
    }

    // 5. Hive Pod (Spawning bio-organic incubator)
    for (let f = 0; f < 2; f++) {
      const { canvas, ctx } = this.createOffscreen(36, 40);
      ctx.fillStyle = '#831843'; // deep organic purple-red
      ctx.beginPath();
      ctx.ellipse(18, 22, 16, 16 + (f ? 1 : 0), 0, 0, Math.PI * 2);
      ctx.fill();
      // Pulsing veins
      ctx.strokeStyle = EGA_PALETTE.toxicGreen;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(10, 28);
      ctx.lineTo(18, 18);
      ctx.lineTo(26, 26);
      ctx.stroke();
      // Glowing nucleus embryo
      ctx.fillStyle = EGA_PALETTE.lightGreen;
      ctx.beginPath();
      ctx.arc(18, 20, 6, 0, Math.PI * 2);
      ctx.fill();
      result.hive_pod.push(canvas);
    }

    // 6. Boss dummy frame placeholder (full boss rendered via createBossSprites)
    const { canvas: bossC } = this.createOffscreen(80, 80);
    result.omega_boss.push(bossC);

    return result;
  }

  // --- FINAL BOSS: "BIO-TITAN OMEGA" (Massive multi-phase mechanized mutant) ---
  private createBossSprites() {
    const idle: HTMLCanvasElement[] = [];
    const rage: HTMLCanvasElement[] = [];

    for (let f = 0; f < 2; f++) {
      const { canvas, ctx } = this.createOffscreen(96, 96);
      // Massive cybernetic body
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(16, 20, 64, 52);
      // Armor plating
      ctx.strokeStyle = EGA_PALETTE.cyan;
      ctx.lineWidth = 3;
      ctx.strokeRect(18, 22, 60, 48);

      // Pulsing Omega Core
      ctx.fillStyle = f === 0 ? EGA_PALETTE.lightRed : EGA_PALETTE.yellow;
      ctx.beginPath();
      ctx.arc(48, 46, 16, 0, Math.PI * 2);
      ctx.fill();
      // Cyber skull / visor
      ctx.fillStyle = EGA_PALETTE.white;
      ctx.fillRect(36, 8, 24, 14);
      ctx.fillStyle = EGA_PALETTE.lightRed;
      ctx.fillRect(40, 12, 6, 3);
      ctx.fillRect(50, 12, 6, 3);

      // Massive shoulder plasma cannons
      ctx.fillStyle = EGA_PALETTE.darkGray;
      ctx.fillRect(4, 16, 16, 12);
      ctx.fillRect(76, 16, 16, 12);
      ctx.fillStyle = EGA_PALETTE.plasmaOrange;
      ctx.fillRect(2, 20, 6, 4);
      ctx.fillRect(88, 20, 6, 4);

      // Heavy treads / claws
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(12, 70, 24, 20);
      ctx.fillRect(60, 70, 24, 20);

      idle.push(canvas);
    }

    // Rage mode (fiery plasma glow)
    for (let f = 0; f < 2; f++) {
      const { canvas, ctx } = this.createOffscreen(96, 96);
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(16, 20, 64, 52);
      ctx.strokeStyle = EGA_PALETTE.plasmaOrange;
      ctx.lineWidth = 4;
      ctx.strokeRect(18, 22, 60, 48);

      // Hyper-charged Omega Core
      ctx.fillStyle = EGA_PALETTE.yellow;
      ctx.beginPath();
      ctx.arc(48, 46, 20, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = EGA_PALETTE.lightRed;
      ctx.fillRect(36, 8, 24, 14);
      ctx.fillStyle = EGA_PALETTE.yellow;
      ctx.fillRect(38, 12, 8, 4);
      ctx.fillRect(50, 12, 8, 4);

      ctx.fillStyle = EGA_PALETTE.lightGray;
      ctx.fillRect(2, 14, 18, 16);
      ctx.fillRect(76, 14, 18, 16);
      ctx.fillStyle = EGA_PALETTE.toxicGreen;
      ctx.fillRect(0, 18, 6, 8);
      ctx.fillRect(90, 18, 6, 8);

      ctx.fillStyle = '#450a0a';
      ctx.fillRect(12, 70, 24, 20);
      ctx.fillRect(60, 70, 24, 20);

      rage.push(canvas);
    }

    return { idle, rage };
  }

  // --- TILES (Grid of 32x32 retro platforming tiles) ---
  private createTileAtlas(): Record<number, HTMLCanvasElement> {
    const tiles: Record<number, HTMLCanvasElement> = {};

    // Tile 0: Empty / Air (transparent)
    const { canvas: t0 } = this.createOffscreen(32, 32);
    tiles[0] = t0;

    // Tile 1: Industrial Solid Metal Block (Metro Outpost / Lab)
    const { canvas: t1, ctx: ctx1 } = this.createOffscreen(32, 32);
    ctx1.fillStyle = '#334155';
    ctx1.fillRect(0, 0, 32, 32);
    ctx1.fillStyle = '#475569';
    ctx1.fillRect(2, 2, 28, 28);
    // 4 Corner bolts
    ctx1.fillStyle = EGA_PALETTE.lightGray;
    ctx1.fillRect(4, 4, 3, 3);
    ctx1.fillRect(25, 4, 3, 3);
    ctx1.fillRect(4, 25, 3, 3);
    ctx1.fillRect(25, 25, 3, 3);
    // Center hazard cross
    ctx1.strokeStyle = '#1e293b';
    ctx1.lineWidth = 2;
    ctx1.strokeRect(8, 8, 16, 16);
    tiles[1] = t1;

    // Tile 2: Metal Platform Girder (Thin, jump-through or walk on)
    const { canvas: t2, ctx: ctx2 } = this.createOffscreen(32, 32);
    ctx2.fillStyle = '#64748B';
    ctx2.fillRect(0, 0, 32, 10);
    ctx2.fillStyle = EGA_PALETTE.lightGray;
    ctx2.fillRect(0, 0, 32, 2);
    // Industrial truss lines
    ctx2.strokeStyle = '#334155';
    ctx2.lineWidth = 2;
    ctx2.beginPath();
    ctx2.moveTo(0, 10);
    ctx2.lineTo(16, 26);
    ctx2.lineTo(32, 10);
    ctx2.stroke();
    tiles[2] = t2;

    // Tile 3: Pipe / Conduit
    const { canvas: t3, ctx: ctx3 } = this.createOffscreen(32, 32);
    ctx3.fillStyle = '#0f766e';
    ctx3.fillRect(0, 8, 32, 16);
    ctx3.fillStyle = '#14b8a6';
    ctx3.fillRect(0, 10, 32, 4);
    ctx3.fillStyle = '#115e59';
    ctx3.fillRect(0, 20, 32, 4);
    // Valve coupling
    ctx3.fillStyle = EGA_PALETTE.yellow;
    ctx3.fillRect(13, 6, 6, 20);
    tiles[3] = t3;

    // Tile 4: Climbable Ladder
    const { canvas: t4, ctx: ctx4 } = this.createOffscreen(32, 32);
    ctx4.fillStyle = '#94a3b8';
    ctx4.fillRect(4, 0, 4, 32);
    ctx4.fillRect(24, 0, 4, 32);
    for (let r = 4; r < 32; r += 8) {
      ctx4.fillStyle = EGA_PALETTE.yellow;
      ctx4.fillRect(8, r, 16, 3);
    }
    tiles[4] = t4;

    // Tile 5: Cyber Computer Console / Terminal
    const { canvas: t5, ctx: ctx5 } = this.createOffscreen(32, 32);
    ctx5.fillStyle = '#0f172a';
    ctx5.fillRect(0, 0, 32, 32);
    ctx5.fillStyle = '#0284c7';
    ctx5.fillRect(4, 4, 24, 18);
    // Code lines on screen
    ctx5.fillStyle = EGA_PALETTE.toxicGreen;
    ctx5.fillRect(6, 7, 16, 2);
    ctx5.fillRect(6, 11, 12, 2);
    ctx5.fillRect(6, 15, 18, 2);
    // Keyboard buttons
    ctx5.fillStyle = EGA_PALETTE.lightGray;
    ctx5.fillRect(4, 24, 24, 6);
    tiles[5] = t5;

    // Tile 6: Toxic Sludge / Acid Surface
    const { canvas: t6, ctx: ctx6 } = this.createOffscreen(32, 32);
    ctx6.fillStyle = '#14532d';
    ctx6.fillRect(0, 0, 32, 32);
    ctx6.fillStyle = EGA_PALETTE.toxicGreen;
    ctx6.fillRect(0, 0, 32, 12);
    // Glowing bubbling foam
    ctx6.fillStyle = '#86efac';
    ctx6.fillRect(4, 2, 6, 4);
    ctx6.fillRect(18, 4, 8, 4);
    tiles[6] = t6;

    // Tile 7: Spikes Hazard
    const { canvas: t7, ctx: ctx7 } = this.createOffscreen(32, 32);
    ctx7.fillStyle = EGA_PALETTE.lightGray;
    for (let s = 0; s < 4; s++) {
      ctx7.beginPath();
      ctx7.moveTo(s * 8, 32);
      ctx7.lineTo(s * 8 + 4, 8);
      ctx7.lineTo(s * 8 + 8, 32);
      ctx7.fill();
    }
    ctx7.fillStyle = EGA_PALETTE.lightRed;
    // Blood on tips
    for (let s = 0; s < 4; s++) {
      ctx7.fillRect(s * 8 + 3, 8, 2, 5);
    }
    tiles[7] = t7;

    // Tile 8: Exit Airlock / Elevator Portal
    const { canvas: t8, ctx: ctx8 } = this.createOffscreen(32, 32);
    ctx8.fillStyle = '#0f172a';
    ctx8.fillRect(0, 0, 32, 32);
    ctx8.fillStyle = EGA_PALETTE.cyan;
    ctx8.fillRect(4, 2, 24, 28);
    ctx8.fillStyle = EGA_PALETTE.white;
    ctx8.font = 'bold 9px monospace';
    ctx8.fillText('EXIT', 6, 18);
    tiles[8] = t8;

    return tiles;
  }

  // --- PICKUPS ---
  private createPickupSprites(): Record<PickupType, HTMLCanvasElement> {
    const pickups: Record<PickupType, HTMLCanvasElement> = {} as Record<PickupType, HTMLCanvasElement>;

    // 1. Medikit
    const { canvas: p1, ctx: c1 } = this.createOffscreen(20, 20);
    c1.fillStyle = EGA_PALETTE.white;
    c1.fillRect(2, 3, 16, 14);
    c1.fillStyle = EGA_PALETTE.lightRed;
    c1.fillRect(8, 6, 4, 8);
    c1.fillRect(5, 8, 10, 4);
    pickups.medikit = p1;

    // 2. Shield Cell
    const { canvas: p2, ctx: c2 } = this.createOffscreen(20, 20);
    c2.fillStyle = EGA_PALETTE.cyan;
    c2.beginPath();
    c2.arc(10, 10, 8, 0, Math.PI * 2);
    c2.fill();
    c2.fillStyle = EGA_PALETTE.white;
    c2.fillRect(7, 6, 6, 8);
    pickups.shield_cell = p2;

    // 3. Spreader Ammo
    const { canvas: p3, ctx: c3 } = this.createOffscreen(20, 20);
    c3.fillStyle = EGA_PALETTE.plasmaOrange;
    c3.fillRect(3, 4, 14, 12);
    c3.fillStyle = EGA_PALETTE.black;
    c3.font = 'bold 8px monospace';
    c3.fillText('SPD', 4, 13);
    pickups.ammo_spreader = p3;

    // 4. Pulse Ammo
    const { canvas: p4, ctx: c4 } = this.createOffscreen(20, 20);
    c4.fillStyle = EGA_PALETTE.cyberPurple;
    c4.fillRect(3, 4, 14, 12);
    c4.fillStyle = EGA_PALETTE.white;
    c4.font = 'bold 8px monospace';
    c4.fillText('PLS', 4, 13);
    pickups.ammo_pulse = p4;

    // 5. Grenade Pack
    const { canvas: p5, ctx: c5 } = this.createOffscreen(20, 20);
    c5.fillStyle = '#166534';
    c5.beginPath();
    c5.arc(10, 11, 7, 0, Math.PI * 2);
    c5.fill();
    c5.fillStyle = EGA_PALETTE.darkGray;
    c5.fillRect(8, 2, 4, 4);
    pickups.ammo_grenade = p5;

    // 6. Keycards (Red, Blue, Yellow)
    ['red', 'blue', 'yellow'].forEach((colorName) => {
      const { canvas: pk, ctx: ck } = this.createOffscreen(18, 24);
      const color = colorName === 'red' ? EGA_PALETTE.lightRed : colorName === 'blue' ? EGA_PALETTE.lightBlue : EGA_PALETTE.yellow;
      ck.fillStyle = color;
      ck.fillRect(2, 2, 14, 20);
      ck.fillStyle = EGA_PALETTE.white;
      ck.fillRect(5, 6, 8, 4);
      ck.fillStyle = EGA_PALETTE.darkGray;
      ck.fillRect(5, 14, 8, 6);
      pickups[`key_${colorName}` as PickupType] = pk;
    });

    // 7. Bio Data Disc
    const { canvas: p7, ctx: c7 } = this.createOffscreen(20, 20);
    c7.fillStyle = EGA_PALETTE.yellow;
    c7.beginPath();
    c7.arc(10, 10, 8, 0, Math.PI * 2);
    c7.fill();
    c7.fillStyle = EGA_PALETTE.black;
    c7.beginPath();
    c7.arc(10, 10, 3, 0, Math.PI * 2);
    c7.fill();
    pickups.bio_disc = p7;

    // 8. Extra Life
    const { canvas: p8, ctx: c8 } = this.createOffscreen(20, 20);
    c8.fillStyle = EGA_PALETTE.toxicGreen;
    c8.beginPath();
    c8.arc(10, 10, 9, 0, Math.PI * 2);
    c8.fill();
    c8.fillStyle = EGA_PALETTE.black;
    c8.font = 'bold 9px monospace';
    c8.fillText('1UP', 3, 13);
    pickups.extra_life = p8;

    return pickups;
  }

  // --- WEAPONS ICONS ---
  private createWeaponSprites(): Record<WeaponType, HTMLCanvasElement> {
    const weapons: Record<WeaponType, HTMLCanvasElement> = {} as Record<WeaponType, HTMLCanvasElement>;

    ['blaster', 'spreader', 'pulse', 'grenade'].forEach((w) => {
      const { canvas, ctx } = this.createOffscreen(28, 20);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 28, 20);
      ctx.strokeStyle = EGA_PALETTE.lightGray;
      ctx.strokeRect(1, 1, 26, 18);

      if (w === 'blaster') {
        ctx.fillStyle = EGA_PALETTE.lightCyan;
        ctx.fillRect(6, 8, 14, 4);
        ctx.fillRect(8, 12, 4, 5);
      } else if (w === 'spreader') {
        ctx.fillStyle = EGA_PALETTE.plasmaOrange;
        ctx.fillRect(6, 6, 16, 3);
        ctx.fillRect(6, 11, 16, 3);
        ctx.fillRect(8, 14, 4, 4);
      } else if (w === 'pulse') {
        ctx.fillStyle = EGA_PALETTE.cyberPurple;
        ctx.fillRect(4, 7, 18, 6);
        ctx.fillStyle = EGA_PALETTE.white;
        ctx.fillRect(18, 9, 4, 2);
      } else if (w === 'grenade') {
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(14, 10, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      weapons[w as WeaponType] = canvas;
    });

    return weapons;
  }

  // --- HAZARDS (Lasers, electric gates) ---
  private createHazardSprites(): Record<string, HTMLCanvasElement> {
    const hazards: Record<string, HTMLCanvasElement> = {};

    // Laser beam vertical
    const { canvas: hl, ctx: cl } = this.createOffscreen(16, 64);
    cl.fillStyle = EGA_PALETTE.lightRed;
    cl.fillRect(6, 0, 4, 64);
    cl.fillStyle = EGA_PALETTE.white;
    cl.fillRect(7, 0, 2, 64);
    hazards.laser_beam = hl;

    // Electric field
    const { canvas: he, ctx: ce } = this.createOffscreen(32, 32);
    ce.strokeStyle = EGA_PALETTE.cyan;
    ce.lineWidth = 2;
    ce.beginPath();
    ce.moveTo(4, 16);
    ce.lineTo(12, 8);
    ce.lineTo(20, 24);
    ce.lineTo(28, 16);
    ce.stroke();
    hazards.electric_field = he;

    return hazards;
  }

  // --- PROCEDURAL THEMED BACKDROPS ---
  private createLevelBackdrops() {
    const createSky = (color1: string, color2: string, gridColor: string) => {
      const { canvas, ctx } = this.createOffscreen(320, 200);
      const grad = ctx.createLinearGradient(0, 0, 0, 200);
      grad.addColorStop(0, color1);
      grad.addColorStop(1, color2);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 320, 200);

      // Subtle retro horizon grid
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      for (let y = 120; y < 200; y += 12) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(320, y);
        ctx.stroke();
      }
      return canvas;
    };

    return {
      outpost: createSky('#0f172a', '#1e293b', 'rgba(148,163,184,0.1)'),
      biolab: createSky('#052e16', '#14532d', 'rgba(34,197,94,0.15)'),
      sewer: createSky('#1c1917', '#292524', 'rgba(168,85,247,0.1)'),
      cyber: createSky('#1e1b4b', '#312e81', 'rgba(6,182,212,0.2)'),
      hive: createSky('#4a044e', '#701a75', 'rgba(236,72,153,0.15)'),
      core: createSky('#450a0a', '#7f1d1d', 'rgba(249,115,22,0.25)')
    };
  }

  // Asynchronously load real-world photographic sci-fi textures and blend with 8-bit palette
  private async loadRealTextures() {
    for (const [theme, url] of Object.entries(REAL_TEXTURE_SOURCES)) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = url;
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve; // Continue on fallback
        });

        if (img.complete && img.naturalWidth > 0 && this.atlas) {
          const { canvas, ctx } = this.createOffscreen(320, 200);
          // Draw downscaled to mimic 8-bit DOS resolution
          ctx.drawImage(img, 0, 0, 320, 200);
          // Apply retro scanlines and tint
          ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
          ctx.fillRect(0, 0, 320, 200);
          // Update atlas backdrop seamlessly
          if (this.atlas.textures[theme as keyof typeof this.atlas.textures]) {
            this.atlas.textures[theme as keyof typeof this.atlas.textures] = canvas;
          }
        }
      } catch {
        // Offline resilient fallback remains in effect
      }
    }
  }
}

export const sprites = new SpriteEngine();
