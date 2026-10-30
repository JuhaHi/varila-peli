'use client';

import React, { useState, useRef } from 'react';
import { Film, Play, FastForward, CheckCircle2, Timer as TimerIcon, AlertTriangle } from 'lucide-react';
import { soundFX } from '@/lib/audio';

interface TaskGateProps {
  playerId: string;
  nodeKey: string;
  title: string;
  targetPerson?: string;
  storyText?: string;
  videoUrl: string;
  onTaskStarted: (startedAt: string) => void;
}

export const TaskGate: React.FC<TaskGateProps> = ({
  playerId,
  nodeKey,
  title,
  targetPerson,
  storyText,
  videoUrl,
  onTaskStarted,
}) => {
  const [phase, setPhase] = useState<'prompt' | 'playing' | 'ready'>('prompt');
  const [loading, setLoading] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Käynnistää videon käyttäjän painalluksesta (ratkaisee mobiiliselainten Autoplay-ongelman)
  const handleStartPlayback = () => {
    soundFX.playKeyClick();
    setPhase('playing');
    setVideoError(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch((err) => {
        console.warn('Autoplay vaatii käyttäjän hyväksynnän:', err);
      });
    }
  };

  // Video päättyi tai pelaaja ohitti katselun -> kutsutaan backendin aikalaskuria
  const handleProceedToTask = async () => {
    soundFX.playKeyClick();
    setLoading(true);
    try {
      const res = await fetch('/api/game/start-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, nodeKey }),
      });
      const data = await res.json().catch(() => ({}));
      soundFX.playSuccess();
      const timestamp = data.startedAt || data.started_at || new Date().toISOString();
      onTaskStarted(timestamp);
    } catch (e) {
      console.error(e);
      soundFX.playSuccess();
      onTaskStarted(new Date().toISOString());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto parchment-card border-2 border-[#d4af37] rounded-2xl overflow-hidden font-serif text-[#e8d5b5] shadow-[0_0_50px_rgba(0,0,0,0.85)] animate-fadeIn">
      {/* VAIHE 1: Käynnistyskehotus (Käyttäjän kosketus avaa äänet ja videon) */}
      {phase === 'prompt' && (
        <div className="p-6 sm:p-8 text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/80 border border-red-500/60 text-red-300 text-[11px] font-mono tracking-widest uppercase animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span>SALATTU ANOMALIASIGNAALI VASTAANOTETTU</span>
          </div>

          <div>
            <div className="text-xs text-[#a88456] font-cinzel font-bold mb-1">
              {nodeKey}
            </div>
            <h2 className="text-lg sm:text-xl font-bold font-cinzel tracking-wider text-[#fbbf24] text-lantern uppercase">
              {title}
            </h2>
          </div>

          <div className="paper-document p-4 rounded-xl text-[#2b1d0c] text-xs leading-relaxed text-left shadow-inner space-y-2">
            <div className="flex items-center gap-2 font-cinzel font-bold text-[#5c3e21] text-[11px] border-b border-[#a88456]/40 pb-1">
              <Film className="w-3.5 h-3.5 text-[#5c3e21]" />
              <span>ARKISTOFILMI // PROTOKOLLA 1888:</span>
            </div>
            <p className="italic">
              {storyText ||
                'Arkistosta palautettu filmikatkelma vuodelta 1888 sisältää kriittisen vihjeen anomalian purkamiseen. Katso tallenne rauhassa ennen siirtymistä purkutyöhön.'}
            </p>
            <p className="text-[11px] text-[#785434] font-mono">
              ⏱️ <strong>Huomio:</strong> Henkilökohtainen aikalaskuri EI käy videon aikana, vaan alkaa vasta videon jälkeen!
            </p>
          </div>

          <button
            onClick={handleStartPlayback}
            className="w-full btn-brass font-cinzel font-extrabold py-4 px-6 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2.5 uppercase tracking-wider shadow-2xl transition group"
          >
            <Play className="w-4 h-4 text-[#fef08a] group-hover:scale-110 transition-transform" />
            <span>Avaa ja katso anomaliatallenne</span>
          </button>
        </div>
      )}

      {/* VAIHE 2: Video toistuu (Suoratoisto R2:sta, Aika ei kulu) */}
      <div className={phase === 'prompt' ? 'hidden' : 'relative bg-[#070503]'}>
        <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            src={videoUrl}
            playsInline
            controls={phase === 'playing'}
            preload="auto"
            onError={() => setVideoError(true)}
            onEnded={() => {
              soundFX.playKeyClick();
              setPhase('ready');
            }}
            className="w-full h-full object-contain"
          />

          {videoError && (
            <div className="absolute inset-0 bg-[#0d0905]/95 flex flex-col items-center justify-center p-4 text-center space-y-2">
              <Film className="w-8 h-8 text-[#a88456]" />
              <p className="text-xs text-[#e4cdad]">
                Videotallenne ei ole vielä saatavilla Cloudflare R2 -varastossa tai yhteys katkesi.
              </p>
              <button
                onClick={() => setPhase('ready')}
                className="btn-brass text-xs font-cinzel font-bold px-4 py-2 rounded-lg uppercase"
              >
                Jatka suoraan purkutehtävään →
              </button>
            </div>
          )}
        </div>

        {phase === 'playing' && (
          <div className="p-3 bg-[#140e0a] border-t border-[#5c3e21] flex justify-between items-center text-xs font-cinzel">
            <div className="flex items-center gap-2 text-[#fbbf24]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[11px] uppercase tracking-wider text-[#d4af37]">
                Toistetaan arkistosignaalia (Kello ei käy)
              </span>
            </div>
            <button
              onClick={() => {
                if (videoRef.current) videoRef.current.pause();
                soundFX.playKeyClick();
                setPhase('ready');
              }}
              className="text-[#a88456] hover:text-[#fbbf24] underline text-[11px] flex items-center gap-1 transition"
            >
              <span>Ohita katselu</span>
              <FastForward className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* VAIHE 3: Video katsottu -> Käynnistetään kello ja siirrytään minipeliin */}
        {phase === 'ready' && (
          <div className="p-6 bg-[#170f08] border-t-2 border-[#d4af37] text-center space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs font-cinzel font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>TALLENNE REKISTERÖITY & KATSETTU</span>
            </div>

            <p className="text-xs text-[#e4cdad] max-w-md mx-auto">
              Kun painat alla olevaa painiketta, <strong>henkilökohtainen aikalaskuri käynnistyy palvelimella</strong> ja anomalian murtomekanismi aukeaa ruudulle!
            </p>

            <button
              disabled={loading}
              onClick={handleProceedToTask}
              className="w-full btn-brass font-cinzel font-extrabold py-4 px-6 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2.5 uppercase tracking-wider shadow-2xl transition disabled:opacity-50"
            >
              <TimerIcon className="w-4 h-4 text-[#fef08a] animate-spin-slow" />
              <span>{loading ? 'Käynnistetään ajanottoa...' : 'Siirry ratkaisemaan tehtävää ⏱️'}</span>
            </button>

            <button
              onClick={() => {
                soundFX.playKeyClick();
                handleStartPlayback();
              }}
              className="text-xs text-[#a88456] hover:text-[#fbbf24] underline font-serif block mx-auto"
            >
              Katso tallenne uudelleen ennen aloitusta
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskGate;
