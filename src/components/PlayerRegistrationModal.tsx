'use client';

import React, { useState } from 'react';
import { Feather, Shield, KeyRound, UserPlus, ArrowRight, UserCheck } from 'lucide-react';
import { soundFX } from '@/lib/audio';
import { Player } from '@/lib/types';

interface Props {
  isOpen: boolean;
  onRegistered: (player: Player) => void;
  onLogout?: () => void;
  currentPlayerName?: string;
  canClose?: boolean;
  onClose?: () => void;
}

export const PlayerRegistrationModal: React.FC<Props> = ({
  isOpen,
  onRegistered,
  onLogout,
  currentPlayerName = '',
  canClose = false,
  onClose,
}) => {
  const [name, setName] = useState(currentPlayerName);
  const [pinCode, setPinCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanPin = pinCode.trim();

    if (!cleanName) {
      setError('Syötä nimesi.');
      return;
    }
    if (!cleanPin || cleanPin.length < 4) {
      setError('Syötä 4-numeroinen PIN-koodi.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    soundFX.playKeyClick();

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cleanName, pinCode: cleanPin }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.player) {
        soundFX.playSuccess();
        if (typeof window !== 'undefined') {
          localStorage.setItem('varila_player_id', data.player.id);
          localStorage.setItem('varila_player_name', data.player.name);
          localStorage.setItem('varila_player_pin', cleanPin);
        }
        onRegistered(data.player);
      } else {
        soundFX.playFailure();
        setError(data.error || 'Virhe kirjautumisessa.');
      }
    } catch {
      soundFX.playFailure();
      setError('Yhteysvirhe. Tarkista verkkoyhteys.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 font-serif">
      <div className="parchment-card border-2 border-[#d4af37] rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-[0_0_60px_rgba(0,0,0,0.95)] relative animate-fadeIn">
        {/* Top Seal */}
        <div className="flex justify-center mb-4">
          <div className="wax-seal w-14 h-14 font-gothic text-base font-bold shadow-2xl">
            1888
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-5">
          <h2 className="text-lg sm:text-xl font-bold font-cinzel tracking-wider text-[#fbbf24] text-lantern">
            VÄRILÄN ARKISTOPÄÄTE // 1888
          </h2>
          <p className="text-xs text-[#ab8a5f] font-serif italic mt-1">
            Henkilökohtainen tutkijatunnus ja aikalaskuri
          </p>
        </div>

        {/* Letter description */}
        <div className="paper-document p-4 rounded-xl text-[#2b1d0c] text-xs leading-relaxed mb-5 shadow-inner">
          <div className="flex items-center gap-2 mb-2 font-cinzel font-bold text-[#5c3e21] text-[11px] border-b border-[#a88456] pb-1">
            <Feather className="w-3.5 h-3.5 text-[#5c3e21]" />
            <span>KAPPALAISEN OHJEISTUS OSALLISTUJILLE:</span>
          </div>
          <p className="italic">
            &quot;Jokainen 11 osallistujasta pelaa henkilökohtaisesti omalla laitteellaan. 
            Jos tulet ensimmäistä kertaa, valitse itsellesi vapaa 4-numeroinen PIN-koodi. 
            Jos palaat toisella laitteella, syötä sama nimi ja PIN-koodi.&quot;
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-[#d4af37] font-cinzel font-bold block mb-1.5 uppercase tracking-wide">
              Pelaajan Nimi:
            </label>
            <input
              type="text"
              placeholder="esim. Matti / Liisa / Antti..."
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              autoFocus
              maxLength={35}
              className="w-full bg-[#0d0905] border-2 border-[#5c3e21] focus:border-[#d4af37] text-[#fbbf24] text-sm px-4 py-3 rounded-xl font-serif focus:outline-none shadow-inner placeholder-[#785434]"
            />
          </div>

          <div>
            <label className="text-xs text-[#d4af37] font-cinzel font-bold block mb-1.5 uppercase tracking-wide">
              Valitse oma 4-numeroinen PIN-koodi:
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-[#a88456]" />
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="4 numeroa (esim. 1234)"
                value={pinCode}
                onChange={(e) => {
                  setPinCode(e.target.value.replace(/\D/g, ''));
                  if (error) setError(null);
                }}
                className="w-full bg-[#0d0905] border-2 border-[#5c3e21] focus:border-[#d4af37] text-[#fbbf24] text-base pl-10 pr-4 py-2.5 rounded-xl font-typewriter tracking-widest focus:outline-none shadow-inner placeholder-[#785434]"
              />
            </div>
            <p className="text-[10px] text-[#a88456] mt-1 font-serif">
              Tällä PIN-koodilla voit jatkaa samalla nimellä toiselta laitteelta tai selaimen tyhjennyksen jälkeen.
            </p>
          </div>

          {error && (
            <p className="text-xs text-red-400 font-serif italic">
              ⚠️ {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !name.trim() || pinCode.length < 4}
            className="w-full btn-brass font-extrabold py-3.5 px-4 rounded-xl font-cinzel text-xs sm:text-sm flex items-center justify-center gap-2 uppercase tracking-wider shadow-2xl transition disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Tarkistetaan tunnusta...' : 'Astu Arkistopäätteelle'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {canClose && onClose && (
            <div className="flex items-center justify-between pt-2 border-t border-[#5c3e21]/50">
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="text-xs text-red-400 hover:text-red-300 py-1 font-serif underline"
                >
                  Kirjaudu ulos ({currentPlayerName})
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-[#a88456] hover:text-[#fbbf24] py-1 font-serif underline ml-auto"
              >
                Sulje ikkuna
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
