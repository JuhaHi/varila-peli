'use client';

import React, { useState } from 'react';
import { Shield, Sparkles, Award, Lock, CheckCircle2, Eye, Info } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SealAssemblyProgressProps {
  totalNodes: number;
  solvedCount: number;
  solvedNodeKeys: string[];
  nodes: Array<{ node_key: string; title: string }>;
  onSelectNode?: (nodeKey: string) => void;
}

export const SealAssemblyProgress: React.FC<SealAssemblyProgressProps> = ({
  totalNodes = 11,
  solvedCount,
  solvedNodeKeys,
  nodes,
  onSelectNode,
}) => {
  const [selectedSlice, setSelectedSlice] = useState<number | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const percentage = Math.round((solvedCount / totalNodes) * 100);
  const isFullyCompleted = solvedCount >= totalNodes;

  // 11 Heraldic slice titles and symbols in exact NODE-01..NODE-11 order
  const sliceMeta = [
    { num: 1, nodeKey: 'NODE-01', label: 'Panssarilukon leikkauskuva', icon: '⚙️', roman: 'I' },
    { num: 2, nodeKey: 'NODE-02', label: 'Kappalaisen viljatase', icon: '📜', roman: 'II' },
    { num: 3, nodeKey: 'NODE-03', label: 'Höyrykoneen luistiventtiili', icon: '🚂', roman: 'III' },
    { num: 4, nodeKey: 'NODE-04', label: 'Pioneerikoordinaatit', icon: '🧭', roman: 'IV' },
    { num: 5, nodeKey: 'NODE-05', label: 'Kappalaisen aikajana & harhat', icon: '⏳', roman: 'V' },
    { num: 6, nodeKey: 'NODE-06', label: 'Orpopojan traumakartta', icon: '🗺️', roman: 'VI' },
    { num: 7, nodeKey: 'NODE-07', label: 'Tinktuuran letaaliannos', icon: '🧪', roman: 'VII' },
    { num: 8, nodeKey: 'NODE-08', label: 'Kutojan silmukkalasku & kirjoneule', icon: '🧶', roman: 'VIII' },
    { num: 9, nodeKey: 'NODE-09', label: 'Stunt-pyramidin tasapaino', icon: '🤸', roman: 'IX' },
    { num: 10, nodeKey: 'NODE-10', label: 'Pikselikirves ja Tappara', icon: '🪓', roman: 'X' },
    { num: 11, nodeKey: 'NODE-11', label: 'Kuraiset jäljet ja lätäköt', icon: '👢', roman: 'XI' },
  ];

  const isSliceSolved = (index: number) => {
    const key = nodes[index]?.node_key || sliceMeta[index]?.nodeKey || `NODE-${String(index + 1).padStart(2, '0')}`;
    return solvedNodeKeys.includes(key);
  };

  // SVG Geometry for 11 slices
  const radius = 110;
  const centerX = 130;
  const centerY = 130;
  const innerRadius = 42;

  const getSlicePath = (index: number, total: number) => {
    const angleStep = (2 * Math.PI) / total;
    const startAngle = index * angleStep - Math.PI / 2;
    const endAngle = (index + 1) * angleStep - Math.PI / 2;

    const x1 = centerX + radius * Math.cos(startAngle);
    const y1 = centerY + radius * Math.sin(startAngle);
    const x2 = centerX + radius * Math.cos(endAngle);
    const y2 = centerY + radius * Math.sin(endAngle);

    const x3 = centerX + innerRadius * Math.cos(endAngle);
    const y3 = centerY + innerRadius * Math.sin(endAngle);
    const x4 = centerX + innerRadius * Math.cos(startAngle);
    const y4 = centerY + innerRadius * Math.sin(startAngle);

    return `M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 0 0 ${x4} ${y4} Z`;
  };

  const getTextPos = (index: number, total: number) => {
    const angleStep = (2 * Math.PI) / total;
    const midAngle = (index + 0.5) * angleStep - Math.PI / 2;
    const textRadius = (radius + innerRadius) / 2;
    return {
      x: centerX + textRadius * Math.cos(midAngle),
      y: centerY + textRadius * Math.sin(midAngle) + 4,
    };
  };

  return (
    <div className="parchment-card rounded-2xl border-2 border-[#8b5a2b] p-4 sm:p-5 shadow-2xl relative overflow-hidden">
      {/* Background Decorative Crest */}
      <div className="absolute top-0 right-0 -mr-12 -mt-12 opacity-5 pointer-events-none">
        <Shield className="w-64 h-64 text-[#d4af37]" />
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-6">
        {/* SVG Interactive 11-Piece Wax Seal */}
        <div className="relative shrink-0 flex flex-col items-center">
          <div className="relative w-[260px] h-[260px] drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)]">
            <svg
              viewBox="0 0 260 260"
              className="w-full h-full transform transition hover:scale-105 duration-300"
            >
              <defs>
                {/* Gold Gradient for unlocked slices */}
                <radialGradient id="unlockedGold" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
                  <stop offset="0%" stopColor="#fef08a" />
                  <stop offset="40%" stopColor="#eab308" />
                  <stop offset="85%" stopColor="#854d0e" />
                  <stop offset="100%" stopColor="#451a03" />
                </radialGradient>

                {/* Dark Wax Gradient for locked slices */}
                <radialGradient id="lockedWax" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#2e1a11" />
                  <stop offset="70%" stopColor="#190e09" />
                  <stop offset="100%" stopColor="#0d0704" />
                </radialGradient>

                {/* Center Seal Badge Gradient */}
                <radialGradient id="centerSeal" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#b91c1c" />
                  <stop offset="60%" stopColor="#7f1d1d" />
                  <stop offset="100%" stopColor="#450a0a" />
                </radialGradient>

                <filter id="goldenGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Outer Golden Ring */}
              <circle
                cx={centerX}
                cy={centerY}
                r={radius + 6}
                fill="none"
                stroke="#5c3e21"
                strokeWidth="2"
                strokeDasharray="4 3"
              />
              <circle
                cx={centerX}
                cy={centerY}
                r={radius + 2}
                fill="none"
                stroke="#d4af37"
                strokeWidth="1.5"
              />

              {/* Slices 1 to 11 */}
              {Array.from({ length: totalNodes }).map((_, i) => {
                const isUnlocked = isSliceSolved(i);
                const isSelected = selectedSlice === i;
                const pos = getTextPos(i, totalNodes);

                return (
                  <g
                    key={i}
                    onClick={() => setSelectedSlice(i)}
                    className="cursor-pointer transition-all duration-300"
                  >
                    <path
                      d={getSlicePath(i, totalNodes)}
                      fill={isUnlocked ? 'url(#unlockedGold)' : 'url(#lockedWax)'}
                      stroke={isSelected ? '#ffffff' : isUnlocked ? '#fef08a' : '#3d2415'}
                      strokeWidth={isSelected ? '2.5' : isUnlocked ? '1.5' : '1'}
                      filter={isUnlocked ? 'url(#goldenGlow)' : undefined}
                      className="hover:brightness-125 transition"
                    />
                    <text
                      x={pos.x}
                      y={pos.y}
                      fill={isUnlocked ? '#1a0b02' : '#6b4c30'}
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="Cinzel, serif"
                      textAnchor="middle"
                      className="pointer-events-none select-none font-bold"
                    >
                      {sliceMeta[i]?.roman || i + 1}
                    </text>
                  </g>
                );
              })}

              {/* Center Seal Crest */}
              <circle
                cx={centerX}
                cy={centerY}
                r={innerRadius - 2}
                fill="url(#centerSeal)"
                stroke="#d4af37"
                strokeWidth="2.5"
                className="drop-shadow-[0_0_12px_rgba(212,175,55,0.7)]"
              />
              <text
                x={centerX}
                y={centerY - 6}
                fill="#fef3c7"
                fontSize="8"
                fontFamily="Cinzel, serif"
                fontWeight="bold"
                textAnchor="middle"
                className="select-none tracking-widest uppercase"
              >
                VÄRILÄ
              </text>
              <text
                x={centerX}
                y={centerY + 9}
                fill="#fbbf24"
                fontSize="13"
                fontFamily="Cinzel, serif"
                fontWeight="bold"
                textAnchor="middle"
                className="select-none font-extrabold"
              >
                1888
              </text>
              <text
                x={centerX}
                y={centerY + 21}
                fill="#e8d5b5"
                fontSize="7"
                fontFamily="Cinzel, serif"
                textAnchor="middle"
                className="select-none italic"
              >
                {solvedCount}/{totalNodes}
              </text>
            </svg>

            {/* Glowing Pulsing Ring if 100% complete */}
            {isFullyCompleted && (
              <div className="absolute inset-0 rounded-full border-4 border-yellow-400 animate-ping opacity-75 pointer-events-none" />
            )}
          </div>

          <div className="mt-2 text-center">
            <span className="text-[11px] font-cinzel font-bold text-[#fbbf24] tracking-wider uppercase block">
              VÄRILÄN SINETTI ({solvedCount}/{totalNodes} OSASSA)
            </span>
            <span className="text-[10px] text-[#ab8a5f] font-serif italic">
              Klikkaa sinetin lohkoja tutkiaksesi sukuhaaran osuutta
            </span>
          </div>
        </div>

        {/* Informational & Reward Overview */}
        <div className="flex-1 space-y-3 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-[#fbbf24]" />
              <h3 className="font-cinzel text-base sm:text-lg font-bold text-[#fef3c7] tracking-wide uppercase">
                Suvun Sinettikuvan Kokoaminen
              </h3>
            </div>
            <span className="px-3 py-1 bg-[#2e190d] border border-[#d4af37] rounded-full text-xs font-cinzel font-bold text-[#fbbf24]">
              {percentage}% KOOTTU
            </span>
          </div>

          {/* Progress Bar with Antique Brass Fill */}
          <div className="w-full bg-[#170e08] h-3.5 rounded-full overflow-hidden border border-[#5c3e21] p-0.5 relative">
            <div
              className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-[#92400e] via-[#d97706] to-[#fde047] shadow-[0_0_12px_rgba(251,191,36,0.6)]"
              style={{ width: `${Math.max(percentage, 5)}%` }}
            />
          </div>

          <p className="text-xs text-[#e4cdad] font-serif leading-relaxed">
            Kappalaisen ja sukuhaarojen 1888 jättämä sinetti koostuu <strong>11 erillisestä avainlohkosta</strong>. Jokainen ratkaistu mysteeri valaisee yhden osan sinetistä ja tuo suvun askeleen lähemmäs Värilän kirstun lopullista murtumista.
          </p>

          {/* Selected Slice Details or Summary */}
          {selectedSlice !== null ? (
            <div className="p-3 bg-[#1c1209] border border-[#d4af37] rounded-xl flex items-center justify-between gap-3 text-xs animate-fadeIn">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{sliceMeta[selectedSlice].icon}</span>
                <div>
                  <div className="font-cinzel font-bold text-[#fbbf24]">
                    Lohko {sliceMeta[selectedSlice].roman} ({nodes[selectedSlice]?.node_key || sliceMeta[selectedSlice].nodeKey}):{' '}
                    {nodes[selectedSlice]?.title || sliceMeta[selectedSlice].label}
                  </div>
                  <div className="text-[11px] text-[#c4a478]">
                    {isSliceSolved(selectedSlice) ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Purettu ja sinetöity suvun arkistoon!
                      </span>
                    ) : (
                      <span className="text-amber-300/80 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" /> Lukittu. Vaatii tehtävän {nodes[selectedSlice]?.node_key || sliceMeta[selectedSlice].nodeKey} ratkaisun.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {nodes[selectedSlice] && onSelectNode && (
                <button
                  onClick={() => onSelectNode(nodes[selectedSlice].node_key)}
                  className="bg-[#2e190d] hover:bg-[#3d2313] text-[#fbbf24] border border-[#8b5a2b] px-3 py-1.5 rounded-lg text-xs font-cinzel font-bold transition shrink-0"
                >
                  AVAA RASTI →
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-cinzel">
              <div className="p-2 bg-[#170e08] border border-[#422915] rounded-lg text-center">
                <span className="text-[#a88456] block text-[10px]">LÖYDETYT</span>
                <span className="text-emerald-400 font-bold text-sm">{solvedCount} / 11</span>
              </div>
              <div className="p-2 bg-[#170e08] border border-[#422915] rounded-lg text-center">
                <span className="text-[#a88456] block text-[10px]">JÄLJELLÄ</span>
                <span className="text-amber-400 font-bold text-sm">{totalNodes - solvedCount}</span>
              </div>
              <div className="p-2 bg-[#170e08] border border-[#422915] rounded-lg text-center">
                <span className="text-[#a88456] block text-[10px]">KOKONAISBONUS</span>
                <span className="text-[#fbbf24] font-bold text-sm">+{solvedCount * 100}p</span>
              </div>
              <div className="p-2 bg-[#170e08] border border-[#422915] rounded-lg text-center">
                <span className="text-[#a88456] block text-[10px]">FINAALI</span>
                <span className="text-[#e8d5b5] font-bold text-sm">NUORAMOINEN</span>
              </div>
            </div>
          )}

          {isFullyCompleted && (
            <div className="p-3 bg-gradient-to-r from-[#3f1f06] via-[#78350f] to-[#3f1f06] border-2 border-[#fbbf24] rounded-xl text-center shadow-[0_0_25px_rgba(251,191,36,0.5)]">
              <span className="text-sm font-cinzel font-bold text-[#fef08a] uppercase flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-300 animate-spin" />
                VÄRILÄN SUURI SINETTI 1888 ON TÄYDELLISESTI MURTETTU!
              </span>
              <p className="text-xs text-[#fef3c7] mt-1 font-serif">
                Kaikki 11 mysteeriä purettu. Kirstun pääsalpa on vapaa avattavaksi sukujuhlassa.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
