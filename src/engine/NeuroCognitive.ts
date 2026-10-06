/**
 * @file /src/engine/NeuroCognitive.ts
 * Real-Time Neuro-Cognitive Evaluation Engine.
 * Analyzes psychomotor reaction latency, input entropy (panic tapping),
 * spatial disorientation, and calculates an objective Stress & Anxiety Index.
 */

import { NeuroCognitiveMetrics } from '../types/game';

export class NeuroCognitiveTracker {
  private metrics: NeuroCognitiveMetrics = {
    reactionTimeMs: 280,
    recentReactionTimes: [290, 275, 280, 265],
    inputJitterFreq: 0,
    hazardCollisions: 0,
    spatialOrientationScore: 92,
    focusScore: 88,
    stressLevel: 22,
    anxietyDetected: false,
    evaluatedSamples: 0,
    calmnessHistory: [25, 24, 26, 28, 22, 21, 23, 25],
    cognitiveLoadCategory: 'CALMO',
    estimatedBpm: 72
  };

  // Pending reaction challenge (threat spawned timestamp)
  private pendingThreatTime: number | null = null;
  private threatActive: boolean = false;

  // Timers
  private highStressDuration: number = 0;
  private lastUpdate: number = performance.now();
  private sampleTimer: number = 0;

  // Anxiety intervention callback
  private onAnxietyDetectedCallback: ((metrics: NeuroCognitiveMetrics) => void) | null = null;
  private promptCooldown: number = 0; // Prevent spamming breathing prompts

  public setOnAnxietyDetected(cb: (metrics: NeuroCognitiveMetrics) => void) {
    this.onAnxietyDetectedCallback = cb;
  }

  /**
   * Register that a high-danger threat has appeared or fired towards the player
   */
  public registerThreatSpawn() {
    if (!this.threatActive) {
      this.threatActive = true;
      this.pendingThreatTime = performance.now();
    }
  }

  /**
   * Player took an evasive or defensive action (jump, shoot, dash)
   */
  public registerPlayerAction() {
    if (this.threatActive && this.pendingThreatTime !== null) {
      const latency = Math.round(performance.now() - this.pendingThreatTime);
      if (latency > 50 && latency < 1500) {
        this.metrics.recentReactionTimes.push(latency);
        if (this.metrics.recentReactionTimes.length > 10) {
          this.metrics.recentReactionTimes.shift();
        }
        // Average
        const sum = this.metrics.recentReactionTimes.reduce((a, b) => a + b, 0);
        this.metrics.reactionTimeMs = Math.round(sum / this.metrics.recentReactionTimes.length);
      }
      this.threatActive = false;
      this.pendingThreatTime = null;
    }
  }

  /**
   * Register that player took damage or fell into a hazard
   */
  public registerHazardHit() {
    this.metrics.hazardCollisions++;
    this.metrics.spatialOrientationScore = Math.max(10, this.metrics.spatialOrientationScore - 12);
    // Sharp stress spike on impact
    this.metrics.stressLevel = Math.min(100, this.metrics.stressLevel + 18);
  }

