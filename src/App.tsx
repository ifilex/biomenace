/**
 * @file /src/App.tsx
 * Bio-Menace 8-Bit Retro Game with 6 Levels, Fluid Gamepad/Touch Controls,
 * Procedural Chiptune Audio, Real-Time Neuro-Cognitive Assessment & Calming Breathing.
 */

import React, { useState, useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { VirtualGamepad } from './components/VirtualGamepad';
import { PushNotificationBanner } from './components/PushNotificationBanner';
import { BreathingModal } from './components/BreathingModal';
import { EngineDocsModal } from './components/EngineDocsModal';
import { LevelSelectModal } from './components/LevelSelectModal';
import { neuro } from './engine/NeuroCognitive';
import { notify } from './engine/NotificationSystem';
import { engine } from './engine/GameEngine';
import { storage } from './engine/StorageManager';
import {
  Activity,
  Award,
  Bell,
  BookOpen,
  Cpu,
  Gamepad2,
  Heart,
  Shield,
  Smartphone,
  Wifi,
  WifiOff,
  Wind
} from 'lucide-react';

export default function App() {
  const [breathingOpen, setBreathingOpen] = useState<boolean>(false);
  const [docsOpen, setDocsOpen] = useState<boolean>(false);
  const [levelSelectOpen, setLevelSelectOpen] = useState<boolean>(false);
  const [showTouchControls, setShowTouchControls] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [pushPermitted, setPushPermitted] = useState<boolean>(notify.isPushGranted());

  // Detect mobile or touch environment by default
  useEffect(() => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouch) {
      setShowTouchControls(true);
    }
  }, []);

  // Online / Offline monitor
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Wire automatic anxiety intervention detector
  useEffect(() => {
    neuro.setOnAnxietyDetected((metrics) => {
      notify.push(
        '⚠️ Tensión Psicomotora Elevada',
        `Estrés al ${metrics.stressLevel}%. Se sugiere realizar 1 minuto de respiración guiada 4-7-8 para estabilizar reflejos.`,
        'calm',
        6000
      );
    });
  }, []);

  const handleLevelSelect = (lvl: number) => {
    engine.setupLevel(lvl, true);
  };

  const handleRequestPushNotifications = async () => {
    const granted = await notify.requestBrowserPermission();
    setPushPermitted(granted);
    if (granted) {
      notify.push(
        'Notificaciones Push Activadas',
        'Recibirás alertas en tiempo real de eventos clave y logros del juego.',
        'achievement',
        3500
      );
    } else {
      notify.push(
        'Notificaciones del Sistema',
        'Las notificaciones se mostrarán en la interfaz del juego.',
        'info',
        3000
      );
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col items-center justify-between p-2 sm:p-4 font-sans selection:bg-cyan-500 selection:text-black">
      {/* Real-time Push Notifications Host */}
      <PushNotificationBanner />

      {/* TOP RETRO NAV HEADER */}
      <header className="w-full max-w-5xl flex items-center justify-between py-2 px-3 mb-2 bg-stone-900/70 border border-stone-800 rounded-lg shadow-md backdrop-blur-md">
        {/* Game Title & Bio Menace Badge */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-red-600 to-amber-600 border border-amber-300 flex items-center justify-center font-pixel text-xs text-black font-bold shadow-md shadow-red-500/20">
            BM
          </div>
          <div>
            <h1 className="font-pixel text-xs sm:text-sm text-cyan-400 tracking-wider text-glow-cyan">
              BIO-MENACE: NEURO-STRIKE
            </h1>
            <div className="flex items-center gap-2 text-[10px] font-tech text-stone-400">
              <span className="text-amber-400">Motor 2D 8-Bit</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <Wifi className="w-3 h-3" /> Modo Offline Funcional
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Level Select */}
          <button
            onClick={() => setLevelSelectOpen(true)}
            className="px-2.5 py-1.5 rounded bg-stone-800 hover:bg-stone-700 text-amber-300 font-pixel text-[10px] flex items-center gap-1.5 transition-colors border border-amber-500/40"
            title="Seleccionar Nivel (6 Sectores)"
          >
            <Award className="w-3.5 h-3.5" />
            <span className="hidden md:inline">6 NIVELES</span>
          </button>

          {/* Guided Breathing */}
          <button
            onClick={() => {
              engine.isPaused = true;
              setBreathingOpen(true);
            }}
            className="px-2.5 py-1.5 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 font-pixel text-[10px] flex items-center gap-1.5 transition-colors border border-emerald-500/50 shadow-sm"
            title="Iniciar Respiración Guiada para Calmar la Ansiedad"
          >
            <Wind className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">RESPIRACIÓN</span>
          </button>

          {/* Technical Documentation */}
          <button
            onClick={() => setDocsOpen(true)}
            className="px-2.5 py-1.5 rounded bg-stone-800 hover:bg-stone-700 text-cyan-300 font-pixel text-[10px] flex items-center gap-1.5 transition-colors border border-cyan-500/40"
            title="Documentación del Motor para Futuras Actualizaciones"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden md:inline">MANUAL</span>
          </button>

          {/* Push notification permission toggle */}
          <button
            onClick={handleRequestPushNotifications}
            className={`p-1.5 rounded text-[10px] border transition-colors ${
              pushPermitted
                ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                : 'bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200'
            }`}
            title={pushPermitted ? 'Notificaciones Push Activas' : 'Habilitar Notificaciones Push'}
          >
            <Bell className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* MAIN GAME CANVAS CONTAINER */}
      <main className="w-full flex flex-col items-center justify-center flex-1 my-auto">
        <GameCanvas
          onOpenBreathing={() => {
            engine.isPaused = true;
            setBreathingOpen(true);
          }}
          onOpenDocs={() => {
            engine.isPaused = true;
            setDocsOpen(true);
          }}
          onOpenLevelSelect={() => {
            engine.isPaused = true;
            setLevelSelectOpen(true);
          }}
          showTouchControls={showTouchControls}
          onToggleTouchControls={() => setShowTouchControls(!showTouchControls)}
        />

        {/* ON-SCREEN VIRTUAL GAMEPAD (TOUCH / MOBILE ENVIRONMENT) */}
        {showTouchControls && (
          <div className="w-full max-w-5xl mt-2 animate-in fade-in">
            <VirtualGamepad
              onNextWeapon={() => {
                const list: Array<'blaster' | 'spreader' | 'pulse' | 'grenade'> = ['blaster', 'spreader', 'pulse', 'grenade'];
                const p = engine.player;
                if (p) {
                  const idx = (list.indexOf(p.currentWeapon) + 1) % list.length;
                  p.currentWeapon = list[idx];
                }
              }}
            />
          </div>
        )}
      </main>

      {/* FOOTER INFORMATIONAL STRIP */}
      <footer className="w-full max-w-5xl py-2 px-3 mt-2 bg-stone-900/60 border border-stone-800 rounded-lg flex flex-wrap items-center justify-between text-xs font-tech text-stone-400 gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-400">
            <Cpu className="w-3.5 h-3.5" /> Motor Canvas 60 FPS • Sin dependencias externas
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline text-stone-400">
            Sintetizador Chiptune Web Audio API Original
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-amber-400">
            Autoguardado Local Activo
          </span>
          <span>•</span>
          <button
            onClick={() => setDocsOpen(true)}
            className="text-cyan-400 hover:underline"
          >
            Guía de Desarrollo y Modding
          </button>
        </div>
      </footer>

      {/* MODALS */}
      <BreathingModal
        isOpen={breathingOpen}
        onClose={() => {
          setBreathingOpen(false);
          engine.isPaused = false;
        }}
      />

      <EngineDocsModal
        isOpen={docsOpen}
        onClose={() => setDocsOpen(false)}
      />

      <LevelSelectModal
        isOpen={levelSelectOpen}
        currentLevel={engine.currentLevelId}
        unlockedLevels={storage.loadSave().unlockedLevels}
        onSelectLevel={handleLevelSelect}
        onClose={() => setLevelSelectOpen(false)}
      />
    </div>
  );
}
