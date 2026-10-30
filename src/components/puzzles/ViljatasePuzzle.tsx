'use client';

import React, { useState, useRef } from 'react';
import { Search, Feather, CheckCircle2, Calculator, Eye } from 'lucide-react';
import { soundFX } from '@/lib/audio';

interface Props {
  onSuccessCode?: (code: string) => void;
}

export const ViljatasePuzzle: React.FC<Props> = ({ onSuccessCode }) => {
  // Active inspected blot (1, 2, or 3) + discovered blots set so mobile users can read all numbers clearly
  const [activeBlot, setActiveBlot] = useState<1 | 2 | 3 | null>(null);
  const [discoveredBlots, setDiscoveredBlots] = useState<number[]>([]);
  const [lensPos, setLensPos] = useState<{ x: number; y: number } | null>(null);

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

  const inspectBlot = (blotNum: 1 | 2 | 3) => {
    soundFX.playKeyClick();
    setActiveBlot(blotNum);
    setDiscoveredBlots((prev) => (prev.includes(blotNum) ? prev : [...prev, blotNum]));
  };

  const handlePointerAt = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
    setLensPos({ x, y });

    // Determine which zone of the ledger the user is hovering/touching
    const elem = document.elementFromPoint(clientX, clientY);
    const blotAttr = elem?.closest('[data-blot]')?.getAttribute('data-blot');
    if (blotAttr === '1' || blotAttr === '2' || blotAttr === '3') {
      const num = Number(blotAttr) as 1 | 2 | 3;
      setActiveBlot(num);
      setDiscoveredBlots((prev) => (prev.includes(num) ? prev : [...prev, num]));
    }
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
    <div className="parchment-card rounded-2xl border-2 border-[#8b5a2b] p-3.5 sm:p-5 shadow-2xl space-y-4 font-serif">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#5c3e21] pb-3 gap-2">
        <div className="flex items-center gap-2 text-[#fbbf24]">
          <Feather className="w-5 h-5 text-[#d4af37] shrink-0" />
          <div>
            <h3 className="font-cinzel font-bold text-sm sm:text-base text-[#fef3c7] uppercase">
              NODE-02 // Kappalaisen Viljatase & Tilikirja
            </h3>
            <span className="text-[11px] text-[#a88456] block">
              Salattu vesileima • Mustetahrojen alaiset tiliöinnit
            </span>
          </div>
        </div>
        <div className="text-xs bg-[#24170d] border border-[#d4af37]/60 text-[#fbbf24] px-2.5 py-1 rounded-lg font-typewriter shrink-0">
          ANNO 1888
        </div>
      </div>

      <div className="p-3 bg-[#1e1309] border border-[#5c3e21] rounded-xl text-xs text-[#e4cdad] space-y-2">
        <div className="flex items-start gap-2">
          <Search className="w-4 h-4 text-[#fbbf24] shrink-0 mt-0.5" />
          <span>
            <strong>Ohje (toimii yhdellä napautuksella tai luupilla):</strong> Napauta suoraan tilikirjan <strong>mustetahroja (I, II ja III)</strong> tai alla olevia luuppipainikkeita paljastaaksesi peitetyt luvut!
          </span>
        </div>

        {/* Mobile-friendly quick-inspect buttons */}
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          {([
            { id: 1, label: 'Mustetahra I', sub: 'Debet: Kaura' },
            { id: 2, label: 'Mustetahra II', sub: 'Kredit: Siemen' },
            { id: 3, label: 'Mustetahra III', sub: 'Tasekaava' },
          ] as const).map((b) => {
            const isDiscovered = discoveredBlots.includes(b.id);
            const isSelected = activeBlot === b.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => inspectBlot(b.id)}
                className={`p-2 rounded-lg border text-left transition touch-manipulation ${
                  isSelected
                    ? 'bg-[#3b240d] border-[#fbbf24] text-[#fef08a] shadow-[0_0_10px_rgba(251,191,36,0.3)]'
                    : isDiscovered
                    ? 'bg-[#142615] border-emerald-500/60 text-emerald-200'
                    : 'bg-[#120c07] border-[#5c3e21] text-[#e4cdad] hover:border-[#d4af37]'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-cinzel font-bold">
                  <span>🔍 Tahra {b.id === 1 ? 'I' : b.id === 2 ? 'II' : 'III'}</span>
                  {isDiscovered && <span className="text-emerald-400">✓</span>}
                </div>
                <div className="text-[10px] opacity-80 truncate">{b.sub}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Magnifying Glass Readout Banner (Always visible and unobstructed by fingers) */}
      <div className="p-3 rounded-xl border-2 border-[#d4af37] bg-[#26180a] text-[#fef3c7] shadow-inner">
        <div className="flex items-center justify-between text-[11px] font-cinzel text-[#fbbf24] mb-1">
          <span className="flex items-center gap-1.5 font-bold">
            <Eye className="w-4 h-4 text-[#fbbf24]" />
            <span>ARKISTOLUUPIN HAVAINTO ({discoveredBlots.length}/3 PALJASTETTU):</span>
          </span>
        </div>
        {activeBlot === 1 ? (
          <div className="font-typewriter text-xs sm:text-sm bg-[#160e06] p-2.5 rounded-lg border border-[#d4af37]/50 text-[#fef08a]">
            <strong>MUSTETAHRA I (1. Vakkoja / Debet):</strong> Kaura = <strong className="text-base text-amber-300 underline">154.20 v.</strong>
          </div>
        ) : activeBlot === 2 ? (
          <div className="font-typewriter text-xs sm:text-sm bg-[#160e06] p-2.5 rounded-lg border border-[#d4af37]/50 text-[#fef08a]">
            <strong>MUSTETAHRA II (2. Tilitetyt / Kredit):</strong> Siemenvilja = <strong className="text-base text-amber-300 underline">203.35 v.</strong>
          </div>
        ) : activeBlot === 3 ? (
          <div className="font-typewriter text-xs sm:text-sm bg-[#160e06] p-2.5 rounded-lg border border-[#d4af37]/50 text-[#fef08a]">
            <strong>MUSTETAHRA III (Vesileiman kaava):</strong> <strong className="text-amber-300">Tase-erotus = Debet yht. − Kredit yht.</strong>
          </div>
        ) : (
          <div className="text-xs text-[#c7a67b] italic">
            Napauta mitä tahansa mustetahraa tilikirjassa (tai yllä olevia Tahra I–III -painikkeita) tutkiaksesi sen luupilla!
          </div>
        )}
      </div>

      {/* Interactive Ledger Document (touch-pan-y allows normal page scroll, tapping or dragging blots reveals them) */}
      <div
        ref={containerRef}
        onMouseMove={(e) => handlePointerAt(e.clientX, e.clientY)}
        className="relative rounded-xl overflow-hidden border-2 border-[#5c3e21] bg-[#f2e6cf] text-[#2b1d0c] select-none shadow-inner"
        style={{
          backgroundImage:
            'radial-gradient(#dbc399 1px, transparent 1px), linear-gradient(to bottom, rgba(139,90,43,0.06) 1px, transparent 1px)',
          backgroundSize: '20px 20px, 100% 28px',
        }}
      >
        {/* Ledger Header */}
        <div className="p-3 sm:p-4 border-b border-[#a88456]/50 text-center bg-[#ead8b8]/70">
          <h4 className="font-cinzel font-bold text-xs sm:text-sm text-[#3b2413] uppercase tracking-wider">
            SYSMÄN JA NUORAMOISTEN TILITASE // LOKAKUU 1888
          </h4>
          <span className="text-[10px] text-[#6b4c30] italic font-serif">
            Kappalaisen oma käsiala • Viljamakasiinin saatavat ja kylvötase
          </span>
        </div>

        {/* Responsive Ledger Columns: stacked cleanly on mobile, 3 columns on desktop */}
        <div className="p-3 sm:p-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-typewriter">
          {/* Column 1: Debet */}
          <div className="bg-[#f8eedb] p-3 rounded-lg border border-[#c4a474] space-y-2 shadow-sm">
            <span className="font-bold text-[#4a2e16] block uppercase border-b border-[#a88456]/40 pb-1 text-xs">
              1. Vakkoja (Debet)
            </span>
            <div className="flex justify-between py-0.5">
              <span>Ruis:</span>
              <strong className="text-[#1f1308]">420.00 v.</strong>
            </div>
            <div className="flex justify-between py-0.5">
              <span>Ohra:</span>
              <strong className="text-[#1f1308]">280.50 v.</strong>
            </div>

            {/* Blot 1 interactive button */}
            <button
              type="button"
              data-blot="1"
              onClick={() => inspectBlot(1)}
              className={`w-full p-2 rounded-lg border text-left transition flex items-center justify-between touch-manipulation ${
                discoveredBlots.includes(1)
                  ? 'bg-[#fef08a] border-[#ca8a04] text-[#422006] shadow-sm'
                  : 'bg-[#1c120c] border-[#5c3e21] text-amber-100 hover:bg-[#2b1c13]'
              }`}
            >
              {discoveredBlots.includes(1) ? (
                <>
                  <span>🔍 Kaura:</span>
                  <strong className="text-red-900 text-sm">154.20 v.</strong>
                </>
              ) : (
                <>
                  <span className="italic font-serif text-xs">💧 Mustetahra I</span>
                  <span className="text-[10px] bg-amber-500/20 border border-amber-400/50 px-2 py-0.5 rounded text-amber-200">
                    Napauta luupilla
                  </span>
                </>
              )}
            </button>

            <div className="text-[11px] text-[#785434] italic pt-1 border-t border-[#a88456]/30">
              Debet yht = 420.00 + 280.50 + Kaura
            </div>
          </div>

          {/* Column 2: Kredit */}
          <div className="bg-[#f8eedb] p-3 rounded-lg border border-[#c4a474] space-y-2 shadow-sm">
            <span className="font-bold text-[#4a2e16] block uppercase border-b border-[#a88456]/40 pb-1 text-xs">
              2. Tilitetyt (Kredit)
            </span>
            <div className="flex justify-between py-0.5">
              <span>Sysmän mylly:</span>
              <strong className="text-[#1f1308]">310.00 v.</strong>
            </div>
            <div className="flex justify-between py-0.5">
              <span>Maaherran vero:</span>
              <strong className="text-[#1f1308]">198.50 v.</strong>
            </div>

            {/* Blot 2 interactive button */}
            <button
              type="button"
              data-blot="2"
              onClick={() => inspectBlot(2)}
              className={`w-full p-2 rounded-lg border text-left transition flex items-center justify-between touch-manipulation ${
                discoveredBlots.includes(2)
                  ? 'bg-[#fef08a] border-[#ca8a04] text-[#422006] shadow-sm'
                  : 'bg-[#1c120c] border-[#5c3e21] text-amber-100 hover:bg-[#2b1c13]'
              }`}
            >
              {discoveredBlots.includes(2) ? (
                <>
                  <span>🔍 Siemenvilja:</span>
                  <strong className="text-red-900 text-sm">203.35 v.</strong>
                </>
              ) : (
                <>
                  <span className="italic font-serif text-xs">💧 Mustetahra II</span>
                  <span className="text-[10px] bg-amber-500/20 border border-amber-400/50 px-2 py-0.5 rounded text-amber-200">
                    Napauta luupilla
                  </span>
                </>
              )}
            </button>

            <div className="text-[11px] text-[#785434] italic pt-1 border-t border-[#a88456]/30">
              Kredit yht = 310.00 + 198.50 + Siemenvilja
            </div>
          </div>

          {/* Column 3: Notes */}
          <div className="bg-[#f8eedb] p-3 rounded-lg border border-[#c4a474] space-y-2 shadow-sm">
            <span className="font-bold text-[#4a2e16] block uppercase border-b border-[#a88456]/40 pb-1 text-xs">
              3. Arkiston Huomiot
            </span>
            <div className="flex justify-between py-0.5">
              <span>Tarkastettu:</span>
              <strong>27.10.1888</strong>
            </div>
            <div className="flex justify-between py-0.5">
              <span>Kultaruplat:</span>
              <strong>400 kpl</strong>
            </div>

            {/* Blot 3 interactive button */}
            <button
              type="button"
              data-blot="3"
              onClick={() => inspectBlot(3)}
              className={`w-full p-2 rounded-lg border text-left transition flex items-center justify-between touch-manipulation ${
                discoveredBlots.includes(3)
                  ? 'bg-[#fef08a] border-[#ca8a04] text-[#422006] shadow-sm'
                  : 'bg-[#1c120c] border-[#5c3e21] text-amber-100 hover:bg-[#2b1c13]'
              }`}
            >
              {discoveredBlots.includes(3) ? (
                <div className="text-[11px] leading-tight">
                  <span className="font-bold block text-red-950">🔍 VESILEIMAN KAAVA:</span>
                  <span>Tase-ero = Debet yht. − Kredit yht.</span>
                </div>
              ) : (
                <>
                  <span className="italic font-serif text-xs">💧 Mustetahra III</span>
                  <span className="text-[10px] bg-amber-500/20 border border-amber-400/50 px-2 py-0.5 rounded text-amber-200">
                    Napauta luupilla
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Desktop floating lens effect */}
        {lensPos && (
          <div
            className="hidden md:flex absolute pointer-events-none rounded-full border-2 border-[#d4af37]/60 items-center justify-center"
            style={{
              width: 64,
              height: 64,
              left: lensPos.x - 32,
              top: lensPos.y - 32,
              background: 'radial-gradient(circle, rgba(254,240,138,0.25) 0%, rgba(212,175,55,0.1) 100%)',
            }}
          />
        )}
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
              <span className="text-[11px] text-emerald-400 font-mono font-bold">✓ Oikein (854.70)</span>
            )}
          </div>
          <p className="text-[11px] text-[#a88456] mb-2">
            Ruis (420.00) + Ohra (280.50) + Kaura ({discoveredBlots.includes(1) ? '154.20' : 'Tahra I'}):
          </p>
          <input
            type="text"
            inputMode="decimal"
            placeholder="Syötä Debet-summa (esim. 854.70)..."
            value={debetSumInput}
            onChange={(e) => setDebetSumInput(e.target.value)}
            className="w-full bg-[#0d0905] border border-[#5c3e21] text-[#fbbf24] px-3 py-2.5 rounded-lg font-typewriter text-sm focus:outline-none focus:border-[#d4af37]"
          />
        </div>

        {/* Step 2: Kredit Sum */}
        <div className="bg-[#18110a] p-3.5 rounded-xl border border-[#4a3219]">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-cinzel font-bold text-[#fbbf24]">
              2. TILITETYT (KREDIT) YHTEENSÄ:
            </label>
            {isKreditCorrect && (
              <span className="text-[11px] text-emerald-400 font-mono font-bold">✓ Oikein (711.85)</span>
            )}
          </div>
          <p className="text-[11px] text-[#a88456] mb-2">
            Mylly (310.00) + Vero (198.50) + Siemenvilja ({discoveredBlots.includes(2) ? '203.35' : 'Tahra II'}):
          </p>
          <input
            type="text"
            inputMode="decimal"
            placeholder="Syötä Kredit-summa (esim. 711.85)..."
            value={kreditSumInput}
            onChange={(e) => setKreditSumInput(e.target.value)}
            className="w-full bg-[#0d0905] border border-[#5c3e21] text-[#fbbf24] px-3 py-2.5 rounded-lg font-typewriter text-sm focus:outline-none focus:border-[#d4af37]"
          />
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-950/80 border border-red-500/60 rounded-xl text-xs text-red-200 font-serif">
          {errorMsg}
        </div>
      )}

      {/* Step 3: Final Balance Difference Input */}
      <form onSubmit={handleSubmit} className="pt-1 flex flex-col sm:flex-row gap-2.5">
        <div className="flex-1">
          <label className="text-xs font-cinzel font-bold text-[#d4af37] block mb-1">
            3. PUUTTUVA TASE-EROTUS (DEBET − KREDIT):
          </label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="Syötä laskettu tase-erotus (kahdella desimaalilla)..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className="w-full bg-[#0d0905] border border-[#5c3e21] text-[#fbbf24] px-4 py-2.5 rounded-lg font-typewriter text-sm uppercase focus:outline-none focus:border-[#d4af37]"
          />
        </div>
        <button
          type="submit"
          className="btn-brass font-bold text-xs font-cinzel px-5 py-3 rounded-lg uppercase flex items-center justify-center gap-2 sm:self-end touch-manipulation"
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