  /**
   * Update neuro-cognitive evaluation loop
   * @param dt delta time in seconds
   * @param inputEntropy current button presses per sec
   * @param playerHealthRatio player health / maxHealth (0.0 to 1.0)
   * @param enemiesNearby number of active enemies in close radius
   */
  public update(dt: number, inputEntropy: number, playerHealthRatio: number, enemiesNearby: number): NeuroCognitiveMetrics {
    const now = performance.now();
    this.sampleTimer += dt;
    if (this.promptCooldown > 0) {
      this.promptCooldown -= dt;
    }

    this.metrics.inputJitterFreq = inputEntropy;

    // 1. Calculate base stress factors:
    // Factor A: Panic tapping (entropy > 4 Hz indicates erratic rapid tapping)
    const panicTappingStress = Math.min(40, Math.max(0, (inputEntropy - 2.5) * 12));

    // Factor B: Critical health danger (below 35% health increases sympathetic arousal)
    const healthRiskStress = playerHealthRatio < 0.4 ? (0.4 - playerHealthRatio) * 60 : 0;

    // Factor C: Local combat intensity
    const combatStress = Math.min(30, enemiesNearby * 8);

    // Target stress level
    const targetStress = Math.min(100, Math.max(10, 15 + panicTappingStress + healthRiskStress + combatStress));

    // Smooth lerp towards target stress
    this.metrics.stressLevel += (targetStress - this.metrics.stressLevel) * (dt * 0.8);

    // Focus score: High reaction speed & low panic tapping = high focus
    const reactionBonus = Math.max(0, 100 - (this.metrics.reactionTimeMs - 200) * 0.25);
    const panicPenalty = Math.min(50, inputEntropy * 8);
    const targetFocus = Math.min(100, Math.max(20, (reactionBonus * 0.7 + (100 - this.metrics.stressLevel) * 0.3) - panicPenalty));
    this.metrics.focusScore += (targetFocus - this.metrics.focusScore) * (dt * 0.5);

    // Spatial orientation naturally recovers over time if no hits
    if (this.metrics.spatialOrientationScore < 95) {
      this.metrics.spatialOrientationScore = Math.min(95, this.metrics.spatialOrientationScore + dt * 4);
    }

    // Correlated simulated BPM (resting 68 bpm -> up to 135 in heavy panic)
    this.metrics.estimatedBpm = Math.round(68 + (this.metrics.stressLevel / 100) * 60);

    // Classify cognitive load category
    if (this.metrics.stressLevel < 35) {
      this.metrics.cognitiveLoadCategory = 'CALMO';
    } else if (this.metrics.stressLevel < 65) {
      this.metrics.cognitiveLoadCategory = 'ENFOCADO';
    } else if (this.metrics.stressLevel < 78) {
      this.metrics.cognitiveLoadCategory = 'ALERTA';
    } else {
      this.metrics.cognitiveLoadCategory = 'ESTRÉS ELEVADO';
    }

    // Anxiety detection trigger:
    // If stress > 75 and input jitter is elevated for more than 3 seconds
    if (this.metrics.stressLevel >= 75 && (inputEntropy > 3.5 || playerHealthRatio < 0.25)) {
      this.highStressDuration += dt;
      if (this.highStressDuration >= 3.0 && !this.metrics.anxietyDetected) {
        this.metrics.anxietyDetected = true;
        if (this.promptCooldown <= 0 && this.onAnxietyDetectedCallback) {
          this.promptCooldown = 45; // don't repeat prompt within 45s
          this.onAnxietyDetectedCallback(this.metrics);
        }
      }
    } else {
      this.highStressDuration = Math.max(0, this.highStressDuration - dt * 2);
      if (this.metrics.stressLevel < 60) {
        this.metrics.anxietyDetected = false;
      }
    }

    // Rolling history every 1.5 seconds
    if (this.sampleTimer >= 1.5) {
      this.sampleTimer = 0;
      this.metrics.calmnessHistory.push(Math.round(100 - this.metrics.stressLevel));
      if (this.metrics.calmnessHistory.length > 20) {
        this.metrics.calmnessHistory.shift();
      }
      this.metrics.evaluatedSamples++;
    }

    return this.getMetrics();
  }

  /**
   * Called when player completes a guided breathing session to reset calmness
   */
  public applyBreathingRecovery(boost: number = 40) {
    this.metrics.stressLevel = Math.max(12, this.metrics.stressLevel - boost);
    this.metrics.anxietyDetected = false;
    this.highStressDuration = 0;
    this.metrics.focusScore = Math.min(100, this.metrics.focusScore + 25);
    this.metrics.estimatedBpm = Math.max(65, this.metrics.estimatedBpm - 20);
    this.promptCooldown = 60; // 1 min grace period
  }

  public getMetrics(): NeuroCognitiveMetrics {
    return {
      ...this.metrics,
      reactionTimeMs: Math.round(this.metrics.reactionTimeMs),
      focusScore: Math.round(this.metrics.focusScore),
      stressLevel: Math.round(this.metrics.stressLevel),
      spatialOrientationScore: Math.round(this.metrics.spatialOrientationScore),
      estimatedBpm: Math.round(this.metrics.estimatedBpm)
    };
  }
}

export const neuro = new NeuroCognitiveTracker();
