/**
 * @file /src/engine/AudioEngine.ts
 * Real-time procedural 8-bit / Chiptune Audio Synthesizer via Web Audio API.
 * Zero external MP3/WAV dependencies - 100% offline resilient and latency-free.
 */

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private isMuted: boolean = false;
  private musicVolume: number = 0.6;
  private sfxVolume: number = 0.7;

  // Music sequencer state
  private isMusicPlaying: boolean = false;
  private currentTrackId: string | null = null;
  private sequenceStep: number = 0;
  private sequenceTimer: number | null = null;
  private bpm: number = 132;

  // Breathing calm ambient synth
  private calmOsc1: OscillatorNode | null = null;
  private calmOsc2: OscillatorNode | null = null;
  private calmGain: GainNode | null = null;

  constructor() {
    // AudioContext will be initialized on first user interaction to satisfy browser policies
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);
    } catch {
      console.warn('Web Audio API not supported in this environment');
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolumes(musicVol: number, sfxVol: number) {
    this.musicVolume = Math.max(0, Math.min(1, musicVol));
    this.sfxVolume = Math.max(0, Math.min(1, sfxVol));

    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
    }
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    }
  }

  // ==========================================
  // RETRO 8-BIT SFX SYNTHESIZERS
  // ==========================================

  public playJump() {
    if (!this.ctx || !this.sfxGain) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.14);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playBlaster(weapon: 'blaster' | 'spreader' | 'pulse' | 'grenade' = 'blaster') {
    if (!this.ctx || !this.sfxGain) return;
    this.resume();
    const now = this.ctx.currentTime;

    if (weapon === 'blaster') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.09);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.1);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.11);
    } else if (weapon === 'spreader') {
      // Dual detuned pulse
      [640, 720].forEach((freq) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.12);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.12);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.13);
      });
    } else if (weapon === 'pulse') {
      // Heavy energy laser
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.22);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.23);
    } else if (weapon === 'grenade') {
      // Launch sound
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.16);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.17);
    }
  }

  public playExplosion(intensity: 'small' | 'large' = 'small') {
    if (!this.ctx || !this.sfxGain) return;
    this.resume();
    const duration = intensity === 'large' ? 0.45 : 0.25;
    const now = this.ctx.currentTime;

    // Procedural 8-bit bitcrushed white noise buffer
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      // Step sample hold for retro gritty crunch
      if (i % 4 === 0) {
        last = (Math.random() * 2 - 1) * 0.9;
      }
      data[i] = last;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    // Filter down to mimic explosion rumble
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(intensity === 'large' ? 800 : 1200, now);
    filter.frequency.linearRampToValueAtTime(60, now + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(intensity === 'large' ? 0.6 : 0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
  }

  public playHurt() {
    if (!this.ctx || !this.sfxGain) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(70, now + 0.15);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.16);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.17);
  }

  public playPickup() {
    if (!this.ctx || !this.sfxGain) return;
    this.resume();
    const now = this.ctx.currentTime;
    // Classic 3-tone arpeggio (C5 -> E5 -> G5)
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0.2, now + idx * 0.05);
      gain.gain.linearRampToValueAtTime(0.01, now + idx * 0.05 + 0.08);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.09);
    });
  }

  public playKeycard() {
    if (!this.ctx || !this.sfxGain) return;
    this.resume();
    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0.25, now + idx * 0.06);
      gain.gain.linearRampToValueAtTime(0.01, now + idx * 0.06 + 0.1);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.11);
    });
  }

  public playLevelClear() {
    if (!this.ctx || !this.sfxGain) return;
    this.resume();
    const now = this.ctx.currentTime;
    // 8-bit victory fanfare
    const melody = [
      { f: 523.25, d: 0.12 }, // C5
      { f: 659.25, d: 0.12 }, // E5
      { f: 783.99, d: 0.12 }, // G5
      { f: 1046.5, d: 0.35 }  // C6
    ];
    let offset = 0;
    melody.forEach((note) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, now + offset);

      gain.gain.setValueAtTime(0.3, now + offset);
      gain.gain.linearRampToValueAtTime(0.01, now + offset + note.d);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + offset);
      osc.stop(now + offset + note.d + 0.02);
      offset += note.d;
    });
  }

  public playBossRoar() {
    if (!this.ctx || !this.sfxGain) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.linearRampToValueAtTime(45, now + 0.5);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.6);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.65);
  }

  // ==========================================
  // ORIGINAL PROCEDURAL CHIPTUNE BGM SEQUENCER
  // ==========================================

  public startMusic(theme: string = 'outpost') {
    this.init();
    this.resume();
    if (this.isMusicPlaying && this.currentTrackId === theme) return;

    this.stopMusic();
    this.isMusicPlaying = true;
    this.currentTrackId = theme;
    this.sequenceStep = 0;

    // Pattern definitions for each theme
    // Bass notes, Lead melody notes, and Percussion triggers
    const trackData = this.getTrackData(theme);
    this.bpm = trackData.bpm;
    const stepInterval = (60 / this.bpm) / 4 * 1000; // 16th note in ms

    this.sequenceTimer = window.setInterval(() => {
      if (!this.isMusicPlaying || !this.ctx || !this.musicGain) return;

      const step = this.sequenceStep % 32;
      this.playSequencerStep(step, trackData);
      this.sequenceStep++;
    }, stepInterval);
  }

  public stopMusic() {
    if (this.sequenceTimer !== null) {
      clearInterval(this.sequenceTimer);
      this.sequenceTimer = null;
    }
    this.isMusicPlaying = false;
    this.currentTrackId = null;
  }

  private getTrackData(theme: string) {
    // Frequencies (Hz): A2=110, C3=130.81, D3=146.83, E3=164.81, F3=174.61, G3=196, A3=220, C4=261.63, D4=293.66, E4=329.63, G4=392, A4=440
    switch (theme) {
      case 'biolab':
        return {
          bpm: 136,
          bass: [110, 0, 110, 0, 130.81, 0, 146.83, 0, 110, 0, 110, 0, 164.81, 0, 146.83, 0],
          lead: [440, 0, 523.25, 0, 659.25, 523.25, 440, 0, 392, 0, 440, 0, 523.25, 0, 392, 0],
          drumPattern: [1, 0, 2, 0, 1, 0, 2, 1, 1, 0, 2, 0, 1, 1, 2, 0]
        };
      case 'sewer':
        return {
          bpm: 124,
          bass: [73.42, 0, 73.42, 82.41, 0, 73.42, 98, 0, 73.42, 0, 73.42, 110, 0, 98, 82.41, 0],
          lead: [293.66, 0, 329.63, 0, 349.23, 0, 293.66, 0, 261.63, 0, 293.66, 0, 349.23, 0, 392, 0],
          drumPattern: [1, 0, 0, 1, 2, 0, 1, 0, 1, 0, 0, 1, 2, 0, 2, 1]
        };
      case 'cyber':
        return {
          bpm: 144,
          bass: [130.81, 130.81, 0, 130.81, 164.81, 0, 196, 0, 130.81, 130.81, 0, 130.81, 220, 0, 196, 0],
          lead: [523.25, 659.25, 783.99, 659.25, 880, 0, 783.99, 0, 523.25, 659.25, 783.99, 1046.5, 880, 783.99, 659.25, 523.25],
          drumPattern: [1, 0, 2, 1, 1, 0, 2, 0, 1, 0, 2, 1, 1, 1, 2, 1]
        };
      case 'hive':
        return {
          bpm: 130,
          bass: [98, 0, 98, 0, 103.83, 0, 98, 0, 87.31, 0, 98, 0, 110, 0, 103.83, 0],
          lead: [392, 415.3, 392, 0, 349.23, 0, 392, 415.3, 466.16, 415.3, 392, 0, 349.23, 0, 311.13, 0],
          drumPattern: [1, 1, 2, 0, 1, 0, 2, 1, 1, 1, 2, 0, 1, 2, 2, 1]
        };
      case 'core':
        return {
          bpm: 152, // high intensity final boss
          bass: [110, 110, 130.81, 110, 146.83, 110, 164.81, 146.83, 110, 110, 130.81, 110, 196, 164.81, 146.83, 130.81],
          lead: [440, 523.25, 659.25, 880, 783.99, 659.25, 523.25, 440, 880, 783.99, 659.25, 783.99, 880, 1046.5, 880, 659.25],
          drumPattern: [1, 2, 1, 2, 1, 2, 1, 2, 1, 1, 2, 1, 1, 2, 2, 2]
        };
      case 'outpost':
      default:
        return {
          bpm: 132,
          bass: [110, 0, 110, 0, 146.83, 0, 130.81, 0, 110, 0, 110, 0, 164.81, 0, 146.83, 0],
          lead: [440, 0, 440, 523.25, 0, 440, 392, 0, 440, 0, 523.25, 0, 659.25, 0, 523.25, 440],
          drumPattern: [1, 0, 2, 0, 1, 0, 2, 0, 1, 0, 2, 1, 1, 0, 2, 0]
        };
    }
  }

  private playSequencerStep(step: number, track: { bass: number[]; lead: number[]; drumPattern: number[] }) {
    if (!this.ctx || !this.musicGain) return;
    const now = this.ctx.currentTime;
    const index = step % 16;

    // 1. Bassline (Pulse / Triangle wave)
    const bassFreq = track.bass[index];
    if (bassFreq > 0) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(bassFreq, now);

      gain.gain.setValueAtTime(0.24, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.12);

      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(now);
      osc.stop(now + 0.13);
    }

    // 2. Lead melody (Square wave, classic 8-bit sound)
    const leadFreq = track.lead[index];
    if (leadFreq > 0) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(leadFreq, now);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.1);

      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(now);
      osc.stop(now + 0.11);
    }

    // 3. Retro 8-bit noise drum (1: Kick, 2: Snare/Hi-Hat)
    const drum = track.drumPattern[index];
    if (drum === 1) {
      // 8-bit Kick
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(130, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.08);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.09);

      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(now);
      osc.stop(now + 0.09);
    } else if (drum === 2) {
      // 8-bit Snare / Hi-hat
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(Math.random() * 800 + 400, now);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.05);

      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(now);
      osc.stop(now + 0.06);
    }
  }

  // ==========================================
  // GUIDED CALMING BREATHING AMBIENT SOUND
  // ==========================================

  public startCalmAmbient() {
    this.init();
    this.resume();
    this.stopCalmAmbient();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    // 432Hz tuning healing tone with harmonic 216Hz sub-drone
    this.calmGain = this.ctx.createGain();
    this.calmGain.gain.setValueAtTime(0.01, now);
    this.calmGain.gain.linearRampToValueAtTime(0.25, now + 1.5);
    this.calmGain.connect(this.masterGain);

    this.calmOsc1 = this.ctx.createOscillator();
    this.calmOsc1.type = 'sine';
    this.calmOsc1.frequency.setValueAtTime(432, now); // A = 432Hz
    this.calmOsc1.connect(this.calmGain);

    this.calmOsc2 = this.ctx.createOscillator();
    this.calmOsc2.type = 'sine';
    this.calmOsc2.frequency.setValueAtTime(216, now); // Octave below
    this.calmOsc2.connect(this.calmGain);

    this.calmOsc1.start(now);
    this.calmOsc2.start(now);
  }

  public stopCalmAmbient() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.calmGain) {
      this.calmGain.gain.linearRampToValueAtTime(0.001, now + 0.8);
      setTimeout(() => {
        try {
          this.calmOsc1?.stop();
          this.calmOsc2?.stop();
          this.calmOsc1?.disconnect();
          this.calmOsc2?.disconnect();
          this.calmGain?.disconnect();
        } catch {}
        this.calmOsc1 = null;
        this.calmOsc2 = null;
        this.calmGain = null;
      }, 850);
    }
  }
}

export const sound = new AudioEngine();
