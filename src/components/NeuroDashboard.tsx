/**
 * @file /src/components/NeuroDashboard.tsx
 * Real-time Neuro-Cognitive Assessment Dashboard.
 * Visualizes reaction latency, psychomotor entropy, focus score,
 * and cognitive load with calming intervention prompts.
 */

import React, { useEffect, useState } from 'react';
import { neuro } from '../engine/NeuroCognitive';
import { NeuroCognitiveMetrics } from '../types/game';
import { Activity, Brain, Heart, Wind, ShieldAlert, Sparkles, Zap } from 'lucide-react';

interface NeuroDashboardProps {
  onOpenBreathing: () => void;
  compact?: boolean;
}

export const NeuroDashboard: React.FC<NeuroDashboardProps> = ({ onOpenBreathing, compact = false }) => {
  const [metrics, setMetrics] = useState<NeuroCognitiveMetrics>(neuro.getMetrics());

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(neuro.getMetrics());
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // Determine stress category colors
  const isHighStress = metrics.stressLevel >= 75;
  const isAlert = metrics.stressLevel >= 60 && metrics.stressLevel < 75;
  const isOptimal = metrics.stressLevel < 60;

  const stressColor = isHighStress
    ? 'text-red-400 border-red-500 bg-red-950/40'
    : isAlert
    ? 'text-amber-400 border-amber-500 bg-amber-950/40'
    : 'text-emerald-400 border-emerald-500 bg-emerald-950/40';

  if (compact) {
    // Top HUD Compact Badge
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenBreathing}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[10px] font-pixel transition-all ${stressColor}`}
          title="Abrir Evaluación Neuro-Cognitiva y Respiración Guiada"
        >
          <Brain className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">ESTADO:</span>
          <span>{metrics.cognitiveLoadCategory}</span>
          <span className="text-[9px] opacity-75">({metrics.stressLevel}%)</span>
        </button>
        {isHighStress && (
          <button
            onClick={onOpenBreathing}
            className="flex items-center gap-1 px-2 py-1 rounded bg-red-600 text-white text-[10px] font-pixel animate-pulse shadow-lg shadow-red-500/50"
          >
            <Wind className="w-3 h-3" />
            <span className="hidden xs:inline">CALMA</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-stone-900/95 border-2 border-cyan-500/80 rounded-lg p-4 shadow-2xl backdrop-blur-md text-stone-100 max-w-md w-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-cyan-400" />
          <h3 className="font-pixel text-xs text-cyan-300 tracking-wide">
            TELEMETRÍA NEURO-COGNITIVA
          </h3>
        </div>
        <span className={`text-[10px] font-pixel px-2 py-0.5 rounded border ${stressColor}`}>
          {metrics.cognitiveLoadCategory}
        </span>
      </div>

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-2 gap-2.5 mb-3 text-xs">
        {/* Latencia de Reacción */}
        <div className="bg-stone-950/80 border border-stone-800 rounded p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-400 text-[10px] font-tech mb-1">
            <span>TIEMPO REACCIÓN</span>
            <Zap className="w-3 h-3 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-pixel text-base text-amber-300">
              {metrics.reactionTimeMs}
            </span>
            <span className="text-[10px] font-tech text-stone-400">ms</span>
          </div>
          <div className="text-[9px] text-stone-500 font-tech mt-1">
            Objetivo óptimo: &lt; 260 ms
          </div>
        </div>

        {/* Nivel de Estrés / Carga */}
        <div className="bg-stone-950/80 border border-stone-800 rounded p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-400 text-[10px] font-tech mb-1">
            <span>ÍNDICE ESTRÉS</span>
            <ShieldAlert className={`w-3 h-3 ${isHighStress ? 'text-red-400' : 'text-emerald-400'}`} />
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`font-pixel text-base ${isHighStress ? 'text-red-400' : isAlert ? 'text-amber-400' : 'text-emerald-400'}`}>
              {metrics.stressLevel}%
            </span>
          </div>
          <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden mt-1">
            <div
              className={`h-full transition-all duration-300 ${
                isHighStress ? 'bg-red-500' : isAlert ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${metrics.stressLevel}%` }}
            />
          </div>
        </div>

        {/* Concentración / Focus */}
        <div className="bg-stone-950/80 border border-stone-800 rounded p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-400 text-[10px] font-tech mb-1">
            <span>ENFOQUE COGNITIVO</span>
            <Sparkles className="w-3 h-3 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-pixel text-base text-cyan-300">
              {metrics.focusScore}%
            </span>
          </div>
          <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-cyan-400 transition-all duration-300"
              style={{ width: `${metrics.focusScore}%` }}
            />
          </div>
        </div>

        {/* Pulso Simulado y Jitter Motor */}
        <div className="bg-stone-950/80 border border-stone-800 rounded p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-400 text-[10px] font-tech mb-1">
            <span>RITMO CARDIACO SIM</span>
            <Heart className="w-3 h-3 text-rose-400 animate-pulse" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-pixel text-base text-rose-300">
              {metrics.estimatedBpm}
            </span>
            <span className="text-[10px] font-tech text-stone-400">BPM</span>
          </div>
          <div className="text-[9px] text-stone-500 font-tech mt-1 truncate">
            Jitter: {metrics.inputJitterFreq.toFixed(1)} pulsos/s
          </div>
        </div>
      </div>

      {/* Rolling Calmness History Sparkline */}
      <div className="bg-stone-950/80 border border-stone-800 rounded p-2.5 mb-3">
        <div className="flex items-center justify-between text-[10px] font-tech text-stone-400 mb-1">
          <span>CURVA DE CALMA (ÚLTIMOS INTERVALOS)</span>
          <Activity className="w-3 h-3 text-cyan-400" />
        </div>
        <div className="h-10 w-full flex items-end gap-1 pt-1">
          {metrics.calmnessHistory.map((val, idx) => (
            <div
              key={idx}
              className="flex-1 bg-gradient-to-t from-cyan-900 to-cyan-400 rounded-t transition-all duration-300"
              style={{ height: `${Math.max(10, val)}%` }}
              title={`Calma: ${val}%`}
            />
          ))}
        </div>
      </div>

      {/* Guided Breathing Call to Action */}
      <div className="bg-gradient-to-r from-emerald-950/70 to-cyan-950/70 border border-emerald-500/40 rounded p-2.5 flex items-center justify-between gap-2">
        <div className="flex-1 text-[11px] font-tech text-stone-300 leading-tight">
          {isHighStress ? (
            <span className="text-red-300 font-semibold">
              ⚠️ Se detecta tensión psicomotora. Se recomienda un ejercicio de respiración.
            </span>
          ) : (
            <span>
              Realiza 1 minuto de respiración rítmica para optimizar tus reflejos y estabilidad.
            </span>
          )}
        </div>
        <button
          onClick={onOpenBreathing}
          className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-stone-950 font-pixel text-[10px] tracking-wide transition-all shadow-md shrink-0 flex items-center gap-1.5"
        >
          <Wind className="w-3.5 h-3.5" />
          <span>RESPIRAR</span>
        </button>
      </div>
    </div>
  );
};
