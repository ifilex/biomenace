/**
 * @file /src/components/GameCanvas.tsx
 * Canvas host component with authentic 8-bit retro HUD, CRT filter effects,
 * overlay states, and responsive scaling.
 */

import React, { useEffect, useRef, useState } from 'react';
import { engine } from '../engine/GameEngine';
import { input } from '../engine/InputManager';
import { WEAPON_DEFINITIONS } from '../engine/LevelData';
import { sprites } from '../engine/Sprites';
import { storage } from '../engine/StorageManager';
import { sound } from '../engine/AudioEngine';
import { NeuroDashboard } from './NeuroDashboard';
import {
  Activity,
  Award,
  BookOpen,
  Check,
  Gamepad2,
  Heart,
  Key,
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  Shield,
  Tv,
  Volume2,
  VolumeX,
  Wind
} from 'lucide-react';

interface GameCanvasProps {
  onOpenBreathing: () => void;
  onOpenDocs: () => void;
  onOpenLevelSelect: () => void;
  showTouchControls: boolean;
  onToggleTouchControls: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  onOpenBreathing,
  onOpenDocs,
  onOpenLevelSelect,
  showTouchControls,
  onToggleTouchControls
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Local synced states for HUD
  const [, setTick] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [crtEnabled, setCrtEnabled] = useState<boolean>(true);
  const [showNeuroPanel, setShowNeuroPanel] = useState<boolean>(false);
  const [soundMuted, setSoundMuted] = useState<boolean>(false);

  // Initialize engine on mount
  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      await sprites.init();
      if (!active || !canvasRef.current) return;

