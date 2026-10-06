/**
 * @file /src/engine/GameEngine.ts
 * Core 2D Platformer Engine with fluid physics, enemy AI state machines,
 * weapon mechanics, particle systems, camera tracking, and autosaving.
 */

import {
  Enemy,
  EnemyType,
  Hazard,
  LevelDefinition,
  Particle,
  Pickup,
  Player,
  Projectile,
  WeaponType
} from '../types/game';
import { sound } from './AudioEngine';
import { input } from './InputManager';
import { getLevel, WEAPON_DEFINITIONS } from './LevelData';
import { neuro } from './NeuroCognitive';
import { notify } from './NotificationSystem';
import { EGA_PALETTE, sprites } from './Sprites';
import { storage } from './StorageManager';

export class GameEngine {
  public canvas: HTMLCanvasElement | null = null;
  public ctx: CanvasRenderingContext2D | null = null;

  // State
  public isRunning: boolean = false;
  public isPaused: boolean = false;
  public currentLevelId: number = 1;
  public level: LevelDefinition | null = null;

  public player!: Player;
  public enemies: Enemy[] = [];
  public projectiles: Projectile[] = [];
  public particles: Particle[] = [];
  public pickups: Pickup[] = [];
  public hazards: Hazard[] = [];

  // Camera
  public camera = {
    x: 0,
    y: 0,
    width: 640,
    height: 380,
    shake: 0
  };

  // Timing
  private lastTime: number = performance.now();
  private rafId: number | null = null;

  // Boss & Event states
  public bossDefeated: boolean = false;
  public levelCleared: boolean = false;
  public gameOver: boolean = false;
  public gameVictory: boolean = false;

  // Callbacks for React UI updates
  private onStateChange: (() => void) | null = null;

  public init(canvas: HTMLCanvasElement, onStateChange?: () => void) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.onStateChange = onStateChange || null;

    // Load saved progression or default
    const save = storage.loadSave();
    this.currentLevelId = save.currentLevel || 1;

