'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Radio, Volume2, VolumeX, Sparkles, CheckCircle2, Waves, Flame } from 'lucide-react';
import { soundFX } from '@/lib/audio';

interface Props {
  onSuccessCode?: (code: string) => void;
}

export const RadioScanner: React.FC<Props> = ({ onSuccessCode }) => {
  const [frequency, setFrequency] = useState<number>(55.0);
  const targetFrequency = 61.42; // Sysmä coordinates 61.42° N
  const [isScanning, setIsScanning] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [morseActive, setMorseActive] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const freqDelta = Math.abs(frequency - targetFrequency);
  const signalQuality = Math.max(0, 100 - freqDelta * 35); // 0 to 100%

  useEffect(() => {
    if (isScanning) {
      soundFX.updateRadioTuning(freqDelta * 20);
    }
  }, [frequency, isScanning, freqDelta]);

  const toggleRadio = () => {
    soundFX.playKeyClick();
    if (isScanning) {
      soundFX.stopRadioStatic();
      setIsScanning(false);
    } else {
      soundFX.startRadioStatic(freqDelta * 20);
      setIsScanning(true);
    }
  };

  useEffect(() => {
    return () => {
      soundFX.stopRadioStatic();
    };
  }, []);

  useEffect(() => {
    if (signalQuality >= 90 && !isLocked) {
      setIsLocked(true);
      soundFX.playSuccess();
      if (onSuccessCode) {
        onSuccessCode('SYSMA-61.42-1888');
      }
    }
  }, [signalQuality, isLocked, onSuccessCode]);

  // Draw oscilloscope waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      ctx.fillStyle = '#060a07';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Antique Circular grid lines
      ctx.strokeStyle = '#152b1b';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 25) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 25) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Waveform
      ctx.beginPath();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = signalQuality > 80 ? '#4ade80' : signalQuality > 40 ? '#fbbf24' : '#ef4444';

      const sliceWidth = canvas.width / 100;
      let x = 0;

      for (let i = 0; i < 100; i++) {
        const noise = (Math.random() - 0.5) * (100 - signalQuality) * 0.4;
        const sine = isScanning ? Math.sin((i * 0.12) + phase) * (signalQuality * 0.28) : 0;
        const y = canvas.height / 2 + sine + noise;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }
      ctx.stroke();

      phase += 0.15;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isScanning, signalQuality]);

  const playMorseSignal = () => {
    soundFX.playKeyClick();
    setMorseActive(true);
    soundFX.playMorseLetter('...'); // S
    setTimeout(() => soundFX.playMorseLetter('-.--'), 400); // Y
    setTimeout(() => soundFX.playMorseLetter('...'), 900); // S
    setTimeout(() => soundFX.playMorseLetter('--'), 1300); // M
    setTimeout(() => soundFX.playMorseLetter('.-'), 1700); // A
    setTimeout(() => setMorseActive(false), 2200);
  };

  return (
    <div className="parchment-card rounded-xl p-4 sm:p-5 border-2 border-[#5c3e21] shadow-2xl">
      {/* Victorian Radio Brass Header */}
      <div className="flex items-center justify-between border-b border-[#5c3e21] pb-3 mb-4">
        <div className="flex items-center gap-2 text-[#fbbf24]">
          <Radio className="w-5 h-5 text-[#d4af37]" />
          <h3 className="font-bold font-cinzel text-sm sm:text-base tracking-wide text-lantern">
            LANGATON TELEGRAAFI // VIRTALÄHDE 1888
          </h3>
        </div>
        <button
          onClick={toggleRadio}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold font-cinzel transition flex items-center gap-1.5 ${
            isScanning
              ? 'bg-[#3b230d] text-[#fde047] border border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.4)]'
              : 'bg-[#18110a] text-[#a88456] border border-[#4a3219]'
          }`}
        >
          {isScanning ? <Volume2 className="w-3.5 h-3.5 text-[#fbbf24]" /> : <VolumeX className="w-3.5 h-3.5" />}
          <span>{isScanning ? 'PUTKIRADIO AKTIIVINEN' : 'KÄYNNISTÄ PUTKIRADIO'}</span>
        </button>
      </div>

      {/* Vacuum tube glow indicator */}
      <div className="flex items-center justify-center gap-6 py-2 mb-3 bg-[#110b07] rounded-lg border border-[#3b2513]">
        <div className="flex items-center gap-1.5 text-xs font-serif text-[#d4af37]">
          <Flame className={`w-4 h-4 ${isScanning ? 'text-amber-400 animate-pulse' : 'text-stone-600'}`} />
          <span>Hehkulamppu I (Anodi)</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-serif text-[#d4af37]">
          <Flame className={`w-4 h-4 ${isScanning ? 'text-amber-400 animate-pulse' : 'text-stone-600'}`} />
          <span>Hehkulamppu II (Vahvistin)</span>
        </div>
      </div>

      {/* Cathode Ray Oscilloscope */}
      <div className="relative mb-4 rounded-xl overflow-hidden border-2 border-[#5c3e21] bg-[#060a07] shadow-inner">
        <canvas ref={canvasRef} width={400} height={120} className="w-full h-28 block" />
        <div className="absolute top-2 left-2 text-[10px] text-[#4ade80] font-mono flex items-center gap-1">
          <Waves className="w-3 h-3" />
          <span>KATODISÄDEPUTKI // SKANNAUS</span>
        </div>
        <div className="absolute top-2 right-2 text-xs font-bold font-typewriter">
          <span
            className={
              signalQuality > 80 ? 'text-[#4ade80]' : signalQuality > 40 ? 'text-[#fbbf24]' : 'text-red-400'
            }
          >
            SIGNAALI: {Math.round(signalQuality)}%
          </span>
        </div>
      </div>

      {/* Brass Dial & Slider */}
      <div className="bg-[#18110a] p-4 rounded-lg border border-[#4a3219] mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-[#d4af37] font-cinzel">VIRITÄ TAAJUUSKELA (MHz):</span>
          <span className="text-xl font-bold font-typewriter text-[#fbbf24] tracking-wider bg-[#0d0905] px-3 py-1 rounded border border-[#5c3e21]">
            {frequency.toFixed(2)} MHz
          </span>
        </div>

        <input
          type="range"
          min={50.0}
          max={80.0}
          step={0.02}
          value={frequency}
          onChange={(e) => setFrequency(Number(e.target.value))}
          className="w-full accent-[#d4af37] h-2 bg-[#0d0905] rounded-lg cursor-pointer"
        />

        <div className="flex justify-between text-[11px] text-[#ab8a5f] font-serif mt-2">
          <span>50.00 MHz (Lahti / Asko)</span>
          <span className="text-[#fbbf24] font-bold">61.42 MHz (Sysmä / Nuoramoinen)</span>
          <span>80.00 MHz (Heinola)</span>
        </div>
      </div>

      {/* Morse & Decoding Key */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <button
          onClick={playMorseSignal}
          disabled={signalQuality < 50}
          className={`py-2.5 px-3 rounded-lg text-xs font-bold font-cinzel transition flex items-center justify-center gap-2 ${
            signalQuality >= 50
              ? 'btn-brass'
              : 'bg-[#18110a] text-stone-600 border border-[#4a3219] cursor-not-allowed'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>{morseActive ? 'LÄHETTÄÄ MORSEA...' : 'KUUNTELE MORSE-SIGNAALI'}</span>
        </button>

        <div className="bg-[#18110a] p-2.5 rounded-lg border border-[#4a3219] flex items-center justify-between text-xs font-serif">
          <span className="text-[#ab8a5f]">SYSMÄN KOORDINAATTI:</span>
          <span className="text-[#fbbf24] font-bold font-typewriter">61.42° N (Nuoramoinen)</span>
        </div>
      </div>

      {isLocked && (
        <div className="p-4 bg-[#142314] border-2 border-[#25e24c] rounded-lg text-xs font-serif text-[#fef3c7] animate-fadeIn shadow-lg">
          <div className="flex items-center gap-2 text-[#4ade80] font-bold font-cinzel text-sm mb-1">
            <CheckCircle2 className="w-5 h-5 text-[#25e24c]" />
            <span>TAAJUUS VAHVISTETTU! SYSMÄN SALAISUUS AUKI</span>
          </div>
          <p>
            Purkukoodi: <strong className="text-[#fbbf24] font-typewriter text-sm">SYSMA-61.42-1888</strong>.
          </p>
        </div>
      )}
    </div>
  );
};