      engine.init(canvasRef.current, () => {
        if (active) setTick((t) => t + 1);
      });
      engine.start();
    };

    bootstrap();

    return () => {
      active = false;
      engine.stop();
    };
  }, []);

  const player = engine.player;
  const level = engine.level;
  const curWeapon = player ? WEAPON_DEFINITIONS[player.currentWeapon] : null;

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleMuteToggle = () => {
    const next = !soundMuted;
    setSoundMuted(next);
    if (next) sound.setVolumes(0, 0);
    else sound.setVolumes(0.6, 0.7);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-5xl aspect-[16/9] min-h-[380px] bg-black border-2 border-stone-800 rounded-lg overflow-hidden shadow-2xl flex flex-col justify-between select-none"
    >
      {/* 1. TOP RETRO 8-BIT HUD */}
      <div className="z-20 bg-stone-950/90 border-b border-stone-800 p-2 sm:px-4 flex items-center justify-between font-pixel text-xs text-stone-200">
        {/* Left: Health & Shield bars */}
        <div className="flex items-center gap-3">
          {/* Health */}
          <div className="flex items-center gap-1.5">
            <span className="text-red-500 font-bold text-[10px]">SAL</span>
            <div className="w-20 sm:w-28 h-3 bg-stone-900 border border-stone-700 rounded-sm overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-emerald-500 transition-all duration-200"
                style={{ width: `${Math.max(0, player?.health || 0)}%` }}
              />
            </div>
            <span className="text-[10px] text-stone-300 min-w-[24px]">
              {Math.max(0, Math.round(player?.health || 0))}
            </span>
          </div>

          {/* Shield */}
          <div className="hidden xs:flex items-center gap-1.5">
            <span className="text-cyan-400 font-bold text-[10px]">ESC</span>
            <div className="w-14 sm:w-20 h-3 bg-stone-900 border border-stone-700 rounded-sm overflow-hidden p-0.5">
              <div
                className="h-full bg-cyan-400 transition-all duration-200"
                style={{ width: `${Math.min(100, (player?.shield || 0) * 2)}%` }}
              />
            </div>
          </div>

          {/* Lives (1UP) */}
          <div className="flex items-center gap-1 text-rose-400 ml-1">
            <Heart className="w-3.5 h-3.5 fill-rose-500" />
            <span className="text-[11px]">x{player?.lives || 0}</span>
          </div>
        </div>

        {/* Center: Score & Level Title */}
        <div className="text-center hidden md:block">
          <div className="text-amber-400 text-sm font-bold tracking-wider">
            SCORE: {player?.score ? player.score.toLocaleString() : '0000'}
          </div>
          <div className="text-[9px] text-stone-400 tracking-wider">
            NIVEL {engine.currentLevelId}: {level?.name}
          </div>
        </div>

        {/* Right: Weapon, Ammo, Keycards & Neuro Badge */}
        <div className="flex items-center gap-3">
          {/* Active Weapon */}
          {curWeapon && (
            <div className="flex items-center gap-1.5 bg-stone-900 px-2 py-1 rounded border border-stone-700">
              <span className="text-[10px] text-amber-300 font-bold truncate max-w-[80px]">
                {curWeapon.name.split(' ')[0]}
              </span>
              <span className="text-[10px] text-cyan-300">
                {player?.currentWeapon === 'blaster' ? '∞' : player?.ammo[player.currentWeapon]}
              </span>
            </div>
          )}

          {/* Keycards */}
          <div className="hidden sm:flex items-center gap-1">
            <span className={`w-2.5 h-3.5 rounded-xs border ${player?.keys.red ? 'bg-red-500 border-white' : 'bg-stone-800 border-stone-700 opacity-40'}`} title="Llave Roja" />
            <span className={`w-2.5 h-3.5 rounded-xs border ${player?.keys.blue ? 'bg-blue-500 border-white' : 'bg-stone-800 border-stone-700 opacity-40'}`} title="Llave Azul" />
            <span className={`w-2.5 h-3.5 rounded-xs border ${player?.keys.yellow ? 'bg-yellow-400 border-white' : 'bg-stone-800 border-stone-700 opacity-40'}`} title="Llave Amarilla" />
          </div>

          {/* Neuro-Cognitive Status Badge */}
          <NeuroDashboard onOpenBreathing={onOpenBreathing} compact={true} />

          {/* Pause Button */}
          <button
            onClick={() => {
              engine.togglePause();
              setTick((t) => t + 1);
            }}
            className="p-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors"
            title="Pausar Juego (P / Esc)"
          >
            {engine.isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. MAIN RETRO CANVAS ELEMENT */}
      <div className="relative flex-1 w-full h-full bg-black overflow-hidden flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={640}
          height={380}
          className="w-full h-full object-contain pixelated"
        />

        {/* Optional CRT scanline & curved shadow monitor overlay */}
        {crtEnabled && <div className="absolute inset-0 crt-lines pointer-events-none" />}

        {/* Floating Gamepad / Controller Detected Notification */}
        {input.gamepadConnected && (
          <div className="absolute bottom-3 left-3 bg-stone-900/90 border border-cyan-500/60 text-cyan-300 text-[10px] font-pixel px-2 py-1 rounded flex items-center gap-1.5 shadow-lg pointer-events-none">
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>MANDO CONECTADO: {input.gamepadName.split('(')[0]}</span>
          </div>
        )}

        {/* Floating Neuro-Cognitive Dashboard Drawer (if toggled) */}
        {showNeuroPanel && (
          <div className="absolute top-4 right-4 z-40">
            <div className="relative">
              <button
                onClick={() => setShowNeuroPanel(false)}
                className="absolute -top-2 -right-2 p-1 rounded-full bg-stone-900 border border-stone-700 text-stone-400 hover:text-white"
              >
                ✕
              </button>
              <NeuroDashboard onOpenBreathing={onOpenBreathing} />
            </div>
          </div>
        )}

        {/* =================================================== */}
        {/* OVERLAY: PAUSE MENU */}
        {/* =================================================== */}
        {engine.isPaused && !engine.levelCleared && !engine.gameOver && !engine.gameVictory && (
          <div className="absolute inset-0 z-30 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-stone-100 animate-in fade-in">
            <div className="bg-stone-900 border-2 border-cyan-500 rounded-lg p-6 max-w-sm w-full shadow-2xl flex flex-col items-center">
              <h2 className="font-pixel text-base text-cyan-400 tracking-widest mb-1 text-glow-cyan">
                SISTEMA EN PAUSA
              </h2>
              <p className="text-xs font-tech text-stone-400 mb-5 text-center">
                Misión: Sector {engine.currentLevelId} - {level?.name}
              </p>

              {/* Action buttons */}
              <div className="flex flex-col gap-2.5 w-full font-pixel text-xs">
                <button
                  onClick={() => {
                    engine.togglePause();
                    setTick((t) => t + 1);
                  }}
                  className="py-2.5 px-4 rounded bg-cyan-600 hover:bg-cyan-500 text-stone-950 font-bold flex items-center justify-center gap-2 transition-all shadow"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>CONTINUAR MISIÓN</span>
                </button>

                <button
                  onClick={() => {
                    engine.setupLevel(engine.currentLevelId, false);
                    engine.isPaused = false;
                    setTick((t) => t + 1);
                  }}
                  className="py-2 px-4 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 flex items-center justify-center gap-2 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>REINICIAR SECTOR</span>
                </button>

                <button
                  onClick={() => {
                    onOpenLevelSelect();
                  }}
                  className="py-2 px-4 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 flex items-center justify-center gap-2 transition-all"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>MAPAS & GUARDADO</span>
                </button>

                <button
                  onClick={() => {
                    onOpenBreathing();
                  }}
                  className="py-2 px-4 rounded bg-emerald-950 border border-emerald-600 hover:bg-emerald-900 text-emerald-300 flex items-center justify-center gap-2 transition-all"
                >
                  <Wind className="w-3.5 h-3.5" />
                  <span>EJERCICIO RESPIRACIÓN</span>
                </button>

                <button
                  onClick={() => {
                    setShowNeuroPanel(!showNeuroPanel);
                  }}
                  className="py-2 px-4 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 flex items-center justify-center gap-2 transition-all"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>TELEMETRÍA COGNITIVA</span>
                </button>

                <button
                  onClick={() => {
                    onOpenDocs();
                  }}
                  className="py-2 px-4 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 flex items-center justify-center gap-2 transition-all"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>DOCUMENTACIÓN MOTOR</span>
                </button>
              </div>

              {/* Toggles row */}
              <div className="flex items-center justify-between w-full border-t border-stone-800 pt-3 mt-4 text-xs font-tech text-stone-400">
                <button
                  onClick={() => setCrtEnabled(!crtEnabled)}
                  className="flex items-center gap-1.5 hover:text-stone-200"
                >
                  <Tv className="w-3.5 h-3.5" />
                  <span>CRT: {crtEnabled ? 'ON' : 'OFF'}</span>
                </button>
                <button
                  onClick={handleMuteToggle}
                  className="flex items-center gap-1.5 hover:text-stone-200"
                >
                  {soundMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span>AUDIO: {soundMuted ? 'MUTE' : 'ACTIVO'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================================================== */}
        {/* OVERLAY: LEVEL CLEARED */}
        {/* =================================================== */}
        {engine.levelCleared && (
          <div className="absolute inset-0 z-30 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 text-stone-100 animate-in zoom-in-95">
            <div className="bg-stone-900 border-2 border-emerald-500 rounded-xl p-6 max-w-md w-full shadow-2xl flex flex-col items-center text-center">
              <h2 className="font-pixel text-base text-emerald-400 tracking-wider mb-1 text-glow-green">
                ¡SECTOR ASEGURADO!
              </h2>
              <p className="font-tech text-xs text-stone-300 mb-4">
                Has superado el Nivel {engine.currentLevelId}: {level?.name}
              </p>

              {/* Stats recap */}
              <div className="w-full bg-stone-950 p-3 rounded border border-stone-800 text-xs font-tech mb-4 space-y-1.5 text-stone-300 text-left">
                <div className="flex justify-between">
                  <span>Puntuación Acumulada:</span>
                  <span className="font-pixel text-amber-400">{player?.score.toLocaleString()} PTS</span>
                </div>
                <div className="flex justify-between">
                  <span>Salud Restante:</span>
                  <span className="text-emerald-400">{player?.health} / {player?.maxHealth}</span>
                </div>
                <div className="flex justify-between">
                  <span>Autoguardado:</span>
                  <span className="text-cyan-400 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Exitoso en almacenamiento local
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full font-pixel text-xs">
                <button
                  onClick={() => {
                    engine.advanceNextLevel();
                    setTick((t) => t + 1);
                  }}
                  className="py-3 px-4 rounded bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-stone-950 font-bold flex items-center justify-center gap-2 shadow-lg"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>SIGUIENTE SECTOR (NIVEL {Math.min(6, engine.currentLevelId + 1)})</span>
                </button>
                <button
                  onClick={onOpenBreathing}
                  className="py-2 px-4 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center gap-1.5"
                >
                  <Wind className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Respirar antes de continuar</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================================================== */}
        {/* OVERLAY: GAME OVER */}
        {/* =================================================== */}
        {engine.gameOver && (
          <div className="absolute inset-0 z-30 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 text-stone-100 animate-in zoom-in-95">
            <div className="bg-stone-900 border-2 border-red-600 rounded-xl p-6 max-w-sm w-full shadow-2xl flex flex-col items-center text-center">
              <h2 className="font-pixel text-base text-red-500 tracking-wider mb-2 text-glow-red">
                FIN DE LA MISIÓN
              </h2>
              <p className="font-tech text-xs text-stone-400 mb-4">
                El agente Logan ha caído. La bio-amenaza continúa expandiéndose.
              </p>

              <div className="flex flex-col gap-2.5 w-full font-pixel text-xs">
                <button
                  onClick={() => {
                    engine.setupLevel(engine.currentLevelId, false);
                    setTick((t) => t + 1);
                  }}
                  className="py-3 px-4 rounded bg-red-600 hover:bg-red-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>REINTENTAR DESDE PUNTO DE GUARDADO</span>
                </button>

                <button
                  onClick={onOpenBreathing}
                  className="py-2 px-4 rounded bg-emerald-950 border border-emerald-600 text-emerald-300 flex items-center justify-center gap-1.5"
                >
                  <Wind className="w-3.5 h-3.5" />
                  <span>Calmar tensión y reintentar</span>
                </button>

                <button
                  onClick={onOpenLevelSelect}
                  className="py-2 px-4 rounded bg-stone-800 text-stone-300 hover:bg-stone-700 flex items-center justify-center gap-2"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Seleccionar Nivel Desbloqueado</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================================================== */}
        {/* OVERLAY: ULTIMATE VICTORY (TITAN OMEGA DEFEATED) */}
        {/* =================================================== */}
        {engine.gameVictory && (
          <div className="absolute inset-0 z-30 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 text-stone-100 animate-in zoom-in-95">
            <div className="bg-stone-900 border-2 border-amber-400 rounded-xl p-6 max-w-md w-full shadow-2xl flex flex-col items-center text-center">
              <Award className="w-12 h-12 text-amber-400 mb-2 animate-bounce" />
              <h2 className="font-pixel text-base text-amber-300 tracking-wider mb-1 text-glow-amber">
                ¡VICTORIA ABSOLUTA!
              </h2>
              <p className="font-tech text-xs text-stone-300 mb-4">
                ¡El Titán Bio-Cibernético Omega ha sido destruido y la Tierra está a salvo! Has completado los 6 sectores con éxito.
              </p>

              <div className="bg-stone-950 p-3 rounded border border-stone-800 text-xs font-tech w-full mb-4 space-y-1">
                <div className="flex justify-between">
                  <span>Puntuación Final Total:</span>
                  <span className="font-pixel text-amber-400">{player?.score.toLocaleString()} PTS</span>
                </div>
                <div className="flex justify-between">
                  <span>Autoguardado de Récord:</span>
                  <span className="text-emerald-400">Registrado localmente</span>
                </div>
              </div>

              <button
                onClick={() => {
                  engine.setupLevel(1, false);
                  setTick((t) => t + 1);
                }}
                className="w-full py-3 rounded bg-amber-500 hover:bg-amber-400 text-black font-pixel text-xs font-bold shadow-lg flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>NUEVA PARTIDA (SECTOR 01)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. BOTTOM CONTROL STRIP */}
      <div className="z-20 bg-stone-950/90 border-t border-stone-800 p-2 flex items-center justify-between text-xs font-tech text-stone-400">
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline">
            Controles: <strong className="text-stone-200">A/D o Flechas</strong> mover | <strong className="text-stone-200">Espacio</strong> saltar | <strong className="text-stone-200">J/X</strong> disparar | <strong className="text-stone-200">G/C</strong> granada | <strong className="text-stone-200">Shift</strong> dash
          </span>
          <span className="sm:hidden text-[11px]">
            Soporta Mando USB/Bluetooth & Pantalla Táctil
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Virtual touch controls toggle */}
          <button
            onClick={onToggleTouchControls}
            className={`px-2 py-1 rounded text-[10px] font-pixel border transition-colors flex items-center gap-1 ${
              showTouchControls
                ? 'bg-cyan-950 text-cyan-300 border-cyan-500'
                : 'bg-stone-900 text-stone-400 border-stone-700'
            }`}
            title="Mostrar / Ocultar Controles Táctiles en Pantalla"
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">TOUCH</span>
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors"
            title="Pantalla Completa"
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
