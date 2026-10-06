/**
 * @file /src/components/LevelSelectModal.tsx
 * Level Selection & Autosaved Progress Manager for all 6 game maps.
 */

import React from 'react';
import { ALL_LEVELS } from '../engine/LevelData';
import { storage } from '../engine/StorageManager';
import { Check, Lock, Play, Star, Trophy, X } from 'lucide-react';

interface LevelSelectModalProps {
  isOpen: boolean;
  currentLevel: number;
  unlockedLevels: number[];
  onSelectLevel: (lvl: number) => void;
  onClose: () => void;
}

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  isOpen,
  currentLevel,
  unlockedLevels,
  onSelectLevel,
  onClose
}) => {
  if (!isOpen) return null;

  const levelIds = [1, 2, 3, 4, 5, 6];
  const save = storage.loadSave();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-stone-900 border-2 border-amber-500 rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl text-stone-100 relative animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="font-pixel text-xs text-amber-300 tracking-wider">
              SELECCIÓN DE SECTOR (6 NIVELES)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-100 p-1 transition-colors"
            aria-label="Cerrar Selector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* High score badge */}
        <div className="bg-stone-950 px-4 py-2 flex items-center justify-between text-xs font-tech border-b border-stone-800">
          <span className="text-stone-400">Puntaje Máximo Guardado:</span>
          <span className="font-pixel text-amber-400 text-sm">
            {save.highestScore.toLocaleString()} PTS
          </span>
        </div>

        {/* Level Cards Grid */}
        <div className="p-4 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-3">
          {levelIds.map((id) => {
            const factory = ALL_LEVELS[id];
            const def = factory();
            const isUnlocked = unlockedLevels.includes(id) || id === 1;
            const isCurrent = currentLevel === id;

            return (
              <div
                key={id}
                className={`p-3 rounded-lg border-2 transition-all flex flex-col justify-between ${
                  isCurrent
                    ? 'border-amber-400 bg-amber-950/30 shadow-lg shadow-amber-500/20'
                    : isUnlocked
                    ? 'border-stone-700 bg-stone-950/70 hover:border-stone-500'
                    : 'border-stone-800 bg-stone-950/40 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-pixel text-[11px] text-stone-200">
                      NIVEL {id}: {def.name}
                    </span>
                    {isUnlocked ? (
                      <span className="text-[10px] font-pixel px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-600">
                        DISPONIBLE
                      </span>
                    ) : (
                      <span className="text-[10px] font-pixel px-1.5 py-0.5 rounded bg-stone-800 text-stone-400 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> BLOQ
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-tech text-stone-400 mb-2 line-clamp-2 leading-tight">
                    {def.description}
                  </p>

                  {/* Difficulty stars */}
                  <div className="flex items-center gap-1 mb-3">
                    <span className="text-[10px] font-tech text-stone-500 mr-1">Dificultad:</span>
                    {Array.from({ length: 6 }).map((_, sIdx) => (
                      <Star
                        key={sIdx}
                        className={`w-3 h-3 ${
                          sIdx < def.difficultyRating ? 'text-amber-400 fill-amber-400' : 'text-stone-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <button
                  disabled={!isUnlocked}
                  onClick={() => {
                    onSelectLevel(id);
                    onClose();
                  }}
                  className={`w-full py-2 rounded font-pixel text-xs flex items-center justify-center gap-2 transition-all ${
                    isCurrent
                      ? 'bg-amber-500 text-black font-bold shadow'
                      : isUnlocked
                      ? 'bg-stone-800 hover:bg-stone-700 text-stone-200 active:bg-stone-600'
                      : 'bg-stone-900 text-stone-600 cursor-not-allowed'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isCurrent ? 'REINICIAR NIVEL' : 'INICIAR MISIÓN'}</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-stone-800 bg-stone-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 font-pixel text-xs"
          >
            VOLVER AL JUEGO
          </button>
        </div>
      </div>
    </div>
  );
};
