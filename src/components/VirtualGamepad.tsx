/**
 * @file /src/components/VirtualGamepad.tsx
 * Virtual Touch Joystick & Action Buttons for mobile devices & tablets.
 * Supports fluid multi-touch, touch drag stick, and tactile feedback.
 */

import React, { useRef, useState, useEffect } from 'react';
import { input } from '../engine/InputManager';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Zap, Target, Bomb, Flame, RefreshCw } from 'lucide-react';

interface VirtualGamepadProps {
  onNextWeapon?: () => void;
}

export const VirtualGamepad: React.FC<VirtualGamepadProps> = ({ onNextWeapon }) => {
  const stickBaseRef = useRef<HTMLDivElement>(null);
  const [stickOffset, setStickOffset] = useState({ x: 0, y: 0 });
  const [isDraggingStick, setIsDraggingStick] = useState(false);
  const activeTouchId = useRef<number | null>(null);

  // Clean up input state on unmount
  useEffect(() => {
    return () => {
      input.touchState = {};
    };
  }, []);

  // Joystick touch handlers
  const handleStickStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (activeTouchId.current !== null) return;

    const touch = e.changedTouches[0];
    activeTouchId.current = touch.identifier;
    setIsDraggingStick(true);
    updateStickPos(touch.clientX, touch.clientY);
  };

  const handleStickMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (activeTouchId.current === null) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === activeTouchId.current) {
        updateStickPos(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleStickEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === activeTouchId.current) {
        activeTouchId.current = null;
        setIsDraggingStick(false);
        setStickOffset({ x: 0, y: 0 });
        input.touchState.left = false;
        input.touchState.right = false;
        input.touchState.up = false;
        input.touchState.down = false;
        break;
      }
    }
  };

  const updateStickPos = (clientX: number, clientY: number) => {
    if (!stickBaseRef.current) return;
    const rect = stickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const maxRadius = rect.width / 2 - 12;

    const dist = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);

    const clampedDist = Math.min(dist, maxRadius);
    const nx = Math.cos(angle) * clampedDist;
    const ny = Math.sin(angle) * clampedDist;

    setStickOffset({ x: nx, y: ny });

    // Directional thresholds
    const threshold = 14;
    input.touchState.left = nx < -threshold;
    input.touchState.right = nx > threshold;
    input.touchState.up = ny < -threshold;
    input.touchState.down = ny > threshold;
  };

  // Button touch helpers
  const bindButton = (key: 'jump' | 'shoot' | 'grenade' | 'dash') => ({
    onTouchStart: (e: React.TouchEvent) => {
      e.preventDefault();
      input.touchState[key] = true;
    },
    onTouchEnd: (e: React.TouchEvent) => {
      e.preventDefault();
      input.touchState[key] = false;
    },
    onMouseDown: () => {
      input.touchState[key] = true;
    },
    onMouseUp: () => {
      input.touchState[key] = false;
    },
    onMouseLeave: () => {
      input.touchState[key] = false;
    }
  });

  return (
    <div className="w-full pointer-events-none select-none px-4 pb-4 pt-2 flex items-end justify-between">
      {/* Left side: Analog Virtual Joystick & D-Pad helper */}
      <div className="pointer-events-auto flex flex-col items-center">
        <div
          ref={stickBaseRef}
          onTouchStart={handleStickStart}
          onTouchMove={handleStickMove}
          onTouchEnd={handleStickEnd}
          onTouchCancel={handleStickEnd}
          className="relative w-36 h-36 rounded-full bg-stone-900/80 border-2 border-stone-700 backdrop-blur-md shadow-2xl flex items-center justify-center touch-none active:border-cyan-500"
        >
          {/* Subtle directional indicators */}
          <ArrowUp className="absolute top-2 w-4 h-4 text-stone-500" />
          <ArrowDown className="absolute bottom-2 w-4 h-4 text-stone-500" />
          <ArrowLeft className="absolute left-2 w-4 h-4 text-stone-500" />
          <ArrowRight className="absolute right-2 w-4 h-4 text-stone-500" />

          {/* Draggable thumbpad stick */}
          <div
            className={`w-14 h-14 rounded-full bg-gradient-to-br from-cyan-600 to-blue-700 border-2 border-cyan-300 shadow-lg flex items-center justify-center transition-transform ${
              isDraggingStick ? 'scale-105 shadow-cyan-500/50' : 'duration-75'
            }`}
            style={{
              transform: `translate(${stickOffset.x}px, ${stickOffset.y}px)`
            }}
          >
            <div className="w-5 h-5 rounded-full bg-cyan-200/50" />
          </div>
        </div>
        <span className="text-[10px] font-pixel text-stone-400 mt-1 uppercase tracking-wider">
          Stick Táctil
        </span>
      </div>

      {/* Center button: Quick Weapon Switch */}
      <div className="pointer-events-auto flex flex-col items-center mb-2">
        <button
          onClick={() => {
            if (onNextWeapon) onNextWeapon();
            else input.touchState.nextWeapon = true;
          }}
          className="px-3 py-1.5 rounded-full bg-stone-800/90 border border-amber-500/60 text-amber-400 text-xs font-pixel flex items-center gap-1.5 shadow-md active:bg-amber-500 active:text-black transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Arma</span>
        </button>
      </div>

      {/* Right side: Action Buttons Diamond (Jump, Shoot, Grenade, Dash) */}
      <div className="pointer-events-auto relative w-44 h-44">
        {/* Dash (Top - Y / Cyan) */}
        <button
          {...bindButton('dash')}
          className="absolute top-0 left-16 w-13 h-13 rounded-full bg-cyan-950/80 border-2 border-cyan-400 active:bg-cyan-500 active:text-black text-cyan-300 font-pixel text-[11px] shadow-lg flex flex-col items-center justify-center transition-transform active:scale-95"
          title="Dash Esquiva"
        >
          <Zap className="w-4 h-4 mb-0.5" />
          <span>DASH</span>
        </button>

        {/* Grenade (Left - X / Orange) */}
        <button
          {...bindButton('grenade')}
          className="absolute top-14 left-1 w-13 h-13 rounded-full bg-amber-950/80 border-2 border-amber-500 active:bg-amber-500 active:text-black text-amber-300 font-pixel text-[11px] shadow-lg flex flex-col items-center justify-center transition-transform active:scale-95"
          title="Lanzar Granada"
        >
          <Bomb className="w-4 h-4 mb-0.5" />
          <span>GRAN</span>
        </button>

        {/* Shoot (Right - B / Red) */}
        <button
          {...bindButton('shoot')}
          className="absolute top-14 right-1 w-14 h-14 rounded-full bg-red-950/90 border-2 border-red-500 active:bg-red-500 active:text-black text-red-300 font-pixel text-xs shadow-lg flex flex-col items-center justify-center transition-transform active:scale-95"
          title="Disparar Arma"
        >
          <Flame className="w-4 h-4 mb-0.5" />
          <span>FUEGO</span>
        </button>

        {/* Jump (Bottom - A / Green) */}
        <button
          {...bindButton('jump')}
          className="absolute bottom-0 left-16 w-14 h-14 rounded-full bg-emerald-950/90 border-2 border-emerald-400 active:bg-emerald-500 active:text-black text-emerald-300 font-pixel text-xs shadow-lg flex flex-col items-center justify-center transition-transform active:scale-95"
          title="Saltar"
        >
          <Target className="w-4 h-4 mb-0.5" />
          <span>SALTO</span>
        </button>
      </div>
    </div>
  );
};
