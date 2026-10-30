'use client';

import React, { useState } from 'react';
import { Compass, Film, ExternalLink, CheckCircle2, Lock } from 'lucide-react';
import { GameNode } from '@/lib/types';
import { soundFX } from '@/lib/audio';

interface VintageGameMapProps {
  nodes: GameNode[];
  solvedNodeKeys: string[];
  onSelectNode: (nodeKey: string) => void;
}

export const VintageGameMap: React.FC<VintageGameMapProps> = ({
  nodes,
  solvedNodeKeys,
  onSelectNode,
}) => {
  const [selectedNodeKey, setSelectedNodeKey] = useState<string>(nodes[0]?.node_key || 'NODE-01');
  const selectedNode = nodes.find((n) => n.node_key === selectedNodeKey) || nodes[0];
  const isSolved = solvedNodeKeys.includes(selectedNode?.node_key || '');

  return (
    <div className="parchment-card rounded-2xl border-2 border-[#5c3e21] p-4 sm:p-5 shadow-2xl space-y-4 font-serif">
      <div className="flex items-center justify-between border-b border-[#5c3e21] pb-3">
        <div className="flex items-center gap-2 text-[#fbbf24]">
          <Compass className="w-5 h-5 text-[#d4af37]" />
          <h3 className="font-cinzel font-bold text-sm sm:text-base text-[#fef3c7] uppercase">
            NUORAMOISTEN VIRKATALON MAAKARTTA 1888
          </h3>
        </div>
      </div>

      <div className="relative h-[320px] rounded-xl overflow-hidden border-2 border-[#5c3e21] bg-[#0b0805]">
        <iframe
          title="1888 Historiallinen Kartta"
          src="https://www.openstreetmap.org/export/embed.html?bbox=25.85%2C61.41%2C25.92%2C61.44&layer=mapnik&marker=61.4239%2C25.8821"
          className="w-full h-full border-0"
          style={{
            filter: 'sepia(0.85) contrast(1.25) brightness(0.85) hue-rotate(-20deg) invert(0.05)',
          }}
        />
        <div className="absolute bottom-3 left-3 right-3 bg-[#140e0a]/90 backdrop-blur-md p-3 rounded-xl border border-[#d4af37]/60 text-xs text-[#e4cdad]">
          Virkatalon koordinaatit: 61.4239° N, 25.8821° E (Tie 410, Nuoramoinen)
        </div>
      </div>
    </div>
  );
};
