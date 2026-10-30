'use client';

import React, { useState, useRef } from 'react';
import { Search, Feather, CheckCircle2, Calculator } from 'lucide-react';
import { soundFX } from '@/lib/audio';

interface Props {
  onSuccessCode?: (code: string) => void;
}

export const ViljatasePuzzle: React.FC<Props> = ({ onSuccessCode }) => {
  // Lens position in percentage (0-100) relative to the ledger container
  const [lensPct, setLensPct] = useState({ x: 50, y: 78 });
  const [lensPx, setLensPx] = useState({ x: 220, y: 220 });
  const [debetSumInput, setDebetSumInput] = useState('');
  const [kreditSumInput, setKreditSumInput] = useState('');
  const [inputVal, setInputVal] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Accounting values:
  // Debet: Ruis 420.00 + Ohra 280.50 + Kaura (hidden under blot 1: 154.20) = 854.70
  // Kredit: Mylly 310.00 + Vero 198.50 + Siemenvilja (hidden under blot 2: 203.35) = 711.85
  // Diff (Tase-ero): 854.70 - 711.85 = 142.85

  const parseNum = (s: string) => parseFloat(s.trim().replace(',', '.'));
  const debetVal = parseNum(debetSumInput);
  const kreditVal = parseNum(kreditSumInput);
  const isDebetCorrect = !isNaN(debetVal) && Math.abs(debetVal - 854.7) < 0.05;
  const isKreditCorrect = !isNaN(kreditVal) && Math.abs(kreditVal - 711.85) < 0.05;

  // Check which ink blot the magnifying glass is currently hovering over (using % coordinates)
  // Blot 1 (Kaura, left column): x ~ 6%..31%, y ~ 50%..74%
  // Blot 2 (Siemenvilja, center column): x ~ 36%..64%, y ~ 50%..74%
  // Blot 3 (Watermark formula, right column): x ~ 68%..95%, y ~ 50%..78%
  const overBlot1 = lensPct.x >= 5 && lensPct.x <= 32 && lensPct.y >= 48 && lensPct.y <= 76;
  const overBlot2 = lensPct.x >= 36 && lensPct.x <= 64 && lensPct.y >= 48 && lensPct.y <= 76;
  const overBlot3 = lensPct.x >= 68 && lensPct.x <= 96 && lensPct.y >= 48 && lensPct.y <= 80;

  const updatePosition = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
    setLensPx({ x, y });
    setLensPct({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    updatePosition(e.clientX, e.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!e.touches[0]) return;
    updatePosition(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isDebetCorrect || !isKreditCorrect) {
      soundFX.playFailure();
      setErrorMsg('Laske ja täytä ensin oikein sekä Debet- että Kredit-sarakkeiden välisummat!');
      return;
    }

    const diffVal = parseNum(inputVal);
    if (!isNaN(diffVal) && Math.abs(diffVal - 142.85) < 0.01) {
      setIsCorrect(true);
      soundFX.playSuccess();
      if (onSuccessCode) {
        onSuccessCode('142.85');
      }
    } else {
      soundFX.playFailure();
      setErrorMsg('Tase-erotus ei täsmää! Vähennä Kredit-yhteissumma Debet-yhteissummasta kahden desimaalin tarkkuudella.');
    }
  };

  return (
    <div className="parchment-card rounded-2xl border-2 border-[#8b5a2b] p-4 sm:p-5 shadow-2xl space-y-4 font-serif">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#5c3e21] pb-3">
        <div className="flex items-center gap-2 text-[#fbbf24]">
          <Feather className="w-5 h-5 text-[#d4af37]" />
          <div>
            <h3 className="font-cinzel font-bold text-sm sm:text-base text-[#fef3c7] uppercase">
              NODE-02 // Kappalaisen Viljatase & Tilikirja
            </h3>
            <span className="text-[11px] text-[#a88456] block">
              Salattu vesileima • Mustetahrojen alaiset tiliöinnit
            </span>
          </div>
        </div>
        <div className="text-xs bg-[#24170d] border border-[#d4af37]/60 text-[#fbbf24] px-3 py-1 rounded-lg font-typewriter">
          ANNO 1888
        </div>
      </div>

      <div className="p-3 bg-[#1e1309] border border-[#5c3e21] rounded-xl text-xs text-[#e4cdad] flex items-center gap-2">
        <Search className="w-4 h-4 text-[#fbbf24] shrink-0" />
        <span>
          Tutki tilikirjan <strong>kolmea mustetahraa</strong> luupilla löytääksesi peitetyt viljaerät ja laskentakaavan. Laske sen jälkeen Debet- ja Kredit-välisummat sekä puuttuva tase-erotus!
        </span>
      </div>

      {/* Interactive Ledger Document with Magnifying Glass */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        className="relative h-[280px] sm:h-[310px] rounded-xl overflow-hidden border-2 border-[#5c3e21] bg-[#f2e6cf] text-[#2b1d0c] select-none cursor-crosshair shadow-inner"
        style={{
          backgroundImage:
            'radial-gradient(#dbc399 1px, transparent 1px), linear-gradient(to bottom, rgba(139,90,43,0.05) 1px, transparent 1px)',
          backgroundSize: '20px 20px, 100% 28px',
        }}
      >
        {/* Ledger Header */}
        <div className="p-4 border-b border-[#a88456]/40 text-center">
          <h4 className="font-cinzel font-bold text-xs sm:text-sm text-[#3b2413] uppercase tracking-wider">
            SYSMÄN JA NUORAMOISTEN TILITASE // LOKAKUU 1888
          </h4>
          <span className="text-[10px] text-[#6b4c30] italic font-serif">
            Kappalaisen oma käsiala • Viljamakasiinin saatavat ja kylvötase
          </span>
        </div>

        {/* Ledger columns & rows */}
        <div className="p-4 grid grid-cols-3 gap-2 text-[11px] font-typewriter">
          {/* Column 1: Debet */}
          <div className="space-y-2 border-r border-[#a88456]/30 pr-2 relative">
            <span className="font-bold text-[#4a2e16] block uppercase border-b border-[#a88456]/30 pb-0.5">
              1. Vakkoja (Debet)
            </span>
            <div>Ruis: 420.00 v.</div>
            <div>Ohra: 280.50 v.</div>
            <div className="relative py-1">
              <span className="opacity-0">Kaura: ??? v.</span>
              {/* Ink blot 1 over Kaura */}
              <div className="absolute -top-1 left-0 w-28 h-10 bg-[#1c120c] rounded-full opacity-95 blur-[0.5px] transform -rotate-3 flex items-center justify-center pointer-events-none shadow-md">
                <span className="text-[9px] text-amber-100/50 italic font-serif">Mustetahra I</span>
              </div>
            </div>
            <div className="text-[10px] text-[#785434] italic pt-2">
              Debet yht: [ Laske alla ]
            </div>
          </div>

          {/* Column 2: Kredit */}
          <div className="space-y-2 border-r border-[#a88456]/30 pr-2 relative">
            <span className="font-bold text-[#4a2e16] block uppercase border-b border-[#a88456]/30 pb-0.5">
              2. Tilitetyt (Kredit)
            </span>
            <div>Sysmän mylly: 310.00 v.</div>
            <div>Maaherran vero: 198.50 v.</div>
            <div className="relative py-1">
              <span className="opacity-0">Siemenvilja: ??? v.</span>
              {/* Ink blot 2 over Siemenvilja */}
              <div className="absolute -top-1 left-0 w-28 h-10 bg-[#1c120c] rounded-full opacity-95 blur-[0.5px] transform rotate-2 flex items-center justify-center pointer-events-none shadow-md">
                <span className="text-[9px] text-amber-100/50 italic font-serif">Mustetahra II</span>
              </div>
            </div>
            <div className="text-[10px] text-[#785434] italic pt-2">
              Kredit yht: [ Laske alla ]
            </div>
          </div>

          {/* Column 3: Notes */}
          <div className="space-y-2 relative">
            <span className="font-bold text-[#4a2e16] block uppercase border-b border-[#a88456]/30 pb-0.5">
              3. Arkiston Huomiot
            </span>
            <div>Tarkastettu: 27.10.</div>
            <div>Kultaruplat: 400 kpl</div>
            <div className="relative py-1">
              <span className="opacity-0">Salainen muistiinpano</span>
              {/* Ink blot 3 over Formula note */}
              <div className="absolute -top-1 left-0 w-28 h-12 bg-[#1c120c] rounded-full opacity-95 blur-[0.5px] transform rotate-6 flex items-center justify-center pointer-events-none shadow-md">
                <span className="text-[9px] text-amber-100/50 italic font-serif">Mustetahra III</span>
              </div>
            </div>
          </div>
        </div>

        {/* Magnifying Glass Lens overlay */}
        <div
          className="absolute pointer-events-none rounded-full border-4 border-[#d4af37] shadow-[0_0_25px_rgba(0,0,0,0.65)]"
          style={{
            width: 124,
            height: 124,
            left: lensPx.x - 62,
            top: lensPx.y - 62,
            background:
              overBlot1 || overBlot2 || overBlot3
                ? 'radial-gradient(circle, rgba(254,240,138,0.97) 0%, rgba(234,179,8,0.88) 100%)'
                : 'radial-gradient(circle, rgba(255,255,255,0.45) 0%, rgba(212,175,55,0.2) 100%)',
          }}
        >
          {overBlot1 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-2 font-typewriter">
              <span className="text-[8px] font-bold text-amber-900 uppercase">DEBET-ERÄ 3:</span>
              <span className="text-xs font-bold text-black mt-0.5">Kaura:</span>
              <span className="text-sm font-extrabold text-red-950">154.20 v.</span>
            </div>
          ) : overBlot2 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-2 font-typewriter">
              <span className="text-[8px] font-bold text-amber-900 uppercase">KREDIT-ERÄ 3:</span>
              <span className="text-xs font-bold text-black mt-0.5">Siemenvilja:</span>
              <span className="text-sm font-extrabold text-red-950">203.35 v.</span>
            </div>
          ) : overBlot3 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-2 font-typewriter">
              <span className="text-[8px] font-bold text-red-950 uppercase">VESILEIMAN KAAVA:</span>
              <span className="text-[10px] font-bold text-black leading-tight mt-0.5">
                Tase-ero = Debet yht. − Kredit yht.
              </span>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Search className="w-5 h-5 text-[#8b5a2b]/40" />
            </div>
          )}
        </div>
      </div>

      {/* Step-by-step Accounting Workbench */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Step 1: Debet Sum */}
        <div className="bg-[#18110a] p-3.5 rounded-xl border border-[#4a3219]">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-cinzel font-bold text-[#fbbf24]">
              1. VAKKOJA (DEBET) YHTEENSÄ:
            </label>
            {isDebetCorrect && (
              <span className="text-[11px] text-emerald-400 font-mono font-bold">✓ Oikein</span>
            )}
          </div>
          <p className="text-[11px] text-[#a88456] mb-2">
            Laske yhteen Ruis + Ohra + Kaura (Mustetahra I):
          </p>
          <input
            type="text"
            placeholder="Syötä Debet-summa (v.)..."
            value={debetSumInput}
            onChange={(e) => setDebetSumInput(e.target.value)}
            className="w-full bg-[#0d0905] border border-[#5c3e21] text-[#fbbf24] px-3 py-2 rounded-lg font-typewriter text-xs focus:outline-none focus:border-[#d4af37]"
          />
        </div>

        {/* Step 2: Kredit Sum */}
        <div className="bg-[#18110a] p-3.5 rounded-xl border border-[#4a3219]">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-cinzel font-bold text-[#fbbf24]">
              2. TILITETYT (KREDIT) YHTEENSÄ:
            </label>
            {isKreditCorrect && (
              <span className="text-[11px] text-emerald-400 font-mono font-bold">✓ Oikein</span>
            )}
          </div>
          <p className="text-[11px] text-[#a88456] mb-2">
            Laske yhteen Mylly + Vero + Siemenvilja (Mustetahra II):
          </p>
          <input
            type="text"
            placeholder="Syötä Kredit-summa (v.)..."
            value={kreditSumInput}
            onChange={(e) => setKreditSumInput(e.target.value)}
            className="w-full bg-[#0d0905] border border-[#5c3e21] text-[#fbbf24] px-3 py-2 rounded-lg font-typewriter text-xs focus:outline-none focus:border-[#d4af37]"
          />
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-950/80 border border-red-500/60 rounded-xl text-xs text-red-200 font-serif">
          {errorMsg}
        </div>
      )}

      {/* Step 3: Final Balance Difference Input */}
      <form onSubmit={handleSubmit} className="pt-1 flex flex-col sm:flex-row gap-2">
        <div className="flex-1">
          <label className="text-xs font-cinzel font-bold text-[#d4af37] block mb-1">
            3. PUUTTUVA TASE-EROTUS (DEBET − KREDIT):
          </label>
          <input
            type="text"
            placeholder="Syötä laskettu tase-erotus (kahdella desimaalilla)..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className="w-full bg-[#0d0905] border border-[#5c3e21] text-[#fbbf24] px-4 py-2.5 rounded-lg font-typewriter text-xs uppercase focus:outline-none focus:border-[#d4af37]"
          />
        </div>
        <button
          type="submit"
          className="btn-brass font-bold text-xs font-cinzel px-5 py-2.5 rounded-lg uppercase flex items-center justify-center gap-2 self-end h-[38px]"
        >
          <Calculator className="w-4 h-4" />
          <span>Tarkista Tase</span>
        </button>
      </form>

      {isCorrect && (
        <div className="p-3 bg-[#1e2e1e] border border-emerald-500 rounded-xl text-xs text-emerald-200 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Kirjanpidon tase-ero vahvistettu oikein! Puuttuvat vakot: <strong className="font-typewriter text-amber-300">142.85</strong>
          </span>
        </div>
      )}
    </div>
  );
};
