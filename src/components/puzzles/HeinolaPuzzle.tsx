'use client';

import React, { useState } from 'react';
import { FlaskConical, CheckCircle2, Feather } from 'lucide-react';
import { soundFX } from '@/lib/audio';

interface Props {
  onSuccessCode: (code: string) => void;
}

export const HeinolaPuzzle: React.FC<Props> = ({ onSuccessCode }) => {
  const [valerianaDrop, setValerianaDrop] = useState(10);
  const [menthaDrop, setMenthaDrop] = useState(5);
  const [alcoholPerc, setAlcoholPerc] = useState(60);
  const [antidoteInput, setAntidoteInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);

  // Resepti roomalaisilla numeroilla:
  // Valeriana = XVIII (18)
  // Mentha = VIII (8)
  // Spiritus = LXXXVIII (88%)
  // Neutraloiva annos = Spiritus (88) - Valeriana (18) = 70
  const handleMixTincture = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    soundFX.playKeyClick();

    if (valerianaDrop !== 18 || menthaDrop !== 8 || alcoholPerc !== 88) {
      soundFX.playFailure();
      setErrorMsg('Rohdosseoksen mittasuhteet eivät täsmää latinankielisen reseptin roomalaisten numeroiden (XVIII, VIII ja LXXXVIII) kanssa!');
      return;
    }

    const antidoteVal = parseInt(antidoteInput.trim(), 10);
    if (antidoteVal !== 70) {
      soundFX.playFailure();
      setErrorMsg('Neutraloiva vasta-aineluku on väärin! Vähennä Valerianan tippamäärä (XVIII) Spirituksen vahvuudesta (LXXXVIII).');
      return;
    }

    soundFX.playSuccess();
    setSolved(true);
    onSuccessCode('ROHDOS-70');
  };

  return (
    <div className="parchment-card rounded-2xl p-4 sm:p-5 border-2 border-[#8b5a2b] shadow-2xl space-y-4 font-serif">
      <div className="flex items-center justify-between border-b border-[#5c3e21] pb-3">
        <div className="flex items-center gap-2 text-[#fbbf24]">
          <FlaskConical className="w-5 h-5 text-[#d4af37]" />
          <div>
            <h3 className="font-bold font-cinzel text-sm sm:text-base tracking-wide text-[#fef3c7] uppercase">
              NODE-07 // Tinktuuran Letaaliannos & Vasta-aine
            </h3>
            <span className="text-[11px] text-[#a88456] block">
              Heinolan apteekin kellariarkisto • Roomalaiset mittasuhteet 1888
            </span>
          </div>
        </div>
      </div>

      {/* Aged Latin Prescription Parchment */}
      <div className="paper-document p-4 rounded-xl text-[#2b1d0c] font-serif space-y-2 border-2 border-[#5c3e21]">
        <div className="flex items-center justify-between border-b border-[#a88456] pb-1">
          <span className="font-cinzel font-bold text-xs">APOTHECA HEINOLAENSIS // ANNO 1888</span>
          <Feather className="w-4 h-4 text-[#5c3e21]" />
        </div>
        <p className="text-xs italic leading-relaxed">
          &quot;Rp. Tinctura Valerianae gtt. <strong>XVIII</strong>, Extractum Menthae gtt. <strong>VIII</strong>,
          Spiritus Vini rectificatus <strong>LXXXVIII %</strong>. Neutraloiva vasta-aine saadaan vähentämällä Valerianan tipat Spirituksen prosenttiluvusta.&quot;
        </p>
      </div>

      <form onSubmit={handleMixTincture} className="space-y-3.5">
        <div className="bg-[#18110a] p-3 rounded-lg border border-[#4a3219]">
          <div className="flex justify-between text-xs text-[#d4af37] mb-1 font-cinzel">
            <span>1. TINCTURA VALERIANAE (XVIII TIPPAA):</span>
            <span className="font-bold text-[#fbbf24] font-typewriter">{valerianaDrop} gtt</span>
          </div>
          <input
            type="range"
            min={1}
            max={30}
            value={valerianaDrop}
            onChange={(e) => {
              soundFX.playKeyClick();
              setValerianaDrop(Number(e.target.value));
            }}
            className="w-full accent-[#d4af37]"
          />
        </div>

        <div className="bg-[#18110a] p-3 rounded-lg border border-[#4a3219]">
          <div className="flex justify-between text-xs text-[#d4af37] mb-1 font-cinzel">
            <span>2. EXTRACTUM MENTHAE (VIII TIPPAA):</span>
            <span className="font-bold text-[#fbbf24] font-typewriter">{menthaDrop} gtt</span>
          </div>
          <input
            type="range"
            min={1}
            max={20}
            value={menthaDrop}
            onChange={(e) => {
              soundFX.playKeyClick();
              setMenthaDrop(Number(e.target.value));
            }}
            className="w-full accent-[#d4af37]"
          />
        </div>

        <div className="bg-[#18110a] p-3 rounded-lg border border-[#4a3219]">
          <div className="flex justify-between text-xs text-[#d4af37] mb-1 font-cinzel">
            <span>3. SPIRITUS VINI VAHVUUS (LXXXVIII %):</span>
            <span className="font-bold text-[#fbbf24] font-typewriter">{alcoholPerc} %</span>
          </div>
          <input
            type="range"
            min={40}
            max={96}
            value={alcoholPerc}
            onChange={(e) => {
              soundFX.playKeyClick();
              setAlcoholPerc(Number(e.target.value));
            }}
            className="w-full accent-[#d4af37]"
          />
        </div>

        <div className="bg-[#18110a] p-3.5 rounded-xl border border-[#4a3219]">
          <label className="text-xs font-cinzel font-bold text-[#fbbf24] block mb-1">
            4. NEUTRALOIVA VASTA-AINELUKU (LXXXVIII − XVIII):
          </label>
          <input
            type="text"
            placeholder="Syötä laskettu vasta-aineluku..."
            value={antidoteInput}
            onChange={(e) => setAntidoteInput(e.target.value)}
            className="w-full bg-[#0d0905] border border-[#5c3e21] text-[#fbbf24] px-3 py-2 rounded-lg font-typewriter text-xs focus:outline-none focus:border-[#d4af37]"
          />
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/80 border border-red-500/60 rounded-xl text-xs text-red-200">
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          className="w-full btn-brass font-bold py-3 px-4 rounded-xl font-cinzel text-xs sm:text-sm flex items-center justify-center gap-2 uppercase shadow-xl"
        >
          <FlaskConical className="w-4 h-4" />
          <span>Tislaa ja Vahvista Vasta-aine</span>
        </button>
      </form>

      {solved && (
        <div className="mt-4 p-4 bg-[#142314] border-2 border-[#25e24c] rounded-lg text-xs font-serif text-[#fef3c7] animate-fadeIn shadow-lg">
          <div className="flex items-center gap-2 text-[#4ade80] font-bold font-cinzel text-sm mb-1">
            <CheckCircle2 className="w-5 h-5 text-[#25e24c]" />
            <span>TINKTUURAN VASTA-AINE TISLATTU!</span>
          </div>
          <p>
            Purkukoodi: <strong className="text-[#fbbf24] font-typewriter text-sm">ROHDOS-70</strong>.
          </p>
        </div>
      )}
    </div>
  );
};
