'use client';

import React from 'react';
import { Trophy, Clock, Zap, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Player, TaskAttempt } from '@/lib/types';
import { soundFX } from '@/lib/audio';

interface Props {
  players: Player[];
  solves: TaskAttempt[];
  onRefresh: () => void;
  isLoading: boolean;
}

export const LeaderboardTab: React.FC<Props> = ({
  players,
  solves,
  onRefresh,
  isLoading,
}) => {
  const sortedPlayers = [...players].sort((a, b) => b.total_score - a.total_score);

  return (
    <div className="space-y-6 font-serif">
      {/* Header and Refresh */}
      <div className="flex items-center justify-between border-b border-[#5c3e21] pb-3">
        <div className="flex items-center gap-2 text-[#fbbf24]">
          <Trophy className="w-5 h-5 text-[#d4af37] animate-pulse" />
          <h2 className="text-base sm:text-lg font-bold font-cinzel tracking-wider text-lantern">
            OSALLISTUJIEN PISTETILANNE & LOKIKIRJA
          </h2>
        </div>
        <button
          onClick={() => {
            soundFX.playKeyClick();
            onRefresh();
          }}
          disabled={isLoading}
          className="btn-brass px-3 py-1.5 rounded-lg text-xs font-cinzel font-bold flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>PÄIVITÄ TILANNE</span>
        </button>
      </div>

      {/* Leaderboard Table */}
      <div className="parchment-card rounded-xl overflow-hidden border-2 border-[#5c3e21] shadow-2xl">
        <div className="bg-[#140e0a] px-4 py-3 border-b border-[#5c3e21] text-xs font-cinzel font-bold text-[#d4af37] flex justify-between uppercase">
          <span>SIJA & PELAAJA</span>
          <span>KOKONAISPISTEET</span>
        </div>

        <div className="divide-y divide-[#4a3219]/60">
          {sortedPlayers.length === 0 ? (
            <div className="p-5 text-center text-xs text-[#a88456] italic">
              Ei vielä rekisteröityneitä pelaajia. Kirjaudu sisään ja ratkaise ensimmäinen anomalia!
            </div>
          ) : (
            sortedPlayers.map((player, idx) => {
              const isFirst = idx === 0 && player.total_score > 0;
              const isSecond = idx === 1 && player.total_score > 0;
              const isThird = idx === 2 && player.total_score > 0;

              return (
                <div
                  key={player.id}
                  className={`px-4 py-3.5 flex items-center justify-between transition ${
                    isFirst
                      ? 'bg-[#2d1b0c] border-l-4 border-l-[#d4af37]'
                      : 'hover:bg-[#18110a]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs font-typewriter ${
                        isFirst
                          ? 'wax-seal text-[#fef08a]'
                          : isSecond
                          ? 'bg-[#4a3622] text-[#fef3c7] border border-[#a88456]'
                          : isThird
                          ? 'bg-[#362414] text-[#a88456] border border-[#5c3e21]'
                          : 'bg-[#1a120b] text-[#785434]'
                      }`}
                    >
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#fef3c7] font-cinzel flex items-center gap-2">
                        <span>{player.name}</span>
                        {isFirst && <span className="text-xs text-[#fbbf24] font-serif italic font-normal">👑 Kärjessä</span>}
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-typewriter">
                    <span className="text-base font-bold text-[#fbbf24]">
                      {player.total_score}
                    </span>
                    <span className="text-xs text-[#ab8a5f] ml-1">p</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Dynamic Scoring Info Banner */}
      <div className="p-4 parchment-card rounded-xl border border-[#5c3e21] text-xs text-[#e4cdad]">
        <h4 className="font-bold text-[#fbbf24] font-cinzel mb-2 flex items-center gap-1.5 text-sm">
          <Zap className="w-4 h-4 text-[#d4af37]" />
          <span>SUHTEELLINEN NOPEUSPISTEYTYS (100p – 10p):</span>
        </h4>
        <p className="text-[11px] text-[#c7af8d] mb-3">
          Ajanotto alkaa vasta silloin, kun avaat kyseisen tehtävän ensimmäisen kerran omalla laitteellasi. Tehtävän pisteet skaalataan suhteellisesti kaikkien tehtävän ratkaisseiden aikojen välillä:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-typewriter text-[11px]">
          <div className="bg-[#18110a] p-2.5 rounded-lg border border-[#4a3219]">
            <span className="text-[#4ade80] font-bold block">Nopein aika:</span>
            <span>100 pistettä</span>
          </div>
          <div className="bg-[#18110a] p-2.5 rounded-lg border border-[#4a3219]">
            <span className="text-[#fbbf24] font-bold block">Väliin sijoittuvat:</span>
            <span>Lineaarisesti 10–100 p</span>
          </div>
          <div className="bg-[#18110a] p-2.5 rounded-lg border border-[#4a3219]">
            <span className="text-[#f87171] font-bold block">Hitain aika:</span>
            <span>10 pistettä</span>
          </div>
        </div>
      </div>

      {/* Recent Submissions Log */}
      <div>
        <h3 className="text-xs font-bold font-cinzel text-[#d4af37] mb-2.5 tracking-wider flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-[#d4af37]" />
          <span>VIIMEISIMMÄT HYVÄKSYTYT RATKAISUT:</span>
        </h3>

        {solves.length === 0 ? (
          <div className="p-4 bg-[#140e0a] border border-[#4a3219] rounded-lg text-center text-xs text-[#ab8a5f] font-serif italic">
            Ei vielä ratkaisuja lokikirjassa. Avaa tehtävä ja ratkaise mysteeri!
          </div>
        ) : (
          <div className="space-y-2 font-serif">
            {solves.map((s) => (
              <div
                key={s.id}
                className="bg-[#18110a] p-3 rounded-lg border border-[#4a3219] flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#25e24c]" />
                    <span className="font-bold text-[#fef3c7] font-cinzel">{s.player_name || 'Pelaaja'}</span>
                    <span className="text-[10px] font-typewriter bg-[#2d1b0c] text-[#fbbf24] px-1.5 py-0.5 rounded border border-[#5c3e21]">
                      {s.node_key}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#ab8a5f] mt-0.5">
                    Ratkaisuaika: {s.duration_seconds || 0}s • {s.completed_at ? new Date(s.completed_at).toLocaleTimeString('fi-FI') : ''}
                  </div>
                </div>

                <div className="text-right font-typewriter">
                  <span className="font-bold text-[#fbbf24]">+{s.awarded_points} p</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
