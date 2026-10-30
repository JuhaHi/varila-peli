'use client';

import React from 'react';
import Link from 'next/link';
import { Database, Shield, RotateCcw, ExternalLink, ArrowRight } from 'lucide-react';
import { soundFX } from '@/lib/audio';
import { isSupabaseConfigured } from '@/lib/supabaseClient';

interface Props {
  onResetGame: () => void;
}

export const AdminToolsTab: React.FC<Props> = ({ onResetGame }) => {
  const handleReset = () => {
    soundFX.playKeyClick();
    if (confirm('Haluatko varmasti alustaa pelin tilan (pisteet ja suoritukset oletukseen)?')) {
      onResetGame();
    }
  };

  return (
    <div className="space-y-6 font-serif text-xs">
      {/* Admin Central Link */}
      <div className="parchment-card p-5 rounded-xl border-2 border-[#25e24c] bg-[#0c140c] shadow-[0_0_30px_rgba(37,226,76,0.2)]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-[#4ade80]">
            <Shield className="w-5 h-5 text-[#25e24c]" />
            <h3 className="font-bold font-cinzel text-sm sm:text-base text-white">
              PROTOKOLLA 1888 // JÄRJESTÄJÄN OHJAUSPÄÄTE
            </h3>
          </div>
          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold font-mono bg-[#143318] text-[#86efac] border border-[#22c55e]">
            /ADMIN
          </span>
        </div>
        <p className="text-[#c7e5cc] text-xs leading-relaxed mb-4">
          NFC-tagit on poistettu käytöstä. Kaikkia 11 tehtävää hallinnoidaan keskitetysti salaisesta 
          hallintapaneelista, josta herätteet jaetaan suoraan WhatsApp-ryhmään yhdellä klikkauksella.
        </p>
        <Link
          href="/admin"
          className="btn-brass inline-flex items-center gap-2 font-cinzel font-bold text-xs px-4 py-2.5 rounded-lg uppercase shadow-lg"
        >
          <span>Avaa Järjestäjän /admin -pääte</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Supabase Status */}
      <div className="parchment-card p-5 rounded-xl border border-[#5c3e21]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-[#fbbf24]">
            <Database className="w-4 h-4 text-[#d4af37]" />
            <h3 className="font-bold font-cinzel text-sm">TIETOKANTATILA // SUPABASE & VARASTO</h3>
          </div>
          <span
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold font-cinzel border ${
              isSupabaseConfigured
                ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                : 'bg-[#2d1b0c] text-[#fbbf24] border-[#d4af37]'
            }`}
          >
            {isSupabaseConfigured ? 'SUPABASE YHDISTETTY' : 'PAIKALLINEN VARASTO (Dev / Fallback)'}
          </span>
        </div>
        <p className="text-[#e4cdad] text-xs leading-relaxed">
          Peli toimii saumattomasti Supabase PostgreSQL -kannassa sekä automaattisessa palvelimen muistivarastossa. 
          Voit ajaa päivitetyn <code className="font-typewriter text-[#fde047]">schema.sql</code> -tiedoston Supabasen SQL Editorissa.
        </p>
      </div>

      {/* Reset Section */}
      <div className="p-5 bg-[#1f0d0d] border border-red-900/80 rounded-xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h4 className="font-bold font-cinzel text-red-300 text-sm">ALUSTA PELIN TILA</h4>
            <p className="text-xs text-red-200/80 mt-0.5">
              Nollaa pelaajat, suorituslokit ja lukitukset oletustilaan.
            </p>
          </div>
          <button
            onClick={handleReset}
            className="bg-red-950 hover:bg-red-800 text-red-200 border border-red-500 font-bold px-4 py-2 rounded-lg text-xs font-cinzel flex items-center gap-1.5 transition uppercase"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Alusta peli</span>
          </button>
        </div>
      </div>
    </div>
  );
};
