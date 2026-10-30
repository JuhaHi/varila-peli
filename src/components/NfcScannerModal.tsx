'use client';

import React, { useState } from 'react';
import { X, Sparkles, Smartphone, Compass } from 'lucide-react';
import { soundFX } from '@/lib/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onScanTag: (tagId: string) => void;
}

export const NfcScannerModal: React.FC<Props> = ({ isOpen, onClose, onScanTag }) => {
  const [customTag, setCustomTag] = useState('');

  if (!isOpen) return null;

  const quickTags = [
    { key: 'ASKO-1888', label: 'Lahti // Askon Tehdasalue (Viikko 1)', desc: 'Konepajan vanha tiiliseinä' },
    { key: 'MAAHERRA-1888', label: 'Heinola // Maaherranpuisto (Viikko 2)', desc: 'Vanhan puukirkon lyhdyn jalka' },
    { key: 'KENTTA-1888', label: 'Lahti / Heinola // Urheilukenttä (Viikko 3)', desc: 'Katsomon kaide & radiorasti' },
    { key: 'NUORAMOINEN-1888', label: 'Nuoramoinen // Virkatalon Piha (Viikko 4)', desc: 'Aitan seinä / kuistin lyhty' },
  ];

  const handleSelectQuick = (tagKey: string) => {
    soundFX.playKeyClick();
    onScanTag(tagKey);
    onClose();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTag.trim()) return;
    soundFX.playKeyClick();
    onScanTag(customTag.trim().toUpperCase());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-serif">
      <div className="parchment-card border-2 border-[#d4af37] rounded-2xl max-w-lg w-full p-6 shadow-[0_0_50px_rgba(0,0,0,0.9)] relative animate-fadeIn">
        {/* Close Button */}
        <button
          onClick={() => {
            soundFX.playKeyClick();
            onClose();
          }}
          className="absolute top-4 right-4 text-[#ab8a5f] hover:text-[#fbbf24] p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 text-[#fbbf24] mb-3">
          <Compass className="w-6 h-6 text-[#d4af37] animate-spin" style={{ animationDuration: '12s' }} />
          <h2 className="text-base sm:text-lg font-bold font-cinzel tracking-wider text-lantern">
            NFC-TUNNISTEEN SKANNAUS
          </h2>
        </div>

        <p className="text-xs text-[#e4cdad] mb-4 leading-relaxed italic">
          Oikeassa pelissä pelaaja koskettaa fyysistä NFC-tarraa puhelimella, jolloin linkki 
          (<code className="font-typewriter text-[#fde047] font-bold">?nfc=TAG_ID</code>) avaa suoraan anomalian. 
          Voit myös simuloida fyysisiä rasteja tästä:
        </p>

        {/* Quick NFC Locations */}
        <div className="space-y-2 mb-5">
          <span className="text-[11px] text-[#d4af37] font-bold font-cinzel block uppercase tracking-wider">
            Valitse fyysinen rasti testattavaksi:
          </span>

          {quickTags.map((t) => (
            <button
              key={t.key}
              onClick={() => handleSelectQuick(t.key)}
              className="w-full text-left p-3 rounded-xl bg-[#18110a] hover:bg-[#251a10] border border-[#4a3219] hover:border-[#d4af37] transition flex items-start justify-between group shadow-sm"
            >
              <div>
                <div className="text-xs font-bold text-[#fef3c7] font-cinzel group-hover:text-[#fbbf24]">
                  {t.label}
                </div>
                <div className="text-[11px] text-[#ab8a5f] mt-0.5">{t.desc}</div>
              </div>
              <span className="text-[11px] font-typewriter bg-[#2d1b0c] text-[#fbbf24] px-2.5 py-1 rounded border border-[#5c3e21]">
                {t.key}
              </span>
            </button>
          ))}
        </div>

        {/* Manual tag code entry */}
        <form onSubmit={handleCustomSubmit} className="pt-3 border-t border-[#4a3219]">
          <label className="text-xs text-[#d4af37] font-cinzel block mb-1.5">
            TAI SYÖTÄ MUKAUTETTU TUNNISTE:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="esim. ASKO-1888"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              className="flex-1 bg-[#0d0905] border border-[#5c3e21] text-[#fbbf24] text-xs px-3 py-2.5 rounded-lg focus:outline-none focus:border-[#d4af37] uppercase font-typewriter"
            />
            <button
              type="submit"
              className="btn-brass font-bold px-4 py-2.5 rounded-lg text-xs font-cinzel uppercase"
            >
              Lue tagi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
