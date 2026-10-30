'use client';

import React, { useState } from 'react';
import { Lock, Unlock, Key, Gift, Flashlight, Sparkles, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundFX } from '@/lib/audio';

interface Props {
  onSuccessCode: (code: string) => void;
}

export const NuoramoinenChest: React.FC<Props> = ({ onSuccessCode }) => {
  const [wireCut, setWireCut] = useState(false);
  const [pinRemoved, setPinRemoved] = useState(false);
  const [lock1, setLock1] = useState('');
  const [lock2, setLock2] = useState('');
  const [lock3, setLock3] = useState('');
  const [lock4, setLock4] = useState('');
  const [isOpened, setIsOpened] = useState(false);
  const [flashlightOn, setFlashlightOn] = useState(false);

  const checkChestUnlock = () => {
    soundFX.playKeyClick();
    const l1Ok = lock1.trim().toUpperCase().includes('AKSELI');
    const l2Ok = lock2.trim().toUpperCase().includes('TINKTUURA');
    const l3Ok = lock3.trim().toUpperCase().includes('SYSMA');
    const l4Ok = lock4.trim().toUpperCase().includes('VARILA') || lock4.trim().toUpperCase().includes('1888');

    if (!wireCut || !pinRemoved) {
      soundFX.playFailure();
      alert('Kirstun mekaaninen teräsvaijeri ja lukitussokka ovat vielä kiinni! Asentajan on purettava sokat.');
      return;
    }

    if (l1Ok && l2Ok && l3Ok && l4Ok) {
      soundFX.playSuccess();
      setIsOpened(true);
      onSuccessCode('VARILA-SINETTI-1888');
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#d4af37', '#f59e0b', '#b91c1c', '#ffffff'],
      });
    } else {
      soundFX.playFailure();
      alert('Lukkojen yhdistelmät eivät täsmää! Tarkista kaikkien viikkojen kerätyt koodit.');
    }
  };

  return (
    <div className="parchment-card rounded-xl p-4 sm:p-6 border-2 border-[#5c3e21] shadow-2xl relative overflow-hidden">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-[#5c3e21] pb-3 mb-4">
        <div className="flex items-center gap-2 text-[#fbbf24]">
          <Award className="w-6 h-6 text-[#d4af37] animate-pulse" />
          <h2 className="text-base sm:text-lg font-bold font-cinzel tracking-wider uppercase text-lantern">
            VÄRILÄN MONILUKKOARKKU // FINALI 1888
          </h2>
        </div>
        <button
          onClick={() => {
            soundFX.playKeyClick();
            setFlashlightOn(!flashlightOn);
          }}
          className={`px-3 py-1.5 text-xs font-cinzel font-bold rounded-lg border flex items-center gap-1.5 transition ${
            flashlightOn
              ? 'bg-[#d4af37] text-black border-white shadow-[0_0_15px_rgba(212,175,55,0.7)]'
              : 'bg-[#18110a] text-[#a88456] border-[#4a3219]'
          }`}
        >
          <Flashlight className="w-3.5 h-3.5" />
          <span>{flashlightOn ? 'TASKULAMPPU PÄÄLLÄ' : 'TASKULAMPPUTILA (Lapset)'}</span>
        </button>
      </div>

      {flashlightOn && (
        <div className="mb-4 p-3.5 bg-[#2a1b0d] border border-[#d4af37] rounded-lg text-xs font-serif text-[#fef3c7] animate-pulse shadow-lg">
          <p className="font-bold flex items-center gap-1.5 text-[#fbbf24] font-cinzel">
            <Sparkles className="w-4 h-4" />
            Lapset löysivät taskulampulla salin heijastimesta kaiverruksen:
          </p>
          <p className="mt-1 italic">
            &quot;Viimeinen sinetti aukeaa koodilla: <span className="font-typewriter text-[#fde047] font-bold">VARILA-SINETTI-1888</span>&quot;
          </p>
        </div>
      )}

      {/* Mechanical Wire & Pin Release (Nuorempi asentaja) */}
      <div className="bg-[#18110a] p-4 rounded-lg border border-[#4a3219] mb-4">
        <h3 className="text-xs font-bold font-cinzel text-[#d4af37] mb-2.5 flex items-center gap-2">
          <span>1. MEKAANINEN SOKKALUKITUS (Nuorempi asentaja):</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => {
              soundFX.playKeyClick();
              setWireCut(!wireCut);
            }}
            className={`py-2.5 px-3 rounded-lg text-xs font-cinzel font-bold border flex items-center justify-center gap-2 transition ${
              wireCut
                ? 'bg-[#142617] border-[#25e24c] text-[#4ade80]'
                : 'btn-brass'
            }`}
          >
            {wireCut ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            <span>{wireCut ? 'TERÄSVAIJERI KATKAISTU ✓' : 'KATKAISE TERÄSVAIJERI'}</span>
          </button>

          <button
            onClick={() => {
              soundFX.playKeyClick();
              setPinRemoved(!pinRemoved);
            }}
            className={`py-2.5 px-3 rounded-lg text-xs font-cinzel font-bold border flex items-center justify-center gap-2 transition ${
              pinRemoved
                ? 'bg-[#142617] border-[#25e24c] text-[#4ade80]'
                : 'btn-brass'
            }`}
          >
            {pinRemoved ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            <span>{pinRemoved ? 'LUKITUSSOKKA VAPAUTETTU ✓' : 'VEDÄ LUKITUSSOKKA'}</span>
          </button>
        </div>
      </div>

      {/* 4 Antique Padlocks */}
      <div className="bg-[#18110a] p-4 rounded-lg border border-[#4a3219] mb-4">
        <h3 className="text-xs font-bold font-cinzel text-[#d4af37] mb-3">
          2. SUKULAISTEN KERÄÄMÄT RIIPULUKKOJEN KOODIT:
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="text-[#a88456] font-cinzel block mb-1">Lukko 1 (Asko / Konepaja):</label>
            <input
              type="text"
              placeholder="esim. AKSELI-48-1888"
              value={lock1}
              onChange={(e) => setLock1(e.target.value)}
              className="w-full bg-[#0d0905] border border-[#5c3e21] text-[#fbbf24] p-2 rounded font-typewriter uppercase focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          <div>
            <label className="text-[#a88456] font-cinzel block mb-1">Lukko 2 (Heinola / Rohdos):</label>
            <input
              type="text"
              placeholder="esim. TINKTUURA-1888"
              value={lock2}
              onChange={(e) => setLock2(e.target.value)}
              className="w-full bg-[#0d0905] border border-[#5c3e21] text-[#fbbf24] p-2 rounded font-typewriter uppercase focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          <div>
            <label className="text-[#a88456] font-cinzel block mb-1">Lukko 3 (Sysmä / Taajuus):</label>
            <input
              type="text"
              placeholder="esim. SYSMA-61.42-1888"
              value={lock3}
              onChange={(e) => setLock3(e.target.value)}
              className="w-full bg-[#0d0905] border border-[#5c3e21] text-[#fbbf24] p-2 rounded font-typewriter uppercase focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          <div>
            <label className="text-[#a88456] font-cinzel block mb-1">Lukko 4 (Nuoramoisten Piha):</label>
            <input
              type="text"
              placeholder="esim. VARILA-SINETTI-1888"
              value={lock4}
              onChange={(e) => setLock4(e.target.value)}
              className="w-full bg-[#0d0905] border border-[#5c3e21] text-[#fbbf24] p-2 rounded font-typewriter uppercase focus:outline-none focus:border-[#d4af37]"
            />
          </div>
        </div>
      </div>

      <button
        onClick={checkChestUnlock}
        className="w-full btn-brass font-extrabold py-3.5 px-4 rounded-xl font-cinzel text-sm sm:text-base flex items-center justify-center gap-2 uppercase tracking-wider shadow-2xl"
      >
        <Key className="w-5 h-5" />
        <span>AVAA VÄRILÄN PÄÄSINETTI & KIRSTU</span>
      </button>

      {/* Secret Letter and Rewards Revealed */}
      {isOpened && (
        <div className="mt-5 p-5 bg-[#17100a] border-2 border-[#d4af37] rounded-xl animate-fadeIn shadow-2xl">
          <div className="flex items-center gap-2 text-[#fbbf24] font-bold font-cinzel text-sm mb-3">
            <Gift className="w-5 h-5 text-[#d4af37]" />
            <span>KIRSTU ON AVATTU! KAPPALAISEN VIIMEINEN KIRJE (1888)</span>
          </div>

          <div className="paper-document p-5 rounded-lg text-[#2b1d0c] font-serif leading-relaxed text-sm shadow-lg relative">
            <div className="wax-seal w-9 h-9 absolute top-3 right-3 font-gothic text-xs font-bold">
              1888
            </div>
            <p className="mb-3 italic">
              &quot;Rakkaat perilliseni ja sukulaiseni. Jos luette tätä Nuoramoisten pappilan salissa, olette osoittaneet, 
              että yhdessä yhdistetyt taidot – koneenrakennus, hoitotyö, tarkka tilinpito, urheilun sitkeys ja nuorten valppaus – 
              voittavat vuosisatojen salaisuudet.&quot;
            </p>
            <p className="mb-3 italic">
              &quot;Virkatalon perintö on palautettu. Nostakaamme juhlamaljat ja jakakaamme kirstun aarteet!&quot;
            </p>
            <p className="text-right font-bold text-[#5c3e21] not-italic font-cinzel">
              — Nuoramoisten kappalainen, Lokakuu 1888
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 font-serif">
            <div className="bg-[#24170d] p-3.5 rounded-lg border border-[#d4af37]/40 text-center">
              <span className="text-3xl mb-1 block">🍬🍫</span>
              <strong className="text-[#fbbf24] block text-xs font-cinzel">Palkinnot nuorisolle & lapsille:</strong>
              <span className="text-xs text-[#e4cdad]">Suuri karkkisaalis ja juhlapalkinnot jaettu!</span>
            </div>
            <div className="bg-[#24170d] p-3.5 rounded-lg border border-[#d4af37]/40 text-center">
              <span className="text-3xl mb-1 block">🍷🥂</span>
              <strong className="text-[#fbbf24] block text-xs font-cinzel">Juhlamenu aikuisille:</strong>
              <span className="text-xs text-[#e4cdad]">Illallisen teemamaljat ja virkatalon juhlamenu!</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
