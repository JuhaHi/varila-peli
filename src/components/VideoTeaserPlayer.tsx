'use client';

import React, { useState } from 'react';
import { Film, MapPin } from 'lucide-react';

interface Props {
  week: number;
  title: string;
  videoUrl?: string;
  storyText: string;
  locationName: string;
}

export const VideoTeaserPlayer: React.FC<Props> = ({
  week,
  title,
  videoUrl,
  storyText,
  locationName,
}) => {
  const [useProcedural, setUseProcedural] = useState(false);

  const getImageSrc = () => {
    switch (week) {
      case 1:
        return '/images/steam_engine_1888.jpg';
      case 2:
        return '/images/apothecary_1888.jpg';
      case 3:
        return '/images/radio_apparatus_1888.jpg';
      default:
        return '/images/mansion_1888.jpg';
    }
  };

  const getWeekSubtitle = () => {
    switch (week) {
      case 1:
        return 'Konepajan Sepät & Höyryveturi (Lahti / Asko)';
      case 2:
        return 'Vaietut Reseptit & Heinolan Maaherranpuisto';
      case 3:
        return 'Salainen Kuvio & Radiotaajuus (Urheilukenttä)';
      default:
        return 'Värilän Virkatalo & Finaalin Kirstu (Nuoramoinen)';
    }
  };

  return (
    <div className="parchment-card rounded-xl overflow-hidden my-4 border-2 border-[#5c3e21] shadow-2xl">
      {/* Ornate Header */}
      <div className="bg-[#140e0a] px-3.5 py-2.5 border-b border-[#5c3e21] flex items-center justify-between font-cinzel">
        <div className="flex items-center gap-2 text-[#fbbf24]">
          <Film className="w-4 h-4 text-[#d4af37]" />
          <span className="font-bold text-xs tracking-wider uppercase">
            HISTORIALLINEN ANOMALIA // VIIKKO {week}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-[#ab8a5f] font-serif italic">
          <MapPin className="w-3 h-3 text-[#d4af37]" />
          <span>{locationName}</span>
        </div>
      </div>

      {/* Visual Frame */}
      <div
        className="w-full bg-[#080503] overflow-hidden"
        style={{ position: 'relative', height: '240px', width: '100%' }}
      >
        {!useProcedural && videoUrl && videoUrl.startsWith('https://') && !videoUrl.includes('pub-demo.r2.dev') ? (
          <video
            src={videoUrl}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            controls
            autoPlay
            onError={() => setUseProcedural(true)}
          />
        ) : (
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <img
              src={getImageSrc()}
              alt={title}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'sepia(0.35) contrast(1.1) brightness(0.9)',
              }}
            />

            {/* Vignette */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 50%, rgba(0,0,0,0.4) 100%)',
                pointerEvents: 'none',
              }}
            />

            {/* Subtitle badge in bottom */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <span className="text-xs font-serif font-bold text-[#fef3c7] bg-black/80 px-3 py-1 rounded border border-[#6b4724] backdrop-blur-sm shadow-md">
                {getWeekSubtitle()}
              </span>
              <span className="text-[10px] font-typewriter text-[#d4af37] bg-black/80 px-2 py-1 rounded border border-[#6b4724]">
                1888-10-{(week * 7).toString().padStart(2, '0')}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Archivist Note Parchment */}
      <div className="p-3.5 bg-[#17100a] border-t border-[#4a3219]">
        <div className="text-xs text-[#e4cdad] font-serif leading-relaxed italic">
          <span className="text-[#fbbf24] font-bold not-italic font-cinzel text-[11px] block mb-1">
            ARKISTONHOITAJAN TODISTUS // LOKAKUU 1888:
          </span>
          &quot;{storyText}&quot;
        </div>
      </div>
    </div>
  );
};
