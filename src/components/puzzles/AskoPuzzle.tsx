'use client';

import React, { useState } from 'react';
import { Cog, Wrench, CheckCircle2, HelpCircle, Compass, FileText } from 'lucide-react';
import { soundFX } from '@/lib/audio';

interface Props {
  onSuccessCode: (code: string) => void;
}

export const AskoPuzzle: React.FC<Props> = ({ onSuccessCode }) => {
  const [threadSize, setThreadSize] = useState<number>(42);
  const [pressureBar, setPressureBar] = useState<number>(8);
  const [isCalculated, setIsCalculated] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const handleCalculate = () => {
    soundFX.playKeyClick();
    if (threadSize === 48 && pressureBar === 12) {
      soundFX.playSuccess();
      setIsCalculated(true);
      onSuccessCode('AKSELI-48-1888');
    } else if (threadSize !== 48) {
      soundFX.playFailure();
      setIsCalculated(false);
      alert('Akselin murtolujuuslaskenta epäonnistui! Kierrekoko ei vastaa höyrykoneen piirustuksen mitoitusta.');
    } else {
      soundFX.playFailure();
      setIsCalculated(false);
      alert('Höyrypaineen taso ei riitä Nuoramoisten vuoden 1888 nousuun! Tarkista höyrypaineen valinta.');
    }
  };

  return (
    <div className="parchment-card rounded-xl p-4 sm:p-5 border-2 border-[#5c3e21] shadow-2xl">
      <div className="flex items-center justify-between border-b border-[#5c3e21] pb-3 mb-4">
        <div className="flex items-center gap-2 text-[#fbbf24]">
          <Wrench className="w-5 h-5 text-[#d4af37]" />
          <h3 className="font-bold font-cinzel text-sm sm:text-base tracking-wide text-lantern">
            KONEPAJAN PULMA: Höyrykoneen Akseli
          </h3>
        </div>
        <button
          onClick={() => {
            soundFX.playKeyClick();
            setShowHint(!showHint);
          }}
          className="text-xs text-[#d4af37] hover:text-[#fbbf24] font-serif italic flex items-center gap-1.5 underline"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{showHint ? 'Kätke vihje' : 'Vihje asentajalle'}</span>
        </button>
      </div>

      {showHint && (
        <div className="bg-[#24170d] border border-[#d4af37]/40 p-3.5 rounded-lg mb-4 text-xs text-[#fef3c7] font-serif leading-relaxed shadow-inner">
          <p className="font-bold text-[#fbbf24] font-cinzel mb-1">🛠️ Tekninen mitoitusvihje:</p>
          <p>
            Askon konepajan 1888 höyryveturin akselissa käytettiin harvinaista <strong>M48-kierrettä</strong> 
            (halkaisija 48 mm) ja <strong>12 barin</strong> maksimipainetta, jotta vetotangot kestäisivät Nuoramoisten jyrkät syysnousut.
          </p>
        </div>
      )}

      {/* Sepia Blueprint Canvas & Technical Drawing */}
      <div className="paper-document p-4 rounded-lg mb-4 text-[#2b1d0c] font-serif relative overflow-hidden">
        <div className="flex justify-between items-center text-[10px] font-typewriter border-b border-[#a88456] pb-1.5 mb-2">
          <span>VALTIONRAUTATIET // LAHDEN KONEPAJA</span>
          <span>PIIRUSTUS NO. 1888-ASKO</span>
        </div>

        {/* SVG Drawing of Steam Engine Shaft */}
        <div className="w-full flex justify-center py-2">
          <svg viewBox="0 0 340 110" className="w-full max-w-md h-28">
            {/* Background grid */}
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#d5b88c" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="340" height="110" fill="url(#grid)" />

            {/* Main shaft */}
            <rect x="25" y="42" width="290" height="26" fill="#7a552e" stroke="#3b230d" strokeWidth="2" rx="2" />
            {/* Gear 1 */}
            <rect x="55" y="20" width="22" height="70" fill="#a37644" stroke="#3b230d" strokeWidth="2" />
            {/* Gear 2 */}
            <rect x="175" y="15" width="34" height="80" fill="#a37644" stroke="#3b230d" strokeWidth="2" />
            {/* Flange / Thread section */}
            <rect x="260" y="34" width="45" height="42" fill="#543719" stroke="#991b1b" strokeWidth="2" strokeDasharray="4 2" />
            
            <text x="282" y="58" fill="#fef3c7" fontSize="11" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
              M{threadSize}
            </text>

            {/* Caliper measurement lines */}
            <line x1="25" y1="98" x2="315" y2="98" stroke="#3b230d" strokeWidth="1.5" />
            <line x1="25" y1="93" x2="25" y2="103" stroke="#3b230d" strokeWidth="1.5" />
            <line x1="315" y1="93" x2="315" y2="103" stroke="#3b230d" strokeWidth="1.5" />
            <text x="170" y="106" fill="#3b230d" fontSize="9" fontFamily="Special Elite" textAnchor="middle">
              KOKONAISPITUUS: 1888 MM // TERÄSLAATU 1888-A
            </text>
          </svg>
        </div>
      </div>

      {/* Tactile Dials & Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="bg-[#18110a] p-3.5 rounded-lg border border-[#4a3219]">
          <label className="text-xs text-[#d4af37] font-cinzel block mb-1">
            AKSELIN KIERREKOKO (MM):
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={30}
              max={60}
              step={2}
              value={threadSize}
              onChange={(e) => {
                soundFX.playKeyClick();
                setThreadSize(Number(e.target.value));
              }}
              className="w-full accent-[#d4af37]"
            />
            <span className="text-base font-bold font-typewriter text-[#fbbf24] w-14 text-right bg-[#0d0905] px-2 py-0.5 rounded border border-[#5c3e21]">
              M{threadSize}
            </span>
          </div>
        </div>

        <div className="bg-[#18110a] p-3.5 rounded-lg border border-[#4a3219]">
          <label className="text-xs text-[#d4af37] font-cinzel block mb-1">
            HÖYRYPAINEEN TASO:
          </label>
          <select
            value={pressureBar}
            onChange={(e) => {
              soundFX.playKeyClick();
              setPressureBar(Number(e.target.value));
            }}
            className="w-full bg-[#0d0905] border border-[#5c3e21] text-[#fef3c7] text-xs p-2 rounded focus:outline-none font-serif"
          >
            <option value={6}>6 bar (Kevyt kuorma)</option>
            <option value={8}>8 bar (Normaaliajo)</option>
            <option value={12}>12 bar (Nuoramoisten nousu 1888)</option>
          </select>
        </div>
      </div>

      <button
        onClick={handleCalculate}
        className="w-full btn-brass font-bold py-3 px-4 rounded-lg font-cinzel text-xs sm:text-sm flex items-center justify-center gap-2 tracking-wider uppercase shadow-xl"
      >
        <Cog className="w-4 h-4 animate-spin" />
        <span>Laske ja vahvista akselin murtolujuus</span>
      </button>

      {isCalculated && (
        <div className="mt-4 p-4 bg-[#142314] border-2 border-[#25e24c] rounded-lg text-xs font-serif text-[#fef3c7] animate-fadeIn shadow-lg">
          <div className="flex items-center gap-2 text-[#4ade80] font-bold font-cinzel text-sm mb-1">
            <CheckCircle2 className="w-5 h-5 text-[#25e24c]" />
            <span>AKSELIN MITOITUS HYVÄKSYTTY!</span>
          </div>
          <p>
            Oikea purkukoodi: <strong className="text-[#fbbf24] font-typewriter text-sm">AKSELI-48-1888</strong>. 
            (Koodi siirretty valmiiksi vastauskenttään).
          </p>
        </div>
      )}
    </div>
  );
};
