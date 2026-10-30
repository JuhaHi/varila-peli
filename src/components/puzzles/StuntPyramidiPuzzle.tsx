'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Activity, Sparkles, CheckCircle2, ArrowLeft, ArrowRight, Shield } from 'lucide-react';
import { soundFX } from '@/lib/audio';

interface Props {
  onSuccessCode?: (code: string) => void;
}

export const StuntPyramidiPuzzle: React.FC<Props> = ({ onSuccessCode }) => {
  const [balance, setBalance] = useState(50); // 0 to 100, target 42-58
  const [holdTime, setHoldTime] = useState(0); // 0 to 4.0 seconds
  const [isCompleted, setIsCompleted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const velocityRef = useRef(0.2);

  // Safe green zone
  const safeMin = 42;
  const safeMax = 58;
  const isInGreen = balance >= safeMin && balance <= safeMax;

  // Game loop with realistic wobble drift
  useEffect(() => {
    if (!isPlaying || isCompleted) return;

    const interval = setInterval(() => {
      // Natural wobble drift
      const drift = (Math.random() - 0.5) * 1.8;
      velocityRef.current += drift * 0.15;
      velocityRef.current = Math.max(-2.5, Math.min(2.5, velocityRef.current));

      setBalance((prev) => {
        const next = Math.max(5, Math.min(95, prev + velocityRef.current));
        return next;
      });

      // Check green zone hold
      setBalance((curr) => {
        if (curr >= safeMin && curr <= safeMax) {
          setHoldTime((t) => {
            const nextTime = Math.min(4.0, t + 0.1);
            if (nextTime >= 4.0 && !isCompleted) {
              setIsCompleted(true);
              soundFX.playSuccess();
              if (onSuccessCode) onSuccessCode('STUNT-VAKAUS');
            }
            return nextTime;
          });
        } else {
          setHoldTime((t) => Math.max(0, t - 0.2));
        }
        return curr;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, isCompleted, safeMin, safeMax, onSuccessCode]);

  const nudgeLeft = () => {
    soundFX.playKeyClick();
    if (!isPlaying) setIsPlaying(true);
    velocityRef.current -= 1.6;
    setBalance((prev) => Math.max(5, prev - 3));
  };

  const nudgeRight = () => {
    soundFX.playKeyClick();
    if (!isPlaying) setIsPlaying(true);
    velocityRef.current += 1.6;
    setBalance((prev) => Math.min(95, prev + 3));
  };

  return (
    <div className="parchment-card rounded-2xl border-2 border-[#8b5a2b] p-4 sm:p-5 shadow-2xl space-y-4 font-serif">
      <div className="flex items-center justify-between border-b border-[#5c3e21] pb-3">
        <div className="flex items-center gap-2 text-[#fbbf24]">
          <Activity className="w-5 h-5 text-[#d4af37]" />
          <div>
            <h3 className="font-cinzel font-bold text-sm sm:text-base text-[#fef3c7] uppercase">
              NODE-09 // Stunt-pyramidin Tasapainovakaus
            </h3>
            <span className="text-[11px] text-[#a88456] block">
              Akrobaattinen tasapaino • Vakausvyöhyke
            </span>
          </div>
        </div>
        <div className="text-xs bg-[#24170d] border border-[#d4af37]/60 text-[#fbbf24] px-3 py-1 rounded-lg font-typewriter">
          4 SEKUNNIN PITO
        </div>
      </div>

      <div className="p-3 bg-[#1e1309] border border-[#5c3e21] rounded-xl text-xs text-[#e4cdad] leading-relaxed">
        Pidä stunt-pyramidi vihreällä turvavyöhykkeellä vähintään <strong>4 sekunnin ajan</strong> yhtäjaksoisesti. Ohjaa tasapainoa painamalla vasemmalle ja oikealle!
      </div>

      {/* Visual Balance Bar */}
      <div className="p-4 bg-[#0d0905] border-2 border-[#5c3e21] rounded-xl space-y-4">
        {/* Progress bar towards 4 seconds */}
        <div className="flex items-center justify-between text-xs font-cinzel">
          <span className="text-[#a88456]">VAKAUSAIKA:</span>
          <span className="font-typewriter text-[#fbbf24] font-bold text-sm">
            {holdTime.toFixed(1)}s / 4.0s
          </span>
        </div>
        <div className="w-full bg-[#1c1209] h-3 rounded-full overflow-hidden border border-[#5c3e21]">
          <div
            className="h-full bg-gradient-to-r from-amber-600 via-emerald-500 to-emerald-400 transition-all duration-100"
            style={{ width: `${(holdTime / 4.0) * 100}%` }}
          />
        </div>

        {/* Wobble Beam Indicator */}
        <div className="relative h-14 bg-[#140e0a] border border-[#4a2e16] rounded-xl flex items-center px-4 overflow-hidden">
          {/* Target Zone */}
          <div
            className="absolute top-0 bottom-0 bg-emerald-950/60 border-x-2 border-emerald-500/80 flex items-center justify-center pointer-events-none"
            style={{ left: `${safeMin}%`, width: `${safeMax - safeMin}%` }}
          >
            <span className="text-[9px] font-cinzel font-bold text-emerald-400 opacity-60 uppercase">
              VIHREÄ VYÖHYKE
            </span>
          </div>

          {/* Pyramid Flyer Marker */}
          <div
            className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 transition-transform duration-75 text-center pointer-events-none"
            style={{ left: `${balance}%` }}
          >
            <div
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs shadow-lg ${
                isInGreen
                  ? 'bg-emerald-600 border-white text-white shadow-[0_0_15px_rgba(74,222,128,0.8)]'
                  : 'bg-red-700 border-yellow-300 text-white'
              }`}
            >
              🤸
            </div>
          </div>
        </div>

        {/* Action Control Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={nudgeLeft}
            className="flex-1 btn-brass py-3 rounded-xl font-cinzel font-bold text-xs flex items-center justify-center gap-2 uppercase"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kallista Vasemmalle</span>
          </button>

          <button
            onClick={nudgeRight}
            className="flex-1 btn-brass py-3 rounded-xl font-cinzel font-bold text-xs flex items-center justify-center gap-2 uppercase"
          >
            <span>Kallista Oikealle</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isCompleted && (
        <div className="p-3 bg-[#142314] border-2 border-emerald-500 rounded-xl text-xs text-emerald-200 flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>
              TÄYDELLINEN STUNT-VAKAUS SAAVUTETTU! Purkukoodi: <strong className="font-typewriter text-amber-300 text-sm">STUNT-VAKAUS</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
