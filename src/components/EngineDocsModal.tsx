/**
 * @file /src/components/EngineDocsModal.tsx
 * Comprehensive Engine Documentation & Developer Modding Guide for future updates.
 */

import React, { useState } from 'react';
import { BookOpen, Code, Cpu, Layers, Music, Sliders, X, Zap } from 'lucide-react';

interface EngineDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EngineDocsModal: React.FC<EngineDocsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'arch' | 'levels' | 'sprites' | 'audio' | 'neuro'>('arch');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-stone-900 border-2 border-cyan-500 rounded-xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl text-stone-100 relative animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h2 className="font-pixel text-xs text-cyan-300 tracking-wider">
              MANUAL TÉCNICO DEL MOTOR 2D RETRO
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-100 p-1 transition-colors"
            aria-label="Cerrar Documentación"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-1 border-b border-stone-800 bg-stone-950/60 p-2 overflow-x-auto text-xs font-pixel">
          <button
            onClick={() => setActiveTab('arch')}
            className={`px-3 py-1.5 rounded flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'arch' ? 'bg-cyan-600 text-stone-950 font-bold' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Arquitectura</span>
          </button>
          <button
            onClick={() => setActiveTab('levels')}
            className={`px-3 py-1.5 rounded flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'levels' ? 'bg-cyan-600 text-stone-950 font-bold' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Creación de Niveles</span>
          </button>
          <button
            onClick={() => setActiveTab('sprites')}
            className={`px-3 py-1.5 rounded flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'sprites' ? 'bg-cyan-600 text-stone-950 font-bold' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Sprites & Texturas</span>
          </button>
          <button
            onClick={() => setActiveTab('audio')}
            className={`px-3 py-1.5 rounded flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'audio' ? 'bg-cyan-600 text-stone-950 font-bold' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Sintetizador Chiptune</span>
          </button>
          <button
            onClick={() => setActiveTab('neuro')}
            className={`px-3 py-1.5 rounded flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'neuro' ? 'bg-cyan-600 text-stone-950 font-bold' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Neuro-Evaluación</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto font-tech text-stone-300 text-sm leading-relaxed space-y-4">
          {activeTab === 'arch' && (
            <div>
              <h3 className="text-cyan-400 font-pixel text-xs mb-2">1. Arquitectura Modular del Motor</h3>
              <p>
                El motor está estructurado en módulos desacoplados diseñados para máxima eficiencia, portabilidad y ejecución 100% offline sin dependencias pesadas:
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-3 text-stone-300">
                <li><strong className="text-cyan-300">GameEngine.ts:</strong> Bucle de renderizado a 60 FPS coordinado con <code>requestAnimationFrame</code>, física delta-time protegida contra túneles, detección de colisiones AABB y cámara lerp con retro-sacudida (screen shake).</li>
                <li><strong className="text-cyan-300">AudioEngine.ts:</strong> Sintetizador procedural 8-bit mediante Web Audio API pura (ondas cuadradas, sierra, ruido blanco bitcrushed y tonos senoidales terapéuticos de 432 Hz).</li>
                <li><strong className="text-cyan-300">InputManager.ts:</strong> Abstracción unificada de Teclado, Gamepad API (con retroalimentación háptica / vibración) y Joysticks táctiles virtuales para móviles.</li>
                <li><strong className="text-cyan-300">StorageManager.ts:</strong> Autosave continuo entre mapas y checkpoints utilizando LocalStorage con soporte de respaldo en memoria.</li>
                <li><strong className="text-cyan-300">NeuroCognitive.ts:</strong> Motor de telemetría que evalúa en tiempo real latencia de reacción psicomotora, entropía de pulsaciones e índice de ansiedad.</li>
              </ul>
            </div>
          )}

          {activeTab === 'levels' && (
            <div>
              <h3 className="text-cyan-400 font-pixel text-xs mb-2">2. Formato de Niveles y Expansión de Mapas</h3>
              <p>
                Los niveles se definen como objetos <code>LevelDefinition</code> en <code>/src/engine/LevelData.ts</code>. Para añadir un nuevo nivel, implemente la función fábrica y regístrela en <code>ALL_LEVELS</code>:
              </p>
              <div className="bg-black/60 p-3 rounded border border-stone-800 font-mono text-xs text-stone-200 my-3">
                <span className="text-cyan-400">// Leyenda de Baldosas (Tiles 32x32):</span><br/>
                0: Aire / Vacío (traspasable)<br/>
                1: Bloque Metálico Sólido (pared y piso)<br/>
                2: Viga / Plataforma (permite saltar desde abajo)<br/>
                3: Tubería Industrial<br/>
                4: Escalera Trepable (WASD / Flechas Arriba-Abajo)<br/>
                5: Consola / Terminal Cibernético<br/>
                6: Ácido Tóxico / Lodo (Daño por contacto)<br/>
                7: Púas y Trampas Mecánicas<br/>
                8: Airlock / Portal de Salida (requiere tarjeta)
              </div>
              <p>
                Cada nivel incluye además puntos de reaparición (checkpoints), enemigos con rangos de patrulla dinámicos y coleccionables tácticos.
              </p>
            </div>
          )}

          {activeTab === 'sprites' && (
            <div>
              <h3 className="text-cyan-400 font-pixel text-xs mb-2">3. Pipeline de Sprites y Texturizado 8-Bit</h3>
              <p>
                <code>Sprites.ts</code> utiliza lienzos fuera de pantalla (<code>offscreen canvases</code>) pre-renderizados al inicializar para garantizar 0 latencia en render y 60 FPS sostenidos en cualquier dispositivo móvil o de escritorio:
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li><strong className="text-cyan-300">Paleta EGA Clásica:</strong> Los colores respetan la auténtica gama DOS de 16 colores (EGA_PALETTE), logrando la estética fiel de Bio Menace.</li>
                <li><strong className="text-cyan-300">Texturas Reales:</strong> Los fondos se enriquecen con texturas de superficies reales (metales oxidados, laboratorios químicos, circuitos) procesadas y pixeladas para mantener la coherencia retro.</li>
                <li><strong className="text-cyan-300">Escalado Pixel-Art:</strong> Se aplica <code>imageSmoothingEnabled = false</code> y la clase <code>image-rendering: pixelated</code>.</li>
              </ul>
            </div>
          )}

          {activeTab === 'audio' && (
            <div>
              <h3 className="text-cyan-400 font-pixel text-xs mb-2">4. Sintetizador Chiptune y Secuenciador Procedural</h3>
              <p>
                El motor de audio no requiere ningún archivo externo (evitando errores 404 o descargas en modo offline):
              </p>
              <div className="bg-black/60 p-3 rounded border border-stone-800 font-mono text-xs text-stone-200 my-2">
                - Línea Melódica: Oscilador onda cuadrada con pitch slides.<br/>
                - Línea de Bajo: Onda triangular o pulso a 1/2 octava.<br/>
                - Percusión Retro: Buffer con ruido blanco bitcrushed filtrado (Lowpass + Kick sintetizado).<br/>
                - 432 Hz Calm Mode: Doble onda senoidal con batimiento binaural armónico para respiración guiada.
              </div>
            </div>
          )}

          {activeTab === 'neuro' && (
            <div>
              <h3 className="text-cyan-400 font-pixel text-xs mb-2">5. Sistema de Evaluación Neuro-Cognitiva</h3>
              <p>
                El módulo <code>NeuroCognitiveTracker</code> supervisa continuamente la interacción del usuario:
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li><strong className="text-cyan-300">Latencia de Reacción (ms):</strong> Mide el lapso entre la emisión de un proyectil enemigo y la maniobra evasiva del jugador (salto, disparo, dash).</li>
                <li><strong className="text-cyan-300">Entropía de Pulsaciones (Hz):</strong> Detecta el "panic tapping" (golpeo caótico y repetido de teclas sin precisión táctica).</li>
                <li><strong className="text-cyan-300">Frecuencia Cardíaca Estimada:</strong> Simulación bio-computacional que proyecta la activación del sistema nervioso simpático.</li>
                <li><strong className="text-cyan-300">Intervención de Calma:</strong> Si el índice de estrés supera el 75%, el juego emite una notificación no invasiva invitando al usuario a realizar ejercicios de respiración 4-7-8 para recuperar el equilibrio autonómico.</li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-stone-800 bg-stone-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-stone-950 font-pixel text-xs"
          >
            ENTENDIDO
          </button>
        </div>
      </div>
    </div>
  );
};
