'use client';

import React from 'react';
import Link from 'next/link';
import { Volume2, VolumeX, Flame, User, Award, Edit3, Monitor, Shield } from 'lucide-react';
import { Player } from '@/lib/types';
import { soundFX } from '@/lib/audio';

interface Props {
  players: Player[];
  activePlayerId: string | null;
  activePlayerName: string;
  onOpenProfileModal: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  crtEnabled: boolean;
  onToggleCrt: () => void;
}

export const Header: React.FC<Props> = ({
  players,
  activePlayerId,
  activePlayerName,
  onOpenProfileModal,
  soundEnabled,
  onToggleSound,
  crtEnabled,
  onToggleCrt,
}) => {
  const activePlayer = players.find((p) => p.id === activePlayerId);

  return (
    <header className="bg-[#140e0a] border-b-2 border-[#5c3e21] sticky top-0 z-30 shadow-[0_4px_25px_rgba(0,0,0,0.85)] relative">
      {/* Decorative brass filigree top edge */}
      <div className="h-1 bg-gradient-to-r from-[#5c3e21] via-[#d4af37] to-[#5c3e21] opacity-75" />

      <div className="max-w-6xl mx-auto px-3 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Title and Wax Seal Insignia */}
        <div className="flex items-center gap-3">
          <div className="wax-seal w-10 h-10 shrink-0 font-gothic text-sm font-bold shadow-lg">
            1888
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold font-cinzel tracking-wider text-[#f5d9a0] text-lantern flex items-center gap-1.5">
                <span>TAPAUS VÄRILÄ</span>
                <span className="text-[#8c6738] text-xs font-normal font-serif hidden sm:inline">❖ ANNO 1888</span>
              </h1>
            </div>
            <div className="text-[11px] text-[#ab8a5f] flex items-center gap-2 font-serif italic">
              <Flame className="w-3 h-3 text-[#f59e0b] animate-pulse" />
              <span>Nuoramoisten virkatalon salaiset arkistot</span>
            </div>
          </div>
        </div>

        {/* User Identity & Victorian Score Badge */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap font-serif">
          {/* Active User Name / Edit Profile */}
          <button
            onClick={() => {
              soundFX.playKeyClick();
              onOpenProfileModal();
            }}
            className="flex items-center gap-1.5 bg-[#23180f] hover:bg-[#2d1f14] border border-[#6b4724] hover:border-[#d4af37] px-3 py-1.5 rounded-lg shadow-inner transition group text-left"
            title="Muuta nimeä tai vaihda käyttäjää"
          >
            <User className="w-3.5 h-3.5 text-[#d4af37]" />
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#fef3c7] font-cinzel group-hover:text-[#fbbf24] max-w-[130px] sm:max-w-[180px] truncate">
                {activePlayerName || 'Kirjaudu'}
              </span>
              <Edit3 className="w-3 h-3 text-[#ab8a5f] group-hover:text-[#d4af37]" />
            </div>
          </button>

          {/* Score Badge */}
          <div className="bg-[#2d1b0c] border border-[#d4af37] px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-[0_0_10px_rgba(212,175,55,0.25)] font-typewriter">
            <Award className="w-4 h-4 text-[#fbbf24]" />
            <span className="text-xs font-bold text-[#fef3c7]">
              {activePlayer?.total_score || 0} <span className="text-[10px] text-[#ab8a5f]">PISTETTÄ</span>
            </span>
          </div>

          {/* CRT effect toggle */}
          <button
            onClick={onToggleCrt}
            className={`p-2 rounded-lg border transition ${
              crtEnabled
                ? 'bg-[#183318] text-[#4ade80] border-[#22c55e]'
                : 'bg-[#23180f] text-[#ab8a5f] border-[#6b4724]'
            }`}
            title={crtEnabled ? 'CRT-tehoste päällä' : 'CRT-tehoste pois'}
          >
            <Monitor className="w-4 h-4" />
          </button>

          {/* Sound toggle */}
          <button
            onClick={onToggleSound}
            className={`p-2 rounded-lg border transition ${
              soundEnabled
                ? 'bg-[#23180f] text-[#fbbf24] border-[#6b4724]'
                : 'bg-red-950/40 text-red-400 border-red-800'
            }`}
            title={soundEnabled ? 'Äänet päällä' : 'Äänet mykistetty'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Admin link */}
          <Link
            href="/admin"
            className="p-2 rounded-lg bg-[#140e0a] hover:bg-[#23180f] border border-[#5c3e21] text-[#a88456] hover:text-[#fbbf24] transition"
            title="Järjestäjän ohjauspääte (/admin)"
          >
            <Shield className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
};