    this.setupLevel(this.currentLevelId);
  }

  public setupLevel(levelId: number, preservePlayerStats: boolean = true) {
    this.currentLevelId = levelId;
    this.level = getLevel(levelId);
    this.bossDefeated = false;
    this.levelCleared = false;
    this.gameOver = false;
    this.gameVictory = false;

    // Save progression
    storage.autoSaveGame({
      currentLevel: levelId,
      unlockedLevels: [levelId]
    });

    notify.push(
      `Nivel ${levelId}: ${this.level.name}`,
      this.level.description,
      'info',
      4500
    );

    // Initialize player
    const save = storage.loadSave();
    this.player = {
      id: 'player',
      x: this.level.playerStart.x,
      y: this.level.playerStart.y,
      width: 24,
      height: 36,
      vx: 0,
      vy: 0,
      isGrounded: false,
      facing: 'right',
      health: preservePlayerStats && save.health > 0 ? save.health : 100,
      maxHealth: 100,
      shield: preservePlayerStats ? save.shield : 50,
      maxShield: 50,
      lives: preservePlayerStats && save.lives > 0 ? save.lives : 3,
      score: preservePlayerStats ? save.score : 0,
      currentWeapon: 'blaster',
      ammo: {
        blaster: 999,
        spreader: preservePlayerStats ? save.ammo.spreader : 50,
        pulse: preservePlayerStats ? save.ammo.pulse : 25,
        grenade: preservePlayerStats ? save.ammo.grenade : 5
      },
      grenades: preservePlayerStats ? save.grenades : 5,
      keys: {
        red: false,
        blue: false,
        yellow: false
      },
      isInvulnerable: false,
      invulnerableTimer: 0,
      isShooting: false,
      shootCooldown: 0,
      isDashing: false,
      dashTimer: 0,
      dashCooldown: 0,
      animFrame: 0,
      animTimer: 0,
      onLadder: false
    };

    // Initialize enemies
    this.enemies = this.level.enemies.map((e, idx) => {
      const isBoss = e.type === 'omega_boss';
      return {
        id: `enemy_${idx}`,
        x: e.x,
        y: e.y,
        width: isBoss ? 64 : e.type === 'cyber_enforcer' ? 32 : 28,
        height: isBoss ? 64 : e.type === 'cyber_enforcer' ? 40 : 26,
        vx: 0,
        vy: 0,
        isGrounded: false,
        facing: 'left',
        type: e.type,
        health: isBoss ? 600 : e.type === 'cyber_enforcer' ? 120 : e.type === 'hive_pod' ? 80 : 40,
        maxHealth: isBoss ? 600 : e.type === 'cyber_enforcer' ? 120 : e.type === 'hive_pod' ? 80 : 40,
        damage: isBoss ? 30 : e.type === 'cyber_enforcer' ? 25 : 15,
        scoreValue: isBoss ? 5000 : e.type === 'cyber_enforcer' ? 350 : 150,
        shootTimer: Math.random() * 2,
        aiState: 'patrol',
        patrolMinX: e.x - (e.patrolRange || 100),
        patrolMaxX: e.x + (e.patrolRange || 100),
        animFrame: 0,
        animTimer: 0,
        phase: 1,
        bossRage: false
      };
    });

    // Pickups & Hazards
    this.pickups = this.level.pickups.map((p, idx) => ({
      id: `pickup_${idx}`,
      x: p.x,
      y: p.y,
      type: p.type,
      collected: false,
      animOffset: Math.random() * Math.PI * 2
    }));

    this.hazards = [...this.level.hazards];
    this.projectiles = [];
    this.particles = [];

    // Start level soundtrack
    sound.startMusic(this.level.bgmTrack);
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    this.loop();
  }

  public stop() {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    sound.stopMusic();
  }

  public togglePause(): boolean {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      sound.stopMusic();
    } else {
      if (this.level) sound.startMusic(this.level.bgmTrack);
      this.lastTime = performance.now();
    }
    return this.isPaused;
  }

  // Main 60fps render & physics loop
  private loop = () => {
    if (!this.isRunning) return;

    const now = performance.now();
    let dt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    // Cap delta time to prevent physics tunneling
    if (dt > 0.05) dt = 0.05;

    if (!this.isPaused) {
      this.update(dt);
    }
    this.render();

    this.rafId = requestAnimationFrame(this.loop);
  };

  // ==========================================
  // PHYSICS & GAME LOGIC UPDATE
  // ==========================================

  private update(dt: number) {
    if (!this.level || !this.player) return;

    // 1. Update Input manager
    input.update();

    // Check pause key
    if (input.state.pause) {
      this.togglePause();
      this.onStateChange?.();
      return;
    }

    if (this.gameOver || this.levelCleared || this.gameVictory) {
      // Let particles fly
      this.updateParticles(dt);
      return;
    }

    // 2. Weapon switching
    if (input.state.nextWeapon) {
      this.cycleWeapon(1);
    } else if (input.state.prevWeapon) {
      this.cycleWeapon(-1);
    }

    // 3. Update Player Physics & Actions
    this.updatePlayer(dt);

    // 4. Update Projectiles
    this.updateProjectiles(dt);

    // 5. Update Enemies AI
    this.updateEnemies(dt);

    // 6. Update Pickups & Hazards
    this.updatePickups(dt);
    this.updateHazards(dt);

    // 7. Update Particles
    this.updateParticles(dt);

    // 8. Update Camera
    this.updateCamera(dt);

    // 9. Update Real-Time Neuro-Cognitive Evaluation Engine
    const nearbyEnemiesCount = this.enemies.filter(
      (e) => Math.hypot(e.x - this.player.x, e.y - this.player.y) < 220
    ).length;
    neuro.update(
      dt,
      input.currentEntropyHz,
      this.player.health / this.player.maxHealth,
      nearbyEnemiesCount
    );

    // 10. Check Exit Portal
    this.checkExitPortal();

    // Periodic UI sync
    this.onStateChange?.();
  }

  private cycleWeapon(dir: number) {
    const list: WeaponType[] = ['blaster', 'spreader', 'pulse', 'grenade'];
    let idx = list.indexOf(this.player.currentWeapon);
    idx = (idx + dir + list.length) % list.length;
    this.player.currentWeapon = list[idx];
    sound.playPickup();
    notify.push(
      'Arma Equipada',
      WEAPON_DEFINITIONS[this.player.currentWeapon].name,
      'item',
      2000
    );
  }

  private updatePlayer(dt: number) {
    const p = this.player;
    const tileSize = 32;

    // Dash mechanic
    if (p.dashCooldown > 0) p.dashCooldown -= dt;
    if (p.dashTimer > 0) {
      p.dashTimer -= dt;
      p.vx = (p.facing === 'right' ? 1 : -1) * 450;
      this.emitParticles(p.x + p.width / 2, p.y + p.height / 2, EGA_PALETTE.cyan, 2);
    } else {
      // Horizontal movement
      const moveSpeed = 200;
      if (input.state.left) {
        p.vx = -moveSpeed;
        p.facing = 'left';
      } else if (input.state.right) {
        p.vx = moveSpeed;
        p.facing = 'right';
      } else {
        p.vx *= 0.7; // friction
        if (Math.abs(p.vx) < 5) p.vx = 0;
      }
    }

    // Trigger dash
    if (input.state.dashPressed && p.dashCooldown <= 0 && p.dashTimer <= 0) {
      p.dashTimer = 0.18;
      p.dashCooldown = 0.8;
      sound.playJump();
      input.vibrate(80, 0.4, 0.4);
      neuro.registerPlayerAction();
    }

    // Ladder check
    const centerTileX = Math.floor((p.x + p.width / 2) / tileSize);
    const centerTileY = Math.floor((p.y + p.height / 2) / tileSize);
    const tileUnder = this.getTile(centerTileX, centerTileY);

    if (tileUnder === 4) { // Ladder
      if (input.state.up) {
        p.vy = -160;
        p.onLadder = true;
      } else if (input.state.down) {
        p.vy = 160;
        p.onLadder = true;
      } else if (p.onLadder) {
        p.vy = 0;
      }
    } else {
      p.onLadder = false;
    }

    // Gravity
    if (!p.onLadder) {
      p.vy += 900 * dt;
      if (p.vy > 650) p.vy = 650;
    }

    // Jump
    if (input.state.jumpPressed && (p.isGrounded || p.onLadder)) {
      p.vy = -420;
      p.isGrounded = false;
      p.onLadder = false;
      sound.playJump();
      input.vibrate(60, 0.3, 0.3);
      neuro.registerPlayerAction();
      this.emitParticles(p.x + p.width / 2, p.y + p.height, EGA_PALETTE.lightGray, 4);
    }

    // Horizontal tile collision
    p.x += p.vx * dt;
    this.resolveHorizontalCollisions(p);

    // Vertical tile collision
    p.y += p.vy * dt;
    p.isGrounded = false;
    this.resolveVerticalCollisions(p);

    // Shooting
    if (p.shootCooldown > 0) p.shootCooldown -= dt;
    if (input.state.shoot && p.shootCooldown <= 0) {
      this.fireWeapon(p.currentWeapon);
    }

    // Grenade throw
    if (input.state.grenadePressed && p.grenades > 0) {
      this.fireWeapon('grenade');
      p.grenades--;
      neuro.registerPlayerAction();
    }

    // Invulnerability timer
    if (p.isInvulnerable) {
      p.invulnerableTimer -= dt;
      if (p.invulnerableTimer <= 0) {
        p.isInvulnerable = false;
      }
    }

    // Animation frame timing
    p.animTimer += dt;
    if (p.animTimer > 0.12) {
      p.animTimer = 0;
      p.animFrame = (p.animFrame + 1) % 4;
    }

    // Fall out of bounds check
    if (p.y > (this.level.height + 2) * tileSize) {
      this.playerHurt(100); // death
    }
  }

  private fireWeapon(wType: WeaponType) {
    const p = this.player;
    const def = WEAPON_DEFINITIONS[wType];

    // Check ammo
    if (wType !== 'blaster' && p.ammo[wType] <= 0) {
      sound.playHurt();
      notify.push('Sin Munición', `¡Necesitas munición para ${def.name}!`, 'warning', 1500);
      return;
    }

    if (wType !== 'blaster') {
      p.ammo[wType]--;
    }

    p.shootCooldown = def.fireRate;
    p.isShooting = true;
    setTimeout(() => {
      if (this.player) this.player.isShooting = false;
    }, 120);

    const muzzleX = p.facing === 'right' ? p.x + p.width + 4 : p.x - 4;
    const muzzleY = p.y + 14;
    const dir = p.facing === 'right' ? 1 : -1;

    sound.playBlaster(wType);
    input.vibrate(40, 0.2, 0.2);
    neuro.registerPlayerAction();

    // Muzzle flash particle
    this.emitParticles(muzzleX, muzzleY, def.color, 3);

    if (wType === 'blaster') {
      this.projectiles.push({
        id: `p_${Math.random()}`,
        x: muzzleX,
        y: muzzleY,
        vx: dir * def.speed,
        vy: 0,
        radius: 4,
        damage: def.damage,
        isEnemy: false,
        weaponType: wType,
        lifetime: 1.5,
        color: def.color
      });
    } else if (wType === 'spreader') {
      // 3 bullets spread
      [-0.15, 0, 0.15].forEach((angle) => {
        this.projectiles.push({
          id: `p_${Math.random()}`,
          x: muzzleX,
          y: muzzleY,
          vx: Math.cos(angle) * dir * def.speed,
          vy: Math.sin(angle) * def.speed,
          radius: 4,
          damage: def.damage,
          isEnemy: false,
          weaponType: wType,
          lifetime: 1.2,
          color: def.color
        });
      });
    } else if (wType === 'pulse') {
      this.projectiles.push({
        id: `p_${Math.random()}`,
        x: muzzleX,
        y: muzzleY,
        vx: dir * def.speed,
        vy: 0,
        radius: 7,
        damage: def.damage,
        isEnemy: false,
        weaponType: wType,
        lifetime: 1.8,
        color: def.color
      });
    } else if (wType === 'grenade') {
      this.projectiles.push({
        id: `p_${Math.random()}`,
        x: muzzleX,
        y: muzzleY - 4,
        vx: dir * def.speed,
        vy: -240, // parabolic arc
        radius: 6,
        damage: def.damage,
        isEnemy: false,
        weaponType: wType,
        lifetime: 2.2,
        color: def.color
      });
    }
  }

  // --- PROJECTILES ---
  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const pr = this.projectiles[i];

      // Gravity for grenade
      if (pr.weaponType === 'grenade') {
        pr.vy += 600 * dt;
      }

      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;
      pr.lifetime -= dt;

      // Check lifetime
      if (pr.lifetime <= 0) {
        if (pr.weaponType === 'grenade') {
          this.explodeGrenade(pr.x, pr.y, pr.damage);
        }
        this.projectiles.splice(i, 1);
        continue;
      }

      // Check wall collisions
      const tileX = Math.floor(pr.x / 32);
      const tileY = Math.floor(pr.y / 32);
      const tile = this.getTile(tileX, tileY);

      if (tile === 1 || tile === 7) {
        if (pr.weaponType === 'grenade') {
          this.explodeGrenade(pr.x, pr.y, pr.damage);
        } else {
          this.emitParticles(pr.x, pr.y, pr.color, 4);
        }
        this.projectiles.splice(i, 1);
        continue;
      }

      // Player bullet hit enemy
      if (!pr.isEnemy) {
        let hitEnemy = false;
        for (const e of this.enemies) {
          if (this.checkCollisionPointRect(pr.x, pr.y, e.x, e.y, e.width, e.height)) {
            e.health -= pr.damage;
            sound.playHurt();
            this.emitParticles(pr.x, pr.y, EGA_PALETTE.toxicGreen, 6);

            // Boss rage trigger
            if (e.type === 'omega_boss' && e.health < e.maxHealth * 0.4 && !e.bossRage) {
              e.bossRage = true;
              e.damage = 45;
              sound.playBossRoar();
              notify.push('⚠️ ALERTA CRÍTICA', '¡El Titán Omega entra en modo SOBRECARGA!', 'warning', 3000);
            }

            if (pr.weaponType === 'grenade') {
              this.explodeGrenade(pr.x, pr.y, pr.damage);
            }

            this.projectiles.splice(i, 1);
            hitEnemy = true;
            break;
          }
        }
        if (hitEnemy) continue;
      }

      // Enemy bullet hit player
      if (pr.isEnemy && !this.player.isInvulnerable) {
        if (this.checkCollisionPointRect(pr.x, pr.y, this.player.x, this.player.y, this.player.width, this.player.height)) {
          this.playerHurt(pr.damage);
          this.projectiles.splice(i, 1);
          continue;
        }
      }
    }
  }

  private explodeGrenade(x: number, y: number, damage: number) {
    sound.playExplosion('large');
    this.camera.shake = 12;
    this.emitParticles(x, y, EGA_PALETTE.plasmaOrange, 20);
    this.emitParticles(x, y, EGA_PALETTE.yellow, 15);

    // Area damage to enemies
    this.enemies.forEach((e) => {
      const dist = Math.hypot(e.x + e.width / 2 - x, e.y + e.height / 2 - y);
      if (dist < 90) {
        e.health -= damage;
        this.emitParticles(e.x, e.y, EGA_PALETTE.toxicGreen, 8);
      }
    });

    // Check if player in blast radius
    const pDist = Math.hypot(this.player.x + this.player.width / 2 - x, this.player.y + this.player.height / 2 - y);
    if (pDist < 60) {
      this.playerHurt(20);
    }
  }

  // --- ENEMIES AI & BEHAVIORS ---
  private updateEnemies(dt: number) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];

      // Death check
      if (e.health <= 0) {
        sound.playExplosion('small');
        this.player.score += e.scoreValue;
        this.emitParticles(e.x + e.width / 2, e.y + e.height / 2, EGA_PALETTE.toxicGreen, 15);

        // Drop item chance
        if (Math.random() < 0.4) {
          const dropType = Math.random() < 0.5 ? 'medikit' : 'ammo_spreader';
          this.pickups.push({
            id: `drop_${Math.random()}`,
            x: e.x,
            y: e.y,
            type: dropType,
            collected: false,
            animOffset: 0
          });
        }

        if (e.type === 'omega_boss') {
          this.bossDefeated = true;
          sound.playLevelClear();
          notify.push('¡TITÁN DERROTADO!', '¡El Reactor Omega ha sido neutralizado!', 'achievement', 5000);
          this.gameVictory = true;
          storage.autoSaveGame({
            score: this.player.score + 10000,
            highestScore: this.player.score + 10000
          });
        }

        this.enemies.splice(i, 1);
        continue;
      }

      // Distance to player
      const distToPlayer = Math.hypot(this.player.x - e.x, this.player.y - e.y);

      // Facing
      e.facing = this.player.x > e.x ? 'right' : 'left';

      // Specific Enemy AI Archetypes
      switch (e.type) {
        case 'mutant_hound':
          // Patrol and leap attack
          if (distToPlayer < 240) {
            neuro.registerThreatSpawn();
            e.vx = e.facing === 'right' ? 140 : -140;
          } else {
            // Patrol back and forth
            if (e.x <= e.patrolMinX) e.vx = 70;
            if (e.x >= e.patrolMaxX) e.vx = -70;
          }
          // Gravity & movement
          e.vy += 800 * dt;
          e.x += e.vx * dt;
          this.resolveHorizontalCollisions(e);
          e.y += e.vy * dt;
          this.resolveVerticalCollisions(e);
          break;

        case 'bio_drone':
          // Sinusoidal flight and bombing
          e.shootTimer += dt;
          e.animTimer += dt;
          e.y += Math.sin(e.animTimer * 4) * 0.8;
          // Slowly track player
          if (Math.abs(this.player.x - e.x) > 20) {
            e.x += (this.player.x > e.x ? 60 : -60) * dt;
          }
          // Drop plasma bomb downwards
          if (distToPlayer < 300 && e.shootTimer > 2.0) {
            e.shootTimer = 0;
            sound.playBlaster('blaster');
            neuro.registerThreatSpawn();
            this.projectiles.push({
              id: `ep_${Math.random()}`,
              x: e.x + e.width / 2,
              y: e.y + e.height,
              vx: (this.player.x - e.x) * 0.5,
              vy: 200,
              radius: 5,
              damage: 20,
              isEnemy: true,
              lifetime: 2.0,
              color: EGA_PALETTE.toxicGreen
            });
          }
          break;

        case 'slime_spitter':
          // Spits bouncing acid balls towards player
          e.shootTimer += dt;
          if (distToPlayer < 350 && e.shootTimer > 2.2) {
            e.shootTimer = 0;
            sound.playBlaster('blaster');
            neuro.registerThreatSpawn();
            const dirX = e.facing === 'right' ? 180 : -180;
            this.projectiles.push({
              id: `ep_${Math.random()}`,
              x: e.x + e.width / 2,
              y: e.y + 4,
              vx: dirX,
              vy: -150, // arched spit
              radius: 6,
              damage: 25,
              isEnemy: true,
              weaponType: 'grenade',
              lifetime: 2.2,
              color: EGA_PALETTE.toxicGreen
            });
          }
          break;

        case 'cyber_enforcer':
          // Heavy foot patrol and burst plasma cannon
          e.shootTimer += dt;
          e.vy += 800 * dt;
          e.y += e.vy * dt;
          this.resolveVerticalCollisions(e);

          if (distToPlayer < 380 && e.shootTimer > 1.8) {
            e.shootTimer = 0;
            sound.playBlaster('pulse');
            neuro.registerThreatSpawn();
            const dirX = e.facing === 'right' ? 320 : -320;
            this.projectiles.push({
              id: `ep_${Math.random()}`,
              x: e.facing === 'right' ? e.x + e.width + 4 : e.x - 4,
              y: e.y + 14,
              vx: dirX,
              vy: 0,
              radius: 6,
              damage: 25,
              isEnemy: true,
              lifetime: 1.8,
              color: EGA_PALETTE.lightRed
            });
          }
          break;

        case 'hive_pod':
          // Organic incubator spawns mini-hounds if damaged or player is close
          e.shootTimer += dt;
          if (distToPlayer < 260 && e.shootTimer > 4.5 && this.enemies.length < 12) {
            e.shootTimer = 0;
            sound.playHurt();
            this.emitParticles(e.x + 18, e.y + 18, EGA_PALETTE.toxicGreen, 8);
            this.enemies.push({
              id: `spawn_${Math.random()}`,
              x: e.x,
              y: e.y + 10,
              width: 24,
              height: 20,
              vx: e.facing === 'right' ? 120 : -120,
              vy: -150,
              isGrounded: false,
              facing: e.facing,
              type: 'mutant_hound',
              health: 25,
              maxHealth: 25,
              damage: 15,
              scoreValue: 80,
              shootTimer: 0,
              aiState: 'chase',
              patrolMinX: e.x - 120,
              patrolMaxX: e.x + 120,
              animFrame: 0,
              animTimer: 0
            });
          }
          break;

        case 'omega_boss':
          // FINAL BOSS: Bio-Titan Omega
          e.shootTimer += dt;
          e.animTimer += dt;
          // Treads ground patrol
          e.vy += 800 * dt;
          e.y += e.vy * dt;
          this.resolveVerticalCollisions(e);

          const patrolSpeed = e.bossRage ? 110 : 70;
          if (e.x <= e.patrolMinX) e.vx = patrolSpeed;
          if (e.x >= e.patrolMaxX) e.vx = -patrolSpeed;
          e.x += e.vx * dt;
          this.resolveHorizontalCollisions(e);

          // Multi-cannon burst fire
          const fireThreshold = e.bossRage ? 1.0 : 1.7;
          if (e.shootTimer > fireThreshold) {
            e.shootTimer = 0;
            sound.playBlaster('pulse');
            neuro.registerThreatSpawn();
            this.camera.shake = 6;

            // Dual shoulder cannons firing towards player
            [-10, 10].forEach((spreadY) => {
              const dirX = e.facing === 'right' ? 380 : -380;
              this.projectiles.push({
                id: `boss_p_${Math.random()}`,
                x: e.facing === 'right' ? e.x + e.width : e.x,
                y: e.y + 24 + spreadY,
                vx: dirX,
                vy: spreadY * 4,
                radius: 8,
                damage: e.bossRage ? 35 : 25,
                isEnemy: true,
                lifetime: 2.0,
                color: e.bossRage ? EGA_PALETTE.yellow : EGA_PALETTE.lightRed
              });
            });
          }
          break;
      }

      // Contact damage with player
      if (this.checkCollisionRectRect(e.x, e.y, e.width, e.height, this.player.x, this.player.y, this.player.width, this.player.height)) {
        this.playerHurt(e.damage);
        // Knockback player slightly
        this.player.vx = (this.player.x > e.x ? 1 : -1) * 220;
        this.player.vy = -180;
      }
    }
  }

  // --- PICKUPS & HAZARDS ---
  private updatePickups(dt: number) {
    const p = this.player;
    for (const pk of this.pickups) {
      if (pk.collected) continue;
      pk.animOffset += dt * 3;

      if (this.checkCollisionRectRect(pk.x, pk.y, 20, 20, p.x, p.y, p.width, p.height)) {
        pk.collected = true;
        sound.playPickup();

        switch (pk.type) {
          case 'medikit':
            p.health = Math.min(p.maxHealth, p.health + 35);
            notify.push('+35 Salud', 'Botiquín de primeros auxilios recogido.', 'item', 2000);
            break;
          case 'shield_cell':
            p.shield = Math.min(p.maxShield, p.shield + 25);
            notify.push('+25 Escudo', 'Batería de escudo táctico activada.', 'item', 2000);
            break;
          case 'ammo_spreader':
            p.ammo.spreader += WEAPON_DEFINITIONS.spreader.ammoPerPickup;
            notify.push('+40 Dispersor', 'Munición de dispersión triple añadida.', 'item', 2000);
            break;
          case 'ammo_pulse':
            p.ammo.pulse += WEAPON_DEFINITIONS.pulse.ammoPerPickup;
            notify.push('+25 Pulso', 'Cargas de plasma de alta densidad añadidas.', 'item', 2000);
            break;
          case 'ammo_grenade':
            p.grenades = Math.min(10, p.grenades + 3);
            notify.push('+3 Granadas', 'Granadas bio-térmicas listas.', 'item', 2000);
            break;
          case 'key_red':
            p.keys.red = true;
            sound.playKeycard();
            notify.push('¡Tarjeta Roja Adquirida!', 'Acceso a puertas de seguridad rojas concedido.', 'achievement', 3500);
            break;
          case 'key_blue':
            p.keys.blue = true;
            sound.playKeycard();
            notify.push('¡Tarjeta Azul Adquirida!', 'Montacargas y laboratorios desbloqueados.', 'achievement', 3500);
            break;
          case 'key_yellow':
            p.keys.yellow = true;
            sound.playKeycard();
            notify.push('¡Tarjeta Amarilla Adquirida!', 'Bóveda cibernética principal autorizada.', 'achievement', 3500);
            break;
          case 'bio_disc':
            p.score += 500;
            notify.push('+500 Puntos', 'Disco con datos confidenciales asegurado.', 'item', 2000);
            break;
          case 'extra_life':
            p.lives++;
            sound.playLevelClear();
            notify.push('¡VIDA EXTRA (1UP)!', `Vidas disponibles: ${p.lives}`, 'achievement', 3500);
            break;
        }

        this.emitParticles(pk.x + 10, pk.y + 10, EGA_PALETTE.yellow, 8);
      }
    }
  }

  private updateHazards(dt: number) {
    if (!this.hazards) return;
    const p = this.player;

    for (const h of this.hazards) {
      if (!h.active) continue;

      if (this.checkCollisionRectRect(h.x, h.y, h.width, h.height, p.x, p.y, p.width, p.height)) {
        neuro.registerHazardHit();
        this.playerHurt(h.damage * dt * 2.5); // continuous damage or spike damage
        p.vy = -260; // bounce off hazards
        this.emitParticles(p.x + p.width / 2, p.y + p.height, EGA_PALETTE.lightRed, 4);
      }
    }
  }

  public playerHurt(damage: number) {
    const p = this.player;
    if (p.isInvulnerable || p.health <= 0) return;

    sound.playHurt();
    input.vibrate(180, 0.7, 0.7);
    this.camera.shake = 10;
    this.emitParticles(p.x + p.width / 2, p.y + p.height / 2, EGA_PALETTE.lightRed, 10);

    // Absorb with shield first
    if (p.shield > 0) {
      const absorbed = Math.min(p.shield, damage);
      p.shield -= absorbed;
      damage -= absorbed;
    }

    if (damage > 0) {
      p.health -= damage;
    }

    p.isInvulnerable = true;
    p.invulnerableTimer = 1.0;

    if (p.health <= 0) {
      p.health = 0;
      p.lives--;
      sound.playExplosion('large');

      if (p.lives > 0) {
        notify.push('¡Has Caído!', `Te quedan ${p.lives} vidas. Reapareciendo en punto seguro...`, 'warning', 3000);
        setTimeout(() => {
          this.respawnPlayer();
        }, 1200);
      } else {
        this.gameOver = true;
        sound.stopMusic();
        notify.push('FIN DEL JUEGO', 'Has agotado todas tus vidas. Intenta de nuevo.', 'warning', 5000);
      }
    }
  }

  private respawnPlayer() {
    if (!this.level || !this.player) return;
    this.player.x = this.level.playerStart.x;
    this.player.y = this.level.playerStart.y;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.health = 100;
    this.player.shield = 50;
    this.player.isInvulnerable = true;
    this.player.invulnerableTimer = 2.0;
  }

  // Check if player reached the level exit portal
  private checkExitPortal() {
    if (!this.level || this.levelCleared || !this.player) return;
    const ex = this.level.exitPortal;
    const p = this.player;

    if (this.checkCollisionRectRect(ex.x, ex.y, 32, 64, p.x, p.y, p.width, p.height)) {
      // Check required keycard
      if (ex.requiresKey && !p.keys[ex.requiresKey]) {
        notify.push(
          'Acceso Denegado',
          `Requiere la Tarjeta de Acceso ${ex.requiresKey.toUpperCase()}`,
          'warning',
          2500
        );
        return;
      }

      // Level Clear!
      this.levelCleared = true;
      sound.playLevelClear();
      this.player.score += 2000 * this.currentLevelId;

      // Autosave progression
      const nextLevel = Math.min(6, this.currentLevelId + 1);
      storage.autoSaveGame({
        currentLevel: nextLevel,
        score: this.player.score,
        lives: this.player.lives,
        health: this.player.health,
        shield: this.player.shield,
        ammo: this.player.ammo,
        grenades: this.player.grenades,
        unlockedLevels: [this.currentLevelId, nextLevel]
      });

      notify.push(
        `¡Nivel ${this.currentLevelId} Completado!`,
        'Progreso guardado automáticamente. Presiona Continuar.',
        'achievement',
        4000
      );

      this.onStateChange?.();
    }
  }

  public advanceNextLevel() {
    if (this.currentLevelId < 6) {
      this.setupLevel(this.currentLevelId + 1, true);
    } else {
      this.gameVictory = true;
    }
  }

  // --- COLLISION RESOLUTION ---
  private resolveHorizontalCollisions(ent: { x: number; y: number; width: number; height: number; vx: number }) {
    const tileSize = 32;
    const leftTile = Math.floor(ent.x / tileSize);
    const rightTile = Math.floor((ent.x + ent.width) / tileSize);
    const topTile = Math.floor(ent.y / tileSize);
    const bottomTile = Math.floor((ent.y + ent.height - 1) / tileSize);

    for (let ty = topTile; ty <= bottomTile; ty++) {
      if (this.isSolidTile(leftTile, ty)) {
        ent.x = (leftTile + 1) * tileSize;
        ent.vx = 0;
      } else if (this.isSolidTile(rightTile, ty)) {
        ent.x = rightTile * tileSize - ent.width;
        ent.vx = 0;
      }
    }
  }

  private resolveVerticalCollisions(ent: { x: number; y: number; width: number; height: number; vy: number; isGrounded?: boolean }) {
    const tileSize = 32;
    const leftTile = Math.floor((ent.x + 2) / tileSize);
    const rightTile = Math.floor((ent.x + ent.width - 3) / tileSize);
    const topTile = Math.floor(ent.y / tileSize);
    const bottomTile = Math.floor((ent.y + ent.height) / tileSize);

    for (let tx = leftTile; tx <= rightTile; tx++) {
      if (ent.vy > 0 && (this.isSolidTile(tx, bottomTile) || this.isPlatformTile(tx, bottomTile, ent))) {
        ent.y = bottomTile * tileSize - ent.height;
        ent.vy = 0;
        if ('isGrounded' in ent) ent.isGrounded = true;
      } else if (ent.vy < 0 && this.isSolidTile(tx, topTile)) {
        ent.y = (topTile + 1) * tileSize;
        ent.vy = 0;
      }
    }
  }

  private isSolidTile(x: number, y: number): boolean {
    const tile = this.getTile(x, y);
    // 1: Solid block
    return tile === 1;
  }

  private isPlatformTile(x: number, y: number, ent: { y: number; height: number; vy: number }): boolean {
    const tile = this.getTile(x, y);
    // 2: Girder (can jump from below and land on top)
    if (tile === 2) {
      const tileTop = y * 32;
      const prevY = ent.y + ent.height - ent.vy * 0.05;
      return prevY <= tileTop + 8;
    }
    return false;
  }

  public getTile(x: number, y: number): number {
    if (!this.level) return 1;
    if (x < 0 || x >= this.level.width || y < 0 || y >= this.level.height) {
      return 1; // wall out of bounds
    }
    return this.level.tiles[y][x];
  }

  private checkCollisionPointRect(px: number, py: number, rx: number, ry: number, rw: number, rh: number): boolean {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
  }

  private checkCollisionRectRect(x1: number, y1: number, w1: number, h1: number, x2: number, y2: number, w2: number, h2: number): boolean {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
  }

  // --- PARTICLES ---
  private emitParticles(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 120 + 30;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 4 + 2,
        alpha: 1.0,
        decay: Math.random() * 2.0 + 1.2,
        gravity: 250
      });
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.gravity) p.vy += p.gravity * dt;
      p.alpha -= p.decay * dt;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  // --- CAMERA ---
  private updateCamera(dt: number) {
    if (!this.level || !this.player) return;
    const targetX = this.player.x + this.player.width / 2 - this.camera.width / 2;
    const targetY = this.player.y + this.player.height / 2 - this.camera.height / 2;

    // Smooth lerp
    this.camera.x += (targetX - this.camera.x) * (dt * 6);
    this.camera.y += (targetY - this.camera.y) * (dt * 6);

    // Screen bounds
    const maxX = this.level.width * 32 - this.camera.width;
    const maxY = this.level.height * 32 - this.camera.height;
    this.camera.x = Math.max(0, Math.min(maxX, this.camera.x));
    this.camera.y = Math.max(0, Math.min(maxY, this.camera.y));

    // Screen shake decay
    if (this.camera.shake > 0) {
      this.camera.shake -= dt * 25;
      if (this.camera.shake < 0) this.camera.shake = 0;
    }
  }

  // ==========================================
  // RENDERING ENGINE
  // ==========================================

  public render() {
    const ctx = this.ctx;
    const cvs = this.canvas;
    if (!ctx || !cvs || !this.level || !this.player) return;

    const atlas = sprites.atlas;

    // Shake offset
    const shakeX = this.camera.shake > 0 ? (Math.random() * 2 - 1) * this.camera.shake : 0;
    const shakeY = this.camera.shake > 0 ? (Math.random() * 2 - 1) * this.camera.shake : 0;

    ctx.save();
    ctx.clearRect(0, 0, cvs.width, cvs.height);

    // 1. Draw Themed Backdrop (Parallax)
    if (atlas && atlas.textures[this.level.theme]) {
      const bg = atlas.textures[this.level.theme];
      const paraX = (this.camera.x * 0.2) % cvs.width;
      ctx.drawImage(bg, -paraX, 0, cvs.width, cvs.height);
      ctx.drawImage(bg, cvs.width - paraX, 0, cvs.width, cvs.height);
    } else {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, cvs.width, cvs.height);
    }

    // Apply Camera translation
    ctx.translate(Math.round(-this.camera.x + shakeX), Math.round(-this.camera.y + shakeY));

    // 2. Draw Visible Tilemap (Viewport Culling for peak performance)
    const tileSize = 32;
    const startCol = Math.max(0, Math.floor(this.camera.x / tileSize));
    const endCol = Math.min(this.level.width - 1, Math.ceil((this.camera.x + this.camera.width) / tileSize));
    const startRow = Math.max(0, Math.floor(this.camera.y / tileSize));
    const endRow = Math.min(this.level.height - 1, Math.ceil((this.camera.y + this.camera.height) / tileSize));

    for (let y = startRow; y <= endRow; y++) {
      for (let x = startCol; x <= endCol; x++) {
        const tile = this.level.tiles[y][x];
        if (tile > 0) {
          if (atlas && atlas.tiles[tile]) {
            ctx.drawImage(atlas.tiles[tile], x * tileSize, y * tileSize);
          } else {
            // fallback color
            ctx.fillStyle = tile === 1 ? '#475569' : tile === 2 ? '#64748b' : tile === 6 ? EGA_PALETTE.toxicGreen : EGA_PALETTE.lightRed;
            ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
          }
        }
      }
    }

    // 3. Draw Pickups
    for (const pk of this.pickups) {
      if (pk.collected) continue;
      const floatY = Math.sin(pk.animOffset) * 4;
      if (atlas && atlas.pickups[pk.type]) {
        ctx.drawImage(atlas.pickups[pk.type], pk.x, pk.y + floatY);
      } else {
        ctx.fillStyle = EGA_PALETTE.yellow;
        ctx.fillRect(pk.x, pk.y + floatY, 18, 18);
      }
    }

    // 4. Draw Hazards
    for (const h of this.hazards) {
      if (!h.active) continue;
      if (h.type === 'laser_beam') {
        ctx.fillStyle = (Math.floor(Date.now() / 80) % 2 === 0) ? EGA_PALETTE.lightRed : EGA_PALETTE.white;
        ctx.fillRect(h.x + 6, h.y, 4, h.height);
      }
    }

    // 5. Draw Enemies
    for (const e of this.enemies) {
      ctx.save();
      const isFacingLeft = e.facing === 'left';
      if (isFacingLeft) {
        ctx.scale(-1, 1);
        ctx.translate(-Math.round(e.x * 2 + e.width), 0);
      }

      if (e.type === 'omega_boss') {
        const bossSprites = e.bossRage ? atlas?.boss.rage : atlas?.boss.idle;
        const frame = (Math.floor(Date.now() / 200) % 2);
        if (bossSprites && bossSprites[frame]) {
          ctx.drawImage(bossSprites[frame], e.x - 16, e.y - 16);
        } else {
          ctx.fillStyle = EGA_PALETTE.lightRed;
          ctx.fillRect(e.x, e.y, e.width, e.height);
        }

        // Boss Health Bar above
        const healthPct = Math.max(0, e.health / e.maxHealth);
        ctx.fillStyle = '#000';
        ctx.fillRect(e.x, e.y - 18, e.width, 8);
        ctx.fillStyle = e.bossRage ? EGA_PALETTE.plasmaOrange : EGA_PALETTE.lightRed;
        ctx.fillRect(e.x + 1, e.y - 17, (e.width - 2) * healthPct, 6);
      } else {
        const sprList = atlas?.enemies[e.type];
        const frame = e.animFrame % 2;
        if (sprList && sprList[frame]) {
          ctx.drawImage(sprList[frame], e.x, e.y);
        } else {
          ctx.fillStyle = EGA_PALETTE.green;
          ctx.fillRect(e.x, e.y, e.width, e.height);
        }

        // Mini enemy health bar
        if (e.health < e.maxHealth) {
          ctx.fillStyle = '#000';
          ctx.fillRect(e.x, e.y - 6, e.width, 4);
          ctx.fillStyle = EGA_PALETTE.toxicGreen;
          ctx.fillRect(e.x + 1, e.y - 5, (e.width - 2) * (e.health / e.maxHealth), 2);
        }
      }

      ctx.restore();
    }

    // 6. Draw Player
    const p = this.player;
    ctx.save();
    // Invulnerability flashing
    if (p.isInvulnerable && Math.floor(Date.now() / 60) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    const pFacingLeft = p.facing === 'left';
    if (pFacingLeft) {
      ctx.scale(-1, 1);
      ctx.translate(-Math.round(p.x * 2 + p.width), 0);
    }

    let pSprite: HTMLCanvasElement | null = null;
    if (atlas) {
      if (p.health <= 0) {
        pSprite = atlas.player.hurt;
      } else if (p.isShooting) {
        pSprite = atlas.player.shoot;
      } else if (!p.isGrounded) {
        pSprite = atlas.player.jump;
      } else if (Math.abs(p.vx) > 10) {
        pSprite = atlas.player.run[p.animFrame % 4];
      } else {
        pSprite = atlas.player.idle[0];
      }
    }

    if (pSprite) {
      ctx.drawImage(pSprite, p.x - 4, p.y - 4);
    } else {
      ctx.fillStyle = EGA_PALETTE.green;
      ctx.fillRect(p.x, p.y, p.width, p.height);
    }
    ctx.restore();

    // 7. Draw Projectiles
    for (const pr of this.projectiles) {
      ctx.fillStyle = pr.color;
      ctx.beginPath();
      ctx.arc(pr.x, pr.y, pr.radius, 0, Math.PI * 2);
      ctx.fill();

      // Glowing halo
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // 8. Draw Particles
    for (const part of this.particles) {
      ctx.fillStyle = part.color;
      ctx.globalAlpha = Math.max(0, part.alpha);
      ctx.fillRect(part.x, part.y, part.size, part.size);
    }
    ctx.globalAlpha = 1.0;

    ctx.restore();
  }
}

export const engine = new GameEngine();
