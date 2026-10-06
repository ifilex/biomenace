/**
 * @file /src/components/BreathingModal.tsx
 * Calming Guided Breathing Module.
 * Provides scientifically proven respiratory techniques (4-7-8 & Box Breathing)
 * accompanied by harmonious 432Hz ambient audio and visual rhythmic pacing.
 */

import React, { useState, useEffect, useRef } from 'react';
import { sound } from '../engine/AudioEngine';
import { neuro } from '../engine/NeuroCognitive';
import { notify } from '../engine/NotificationSystem';
import { Check, Heart, Play, RotateCcw, Volume2, VolumeX, Wind, X } from 'lucide-react';

interface BreathingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Technique = '4-7-8' | 'box';
type Phase = 'inhale' | 'hold' | 'exhale' | 'hold_empty';

export const BreathingModal: React.FC<BreathingModalProps> = ({ isOpen, onClose }) => {
  const [technique, setTechnique] = useState<Technique>('4-7-8');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [phase, setPhase] = useState<Phase>('inhale');
  const [countdown, setCountdown] = useState<number>(4);
  const [completedCycles, setCompletedCycles] = useState<number>(0);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);

  const timerRef = useRef<number | null>(null);

  // Technique timing maps (in seconds)
  const durations = {
    '4-7-8': {
      inhale: 4,
      hold: 7,
      exhale: 8,
      hold_empty: 0
    },
    'box': {
      inhale: 4,
      hold: 4,
      exhale: 4,
      hold_empty: 4
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (audioEnabled) {
        sound.startCalmAmbient();
      }
      setIsActive(true);
      resetCycle();
    } else {
      sound.stopCalmAmbient();
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      sound.stopCalmAmbient();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, audioEnabled]);

  const resetCycle = () => {
    setPhase('inhale');
    setCountdown(durations[technique].inhale);
  };

  // Breathing loop timer
  useEffect(() => {
    if (!isOpen || !isActive) return;

    timerRef.current = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev > 1) return prev - 1;

        // Transition to next phase
        const curDur = durations[technique];
        if (phase === 'inhale') {
          setPhase('hold');
          return curDur.hold;
        } else if (phase === 'hold') {
          setPhase('exhale');
          return curDur.exhale;
        } else if (phase === 'exhale') {
          if (technique === 'box') {
            setPhase('hold_empty');
            return curDur.hold_empty;
          } else {
            // Completed cycle
            setCompletedCycles((c) => c + 1);
            setPhase('inhale');
            return curDur.inhale;
          }
        } else if (phase === 'hold_empty') {
          setCompletedCycles((c) => c + 1);
          setPhase('inhale');
          return curDur.inhale;
        }
        return 4;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, isActive, phase, technique]);

  if (!isOpen) return null;

  const handleFinish = () => {
    sound.stopCalmAmbient();
    neuro.applyBreathingRecovery(completedCycles >= 2 ? 40 : 25);
    notify.push(
      'Estado Calmo Restablecido',
      `Has completado ${completedCycles} ciclo(s) de respiración. ¡Tu mente está lista y enfocada!`,
      'calm',
      4000
    );
    onClose();
  };

  // Visual text and circle scaling based on phase
  let phaseText = 'Inhala profundamente por la nariz';
  let phaseTitle = 'INHALAR';
  let circleScale = 'scale-100';
  let circleColor = 'border-cyan-400 bg-cyan-900/30 text-cyan-300';

  if (phase === 'inhale') {
    phaseTitle = 'INHALA';
    phaseText = 'Llena tus pulmones despacio y profundamente';
    circleScale = 'scale-125 duration-[4000ms]';
    circleColor = 'border-cyan-400 bg-cyan-900/40 text-cyan-300 shadow-cyan-500/30';
  } else if (phase === 'hold') {
    phaseTitle = 'SOSTÉN';
    phaseText = 'Mantén el aire con serenidad en tu pecho';
    circleScale = 'scale-125 duration-300';
    circleColor = 'border-amber-400 bg-amber-900/40 text-amber-300 shadow-amber-500/30';
  } else if (phase === 'exhale') {
    phaseTitle = 'EXHALA';
    phaseText = 'Suelta todo el aire suavemente por la boca';
    circleScale = 'scale-90 duration-[8000ms]';
    circleColor = 'border-emerald-400 bg-emerald-900/40 text-emerald-300 shadow-emerald-500/30';
  } else if (phase === 'hold_empty') {
    phaseTitle = 'PAUSA';
    phaseText = 'Permanece en calma con los pulmones vacíos';
    circleScale = 'scale-90 duration-300';
    circleColor = 'border-purple-400 bg-purple-900/40 text-purple-300 shadow-purple-500/30';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-stone-900 border-2 border-emerald-500/80 rounded-xl max-w-md w-full p-6 shadow-2xl text-stone-100 flex flex-col items-center relative animate-in fade-in zoom-in-95">
        {/* Close button */}
        <button
          onClick={handleFinish}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-100 p-1 transition-colors"
          aria-label="Cerrar y Reanudar Juego"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title Header */}
        <div className="flex items-center gap-2 mb-2">
          <Wind className="w-5 h-5 text-emerald-400" />
          <h2 className="font-pixel text-sm text-emerald-400 tracking-wider">
            RESPIRACIÓN GUIADA CONSCIENTE
          </h2>
        </div>
        <p className="text-xs text-stone-300 font-tech text-center mb-5">
          Modula tu sistema nervioso autónomo y recupera el control psicomotor.
        </p>

        {/* Technique Switcher */}
        <div className="flex gap-2 p-1 bg-stone-950 rounded-lg border border-stone-800 mb-6">
          <button
            onClick={() => {
              setTechnique('4-7-8');
              resetCycle();
            }}
            className={`px-3 py-1.5 rounded text-[11px] font-pixel transition-all ${
              technique === '4-7-8'
                ? 'bg-emerald-600 text-stone-950 font-bold shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Método 4-7-8 (Calmante)
          </button>
          <button
            onClick={() => {
              setTechnique('box');
              resetCycle();
            }}
            className={`px-3 py-1.5 rounded text-[11px] font-pixel transition-all ${
              technique === 'box'
                ? 'bg-emerald-600 text-stone-950 font-bold shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Respiración Cuadrada (4-4-4-4)
          </button>
        </div>

        {/* Interactive Breathing Visual Circle */}
        <div className="relative w-52 h-52 flex items-center justify-center my-4">
          {/* Subtle pulsating outer halos */}
          <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-ping opacity-25" />
          <div className="absolute inset-2 rounded-full border border-emerald-500/30" />

          {/* Main animated expanding/contracting circle */}
          <div
            className={`w-40 h-40 rounded-full border-4 shadow-2xl flex flex-col items-center justify-center transition-all ease-in-out ${circleScale} ${circleColor}`}
          >
            <span className="font-pixel text-xs tracking-widest uppercase mb-1">
              {phaseTitle}
            </span>
            <span className="font-pixel text-4xl font-bold">
              {countdown}
            </span>
            <span className="text-[10px] font-tech opacity-75 mt-1">segundos</span>
          </div>
        </div>

        {/* Guidance Prompt */}
        <p className="text-sm font-tech text-emerald-200 text-center min-h-[2.5rem] mt-2 mb-4 px-4 font-medium">
          {phaseText}
        </p>

        {/* Metrics summary row */}
        <div className="flex items-center justify-between w-full border-t border-stone-800 pt-4 mb-5 text-xs font-tech text-stone-400">
          <div className="flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-rose-400" />
            <span>Ciclos completados: <strong className="text-stone-200 font-pixel text-[11px]">{completedCycles}</strong></span>
          </div>
          <button
            onClick={() => {
              const next = !audioEnabled;
              setAudioEnabled(next);
              if (next) sound.startCalmAmbient();
              else sound.stopCalmAmbient();
            }}
            className="flex items-center gap-1 hover:text-stone-200 transition-colors"
          >
            {audioEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-stone-500" />}
            <span>Tono 432Hz</span>
          </button>
        </div>

        {/* Action button */}
        <button
          onClick={handleFinish}
          className="w-full py-3 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 active:to-teal-700 text-stone-950 font-pixel text-xs tracking-wide shadow-xl flex items-center justify-center gap-2 transition-all"
        >
          <Check className="w-4 h-4" />
          <span>REANUDAR MISIÓN CON CALMA</span>
        </button>
      </div>
    </div>
  );
};
