'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Maximize2,
  Minimize2,
  RotateCw,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Layers,
  Wrench,
  CheckCircle2,
  Compass,
  FileText,
  Lock,
  Unlock,
  HelpCircle,
  Sparkles,
  Info,
  Send,
} from 'lucide-react';
import { soundFX } from '@/lib/audio';
import confetti from 'canvas-confetti';

interface Props {
  onSuccessCode?: (code: string) => void;
  standalone?: boolean;
}

export const ArmoredLockCadPuzzle: React.FC<Props> = ({
  onSuccessCode,
  standalone = false,
}) => {
  // CAD canvas transform state
  const [zoom, setZoom] = useState(1.0);
  const [rotation, setRotation] = useState(0); // 0 to 360 deg
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Layers toggles
  const [showGears, setShowGears] = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);
  const [showStress, setShowStress] = useState(false);
  const [showCrossSection, setShowCrossSection] = useState(true);

  // Puzzle interactive inputs
  const [userGearRatio, setUserGearRatio] = useState<string>('');
  const [torqueInput, setTorqueInput] = useState<number>(250);
  const [textCodeInput, setTextCodeInput] = useState<string>('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [boltProgress, setBoltProgress] = useState(0); // 0 = locked (bolts out), 1 = unlocked (bolts in)
  const [showHint, setShowHint] = useState(false);
  const [animatingUnlock, setAnimatingUnlock] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Technical parameters
  const Z1 = 18; // Drive gear
  const Z2 = 54; // Idler gear
  const Z3 = 12; // Pinion gear
  const correctGearRatio = Z2 / Z1; // 3.0
  const primaryTorque = 127.33; // Nm at primary shaft Z1
  const targetTorque = 382; // Nm (382NM) at main shaft Z2 (127.33 * 3.0 = 382)

  // Parse user's gear ratio input (supports both "." and ",")
  const parsedGearRatio = parseFloat(userGearRatio.trim().replace(',', '.'));
  const isGearRatioCorrect = !isNaN(parsedGearRatio) && Math.abs(parsedGearRatio - correctGearRatio) < 0.05;

  // Effective torque based on user's gear ratio (if entered) compared to wrench setting
  const calculatedMainShaftTorque = !isNaN(parsedGearRatio) && parsedGearRatio > 0
    ? Math.round(primaryTorque * parsedGearRatio)
    : null;

  // Handle Drag / Pan on blueprint canvas
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    soundFX.playKeyClick();
    setZoom(1.0);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  // Check calculation & torque
  const handleApplyTorque = () => {
    soundFX.playKeyClick();
    setErrorMsg(null);

    if (!isGearRatioCorrect) {
      soundFX.playFailure();
      setErrorMsg(
        'Vaihe 1 puuttuu tai on virheellinen! Määritä ensin hammasrattaiston oikea välityssuhde i = Z₂ / Z₁ (54 / 18), jotta momentti välittyy pääakselille oikein.'
      );
      return;
    }

    const isTorqueAccurate = Math.abs(torqueInput - targetTorque) <= 2;
    const isTextAccurate =
      textCodeInput.trim().toUpperCase().replace(/\s+/g, '') === '382NM' ||
      textCodeInput.trim() === '382';

    if (isTorqueAccurate || isTextAccurate) {
      triggerUnlock();
    } else {
      soundFX.playFailure();
      setErrorMsg(
        `Vääntömomentti (${torqueInput} Nm) ei täsmää lukkomekanismin murtorajaan! Kun välityssuhde on i = 3.0 ja ensiömomentti M₁ = 127.33 Nm, säädä pääakselin murtomomentiksi M₂ = i × M₁.`
      );
    }
  };

  const triggerUnlock = () => {
    soundFX.playSuccess();
    setAnimatingUnlock(true);

    // Animate bolts retracting
    let step = 0;
    const interval = setInterval(() => {
      step += 0.05;
      if (step >= 1) {
        clearInterval(interval);
        setBoltProgress(1);
        setIsUnlocked(true);
        setAnimatingUnlock(false);
        soundFX.playNFCSuccess();
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#d4af37', '#f59e0b', '#3b82f6', '#ffffff'],
        });
        if (onSuccessCode) {
          onSuccessCode('382NM');
        }
      } else {
        setBoltProgress(step);
      }
    }, 30);
  };

  return (
    <div className="parchment-card rounded-2xl p-4 sm:p-6 border-2 border-[#5c3e21] shadow-2xl font-serif text-[#e8d5b5]">
      {/* Title Header */}
      <div className="flex items-center justify-between border-b-2 border-[#5c3e21] pb-3 mb-4">
        <div className="flex items-center gap-2.5 text-[#fbbf24]">
          <Compass className="w-6 h-6 text-[#d4af37] animate-spin" style={{ animationDuration: '20s' }} />
          <div>
            <h2 className="text-base sm:text-lg font-bold font-cinzel tracking-wider text-lantern uppercase">
              3-Pulttisen Panssarilukon Leikkauskuva
            </h2>
            <p className="text-xs text-[#ab8a5f] font-serif italic">
              Mekaanisen panssarilukon tekninen erikoistehtävä // Värilä 1888
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            soundFX.playKeyClick();
            setShowHint(!showHint);
          }}
          className="btn-brass px-3 py-1.5 rounded-lg text-xs font-cinzel font-bold flex items-center gap-1.5 shadow-md"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{showHint ? 'Sulje vihje' : 'Lujuusopin vihje'}</span>
        </button>
      </div>

      {showHint && (
        <div className="bg-[#24170d] border border-[#d4af37] p-4 rounded-xl mb-4 text-xs font-serif leading-relaxed text-[#fef3c7] shadow-inner animate-fadeIn">
          <h4 className="font-bold text-[#fbbf24] font-cinzel text-sm mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#d4af37]" />
            <span>KONEENRAKENNUKSEN LASKENTAMALLI (Insinöörille):</span>
          </h4>
          <p className="mb-2">
            1. <strong>Kokonaisvälityssuhde:</strong> Ensiörattaalta Z₁ = 18 välirattaalle Z₂ = 54 saadaan välityssuhde i = Z₂ / Z₁ = 54 / 18 = <strong>3.0</strong>.
          </p>
          <p className="mb-2">
            2. <strong>Pääakselin murtomomentti:</strong> Kun ensiörattaan momentti M₁ = 127.33 Nm kerrotaan välityssuhteella i = 3.0 (tai lasketaan akselin d = 20 mm ja τ_max = 486.4 MPa kautta), saadaan pääakselin murtorajaksi M₂ = 3.0 × 127.33 Nm = <strong>382 Nm</strong> (382NM).
          </p>
          <p className="italic text-[#d4af37]">
            Syötä ensin välityssuhde <strong>3</strong> (tai 3.0) ja säädä sitten momenttiavain arvoon <strong>382 Nm</strong> (tai syötä <strong>382NM</strong>), jolloin kirstun kolme teräspulttia vetäytyvät sisään!
          </p>
        </div>
      )}

      {/* Main CAD Blueprint Screen */}
      <div className="relative w-full rounded-2xl overflow-hidden border-2 border-[#5c3e21] bg-[#0b141a] shadow-[inset_0_0_40px_rgba(0,0,0,0.9)] mb-4">
        {/* CAD Toolbar (Clean header bar so it never overlaps drawing on mobile) */}
        <div className="bg-[#0e1e27] border-b border-[#2b4c60] p-2 flex flex-wrap items-center justify-between gap-2">
          <div className="text-[#7ec8e3] px-2 py-0.5 text-[11px] font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-ping shrink-0" />
            <span className="font-bold truncate">CAD 1888 // PANSSARI-LUKKO-3B</span>
          </div>

          {/* Zoom & Rotate Controls */}
          <div className="flex items-center gap-1 bg-[#08131a] border border-[#2b4c60] p-1 rounded-lg">
            <button
              type="button"
              onClick={() => {
                soundFX.playKeyClick();
                setZoom((z) => Math.min(2.5, z + 0.2));
              }}
              className="p-1.5 hover:bg-[#1a3342] text-[#7ec8e3] rounded touch-manipulation"
              title="Lähennä (Zoom in)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                soundFX.playKeyClick();
                setZoom((z) => Math.max(0.6, z - 0.2));
              }}
              className="p-1.5 hover:bg-[#1a3342] text-[#7ec8e3] rounded touch-manipulation"
              title="Loitonna (Zoom out)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                soundFX.playKeyClick();
                setRotation((r) => (r - 15 + 360) % 360);
              }}
              className="p-1.5 hover:bg-[#1a3342] text-[#7ec8e3] rounded touch-manipulation"
              title="Kierrä vastapäivään"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                soundFX.playKeyClick();
                setRotation((r) => (r + 15) % 360);
              }}
              className="p-1.5 hover:bg-[#1a3342] text-[#7ec8e3] rounded touch-manipulation"
              title="Kierrä myötäpäivään"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={resetView}
              className="p-1.5 hover:bg-[#1a3342] text-[#7ec8e3] rounded text-xs font-mono font-bold touch-manipulation"
              title="Palauta oletusnäkymä"
            >
              1:1
            </button>
          </div>
        </div>

        {/* Blueprint Canvas SVG Area */}
        <div
          className="w-full h-[260px] sm:h-[380px] cursor-grab active:cursor-grabbing flex items-center justify-center select-none overflow-hidden"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <svg
            viewBox="0 0 600 450"
            className="w-full h-full transition-transform duration-75 ease-out"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
            }}
          >
            {/* Engineering Grid & Technical Background */}
            <defs>
              <pattern id="cadGridSmall" width="15" height="15" patternUnits="userSpaceOnUse">
                <path d="M 15 0 L 0 0 0 15" fill="none" stroke="#162936" strokeWidth="0.5" />
              </pattern>
              <pattern id="cadGridLarge" width="60" height="60" patternUnits="userSpaceOnUse">
                <rect width="60" height="60" fill="url(#cadGridSmall)" />
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#1e3a4d" strokeWidth="1" />
              </pattern>
              {/* Radial gradient for steel mechanism */}
              <radialGradient id="steelPlate" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#2c3e4a" />
                <stop offset="100%" stopColor="#121e26" />
              </radialGradient>
              <radialGradient id="brassGear" cx="40%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="70%" stopColor="#b45309" />
                <stop offset="100%" stopColor="#78350f" />
              </radialGradient>
              <radialGradient id="cyanGear" cx="40%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0369a1" />
              </radialGradient>
            </defs>

            {/* Grid */}
            <rect width="600" height="450" fill="#081016" />
            <rect width="600" height="450" fill="url(#cadGridLarge)" />

            {/* Main Outer Armored Latch Housing Plate */}
            <rect
              x="90"
              y="55"
              width="420"
              height="340"
              rx="12"
              fill="url(#steelPlate)"
              stroke="#38bdf8"
              strokeWidth="2"
            />
            {/* Rivets around armor plate */}
            {[
              [110, 75], [300, 75], [490, 75],
              [110, 225], [490, 225],
              [110, 375], [300, 375], [490, 375],
            ].map(([rx, ry], idx) => (
              <circle key={idx} cx={rx} cy={ry} r="5" fill="#182a35" stroke="#7ec8e3" strokeWidth="1.5" />
            ))}

            {/* 3 HEAVY STEEL LOCKING DEADBOLTS (Slide dynamically with boltProgress) */}
            {/* Bolt offset: locked = 0px, unlocked = -45px retraction */}
            {/* Top Bolt */}
            <g transform={`translate(${-boltProgress * 45}, 0)`}>
              <rect
                x="470"
                y="100"
                width="85"
                height="32"
                fill="#475569"
                stroke={isUnlocked ? '#4ade80' : '#ef4444'}
                strokeWidth="2"
                rx="4"
              />
              <line x1="480" y1="105" x2="480" y2="127" stroke="#94a3b8" strokeWidth="2" strokeDasharray="3 3" />
              <line x1="500" y1="105" x2="500" y2="127" stroke="#94a3b8" strokeWidth="2" strokeDasharray="3 3" />
              <text x="515" y="120" fill="#f8fafc" fontSize="9" fontFamily="monospace" fontWeight="bold">
                PULTTI 1
              </text>
            </g>

            {/* Center Main Bolt */}
            <g transform={`translate(${-boltProgress * 55}, 0)`}>
              <rect
                x="470"
                y="205"
                width="100"
                height="40"
                fill="#334155"
                stroke={isUnlocked ? '#4ade80' : '#ef4444'}
                strokeWidth="2.5"
                rx="4"
              />
              <line x1="485" y1="210" x2="485" y2="240" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 3" />
              <line x1="510" y1="210" x2="510" y2="240" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 3" />
              <text x="520" y="229" fill="#f8fafc" fontSize="10" fontFamily="monospace" fontWeight="bold">
                PÄÄPULTTI 2
              </text>
            </g>

            {/* Bottom Bolt */}
            <g transform={`translate(${-boltProgress * 45}, 0)`}>
              <rect
                x="470"
                y="315"
                width="85"
                height="32"
                fill="#475569"
                stroke={isUnlocked ? '#4ade80' : '#ef4444'}
                strokeWidth="2"
                rx="4"
              />
              <line x1="480" y1="320" x2="480" y2="342" stroke="#94a3b8" strokeWidth="2" strokeDasharray="3 3" />
              <line x1="500" y1="320" x2="500" y2="342" stroke="#94a3b8" strokeWidth="2" strokeDasharray="3 3" />
              <text x="515" y="335" fill="#f8fafc" fontSize="9" fontFamily="monospace" fontWeight="bold">
                PULTTI 3
              </text>
            </g>

            {/* Connecting Cam Rods & Levers */}
            <path
              d="M 280 225 L 480 116 M 280 225 L 480 225 M 280 225 L 480 331"
              stroke="#64748b"
              strokeWidth="4"
              strokeLinecap="round"
            />

            {/* GEAR TRAIN (If layer enabled) */}
            {showGears && (
              <g id="gearTrain">
                {/* Large Idler Gear Z2 = 54 */}
                <g transform="translate(280, 225)">
                  <circle r="75" fill="url(#brassGear)" stroke="#fbbf24" strokeWidth="2" />
                  {/* Gear teeth */}
                  {Array.from({ length: 18 }).map((_, i) => (
                    <rect
                      key={i}
                      x="-6"
                      y="-82"
                      width="12"
                      height="14"
                      fill="#d97706"
                      stroke="#fbbf24"
                      strokeWidth="1"
                      transform={`rotate(${i * 20 + rotation})`}
                    />
                  ))}
                  <circle r="25" fill="#182a35" stroke="#fbbf24" strokeWidth="2" />
                  <text x="0" y="4" fill="#fef3c7" fontSize="11" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    Z₂ = 54
                  </text>
                </g>

                {/* Drive Input Gear Z1 = 18 */}
                <g transform="translate(165, 175)">
                  <circle r="36" fill="url(#cyanGear)" stroke="#38bdf8" strokeWidth="2" />
                  {Array.from({ length: 9 }).map((_, i) => (
                    <rect
                      key={i}
                      x="-4"
                      y="-42"
                      width="8"
                      height="10"
                      fill="#0284c7"
                      stroke="#38bdf8"
                      strokeWidth="1"
                      transform={`rotate(${i * 40 - rotation * 3})`}
                    />
                  ))}
                  <circle r="12" fill="#081016" stroke="#38bdf8" strokeWidth="1.5" />
                  <text x="0" y="3" fill="#ffffff" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    Z₁ = 18
                  </text>
                </g>

                {/* Pinion Gear Z3 = 12 */}
                <g transform="translate(180, 290)">
                  <circle r="28" fill="#b45309" stroke="#f59e0b" strokeWidth="1.5" />
                  {Array.from({ length: 6 }).map((_, i) => (
                    <rect
                      key={i}
                      x="-4"
                      y="-33"
                      width="8"
                      height="8"
                      fill="#78350f"
                      stroke="#f59e0b"
                      strokeWidth="1"
                      transform={`rotate(${i * 60 + rotation * 4.5})`}
                    />
                  ))}
                  <circle r="8" fill="#081016" stroke="#f59e0b" strokeWidth="1" />
                  <text x="0" y="3" fill="#ffffff" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    Z₃ = 12
                  </text>
                </g>

                {/* Center Threaded Lead Screw Shaft */}
                <g transform="translate(280, 225)">
                  <rect x="-10" y="-12" width="20" height="24" fill="#94a3b8" stroke="#38bdf8" strokeWidth="1.5" />
                  {/* Screw thread pattern */}
                  <line x1="-10" y1="-6" x2="10" y2="-2" stroke="#1e293b" strokeWidth="2" />
                  <line x1="-10" y1="2" x2="10" y2="6" stroke="#1e293b" strokeWidth="2" />
                </g>
              </g>
            )}

            {/* TECHNICAL DIMENSIONS & ANNOTATIONS LAYER */}
            {showDimensions && (
              <g id="dimensionLayer" fontFamily="monospace" fontSize="9" fill="#38bdf8">
                {/* Gear Train Ratio Callout */}
                <line x1="165" y1="130" x2="165" y2="100" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 2" />
                <line x1="165" y1="100" x2="220" y2="100" stroke="#38bdf8" strokeWidth="1" />
                <text x="225" y="103" fill="#7dd3fc" fontWeight="bold">
                  ENSIÖRATAS: Z₁ = 18 h (M₁ = 127.33 Nm)
                </text>

                <line x1="280" y1="140" x2="280" y2="80" stroke="#fbbf24" strokeWidth="1" strokeDasharray="3 2" />
                <line x1="280" y1="80" x2="330" y2="80" stroke="#fbbf24" strokeWidth="1" />
                <text x="335" y="83" fill="#fde047" fontWeight="bold">
                  VÄLIRATAS: Z₂ = 54 h (M₂ = i · M₁)
                </text>

                {/* Shaft Specs Callout */}
                <line x1="280" y1="245" x2="280" y2="380" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 2" />
                <line x1="280" y1="380" x2="340" y2="380" stroke="#38bdf8" strokeWidth="1" />
                <text x="345" y="383" fill="#7dd3fc">
                  PÄÄAKSELI: ⌀ 20 mm // P = 4.5 mm
                </text>

                {/* Material Spec */}
                <text x="110" y="380" fill="#94a3b8" fontSize="8">
                  MATERIAALI: KARKAISTU HIILITERÄS 1888
                </text>
                <text x="110" y="392" fill="#94a3b8" fontSize="8">
                  LEIKKAUSLUJUUS τ_max = 486.4 MPa
                </text>
              </g>
            )}

            {/* Lock Status overlay */}
            <g transform="translate(300, 30)">
              <rect x="-85" y="-15" width="170" height="26" rx="6" fill="#081016" stroke={isUnlocked ? '#22c55e' : '#ef4444'} strokeWidth="1.5" />
              <text x="0" y="2" fill={isUnlocked ? '#4ade80' : '#f87171'} fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                {isUnlocked ? 'SALPA AVATTU (382 NM) ✓' : 'LUKITUSTILA: 3 PULTTIA KIINNI'}
              </text>
            </g>
          </svg>
        </div>

        {/* Layer Toggles bar (Bottom overlay) */}
        <div className="bg-[#0b161f] border-t border-[#1d3545] p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[#7ec8e3]">
          <div className="flex items-center gap-3">
            <span className="text-[#38bdf8] font-bold flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              <span>TASOT:</span>
            </span>
            <label className="flex items-center gap-1 cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={showGears}
                onChange={(e) => setShowGears(e.target.checked)}
                className="accent-[#38bdf8]"
              />
              <span>Rattaat</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={showDimensions}
                onChange={(e) => setShowDimensions(e.target.checked)}
                className="accent-[#38bdf8]"
              />
              <span>Mitat & Kaavat</span>
            </label>
          </div>

          <div className="text-[11px] text-[#94a3b8] italic hidden sm:block">
            * Voit raahata ja zoomata leikkauskuvaa hiirellä tai painikkeilla.
          </div>
        </div>

        {/* Clear mobile-readable Blueprint Spec Strip */}
        <div className="bg-[#081118] border-t border-[#1d3545] p-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
          <div className="bg-[#0e1e27] p-2 rounded border border-[#2b4c60]">
            <span className="text-[10px] text-[#7ec8e3] block">ENSIÖRATAS (Z₁):</span>
            <strong className="text-white">Z₁ = 18 hammasta</strong>
            <span className="text-[10px] text-[#38bdf8] block">M₁ = 127.33 Nm</span>
          </div>
          <div className="bg-[#0e1e27] p-2 rounded border border-[#2b4c60]">
            <span className="text-[10px] text-[#fde047] block">VÄLIRATAS (Z₂):</span>
            <strong className="text-[#fef08a]">Z₂ = 54 hammasta</strong>
            <span className="text-[10px] text-[#fde047] block">i = Z₂ / Z₁</span>
          </div>
          <div className="bg-[#0e1e27] p-2 rounded border border-[#2b4c60] col-span-2 sm:col-span-1">
            <span className="text-[10px] text-[#86efac] block">PÄÄAKSELIN MOMENTTI:</span>
            <strong className="text-[#4ade80]">M₂ = i × M₁</strong>
            <span className="text-[10px] text-[#94a3b8] block">Pyöristä kokonaisluvuksi (Nm)</span>
          </div>
        </div>
      </div>

      {/* Engineering Calculation Workbench */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Step 1: Gear Train Ratio Check */}
        <div className="bg-[#18110a] p-4 rounded-xl border border-[#4a3219]">
          <div className="flex items-center gap-2 text-[#fbbf24] font-cinzel font-bold text-xs mb-2">
            <Wrench className="w-4 h-4 text-[#d4af37]" />
            <span>1. VÄLITYSSUHTEEN MÄÄRITYS (Z₁=18, Z₂=54)</span>
          </div>
          <p className="text-xs text-[#e4cdad] mb-2 font-serif">
            Laske hammasrattaiston kokonaisvälityssuhde i = Z₂ / Z₁, jolla ensiömomentti (M₁ = 127.33 Nm) kerrotaan:
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-[#a88456] font-mono">i = 54 / 18 =</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="Syötä i..."
              value={userGearRatio}
              onChange={(e) => setUserGearRatio(e.target.value)}
              className="w-24 bg-[#0d0905] border border-[#5c3e21] text-[#fbbf24] p-2 rounded font-mono text-center text-sm focus:outline-none focus:border-[#d4af37]"
            />
            {isGearRatioCorrect ? (
              <span className="text-xs text-[#4ade80] font-bold">✓ Oikein (i = 3.0)</span>
            ) : userGearRatio.trim() !== '' ? (
              <span className="text-xs text-[#f87171] font-bold">✗ Tarkista suhde</span>
            ) : null}
          </div>
          <div className="mt-2.5 pt-2 border-t border-[#4a3219]/60 text-[11px] font-mono text-[#a88456]">
            {calculatedMainShaftTorque !== null ? (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  M₂ = {parsedGearRatio} × 127.33 Nm ={' '}
                  <strong className={isGearRatioCorrect ? 'text-[#4ade80] text-sm' : 'text-[#fbbf24]'}>
                    {calculatedMainShaftTorque} Nm
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playKeyClick();
                    setTorqueInput(calculatedMainShaftTorque);
                    setTextCodeInput(`${calculatedMainShaftTorque}NM`);
                  }}
                  className="bg-[#2a1c0e] hover:bg-[#3b2814] text-[#fbbf24] border border-[#d4af37] px-2.5 py-1 rounded text-[11px] font-bold touch-manipulation"
                >
                  Aseta avaimeen →
                </button>
              </div>
            ) : (
              <span>Syötä välityssuhde i laskeaksesi pääakselin momentin M₂ = i × M₁</span>
            )}
          </div>
        </div>

        {/* Step 2: Torque Wrench Tuning */}
        <div className={`bg-[#18110a] p-4 rounded-xl border transition-opacity ${isGearRatioCorrect ? 'border-[#d4af37]' : 'border-[#4a3219] opacity-80'}`}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-[#d4af37] font-cinzel font-bold">
              2. SÄÄDÄ VÄÄNTÖMOMENTTI (Nm):
            </span>
            <span className="text-base font-bold font-typewriter text-[#fbbf24] bg-[#0d0905] px-2.5 py-0.5 rounded border border-[#5c3e21]">
              {torqueInput} Nm
            </span>
          </div>
          <p className="text-[11px] text-[#ab8a5f] font-serif mb-2">
            Säädä momenttiavain liukusäätimellä tai pikapainikkeilla:
          </p>
          <input
            type="range"
            min={100}
            max={600}
            step={1}
            value={torqueInput}
            onChange={(e) => {
              soundFX.playKeyClick();
              setTorqueInput(Number(e.target.value));
            }}
            className="w-full accent-[#d4af37] cursor-pointer mb-2"
          />
          <div className="flex items-center justify-between gap-1.5">
            {[-10, -1, 1, 10].map((delta) => (
              <button
                key={delta}
                type="button"
                onClick={() => {
                  soundFX.playKeyClick();
                  setTorqueInput((prev) => Math.max(100, Math.min(600, prev + delta)));
                }}
                className="flex-1 bg-[#24170d] hover:bg-[#362213] text-[#fef3c7] border border-[#5c3e21] py-1.5 rounded text-xs font-mono font-bold touch-manipulation"
              >
                {delta > 0 ? `+${delta}` : delta} Nm
              </button>
            ))}
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 mb-4 bg-red-950/80 border border-red-500/60 rounded-xl text-xs text-red-200">
          {errorMsg}
        </div>
      )}

      {/* Code Entry & Apply Button */}
      <div className="bg-[#1e130a] p-4 rounded-xl border border-[#5c3e21] flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shadow-inner">
        <div className="flex-1">
          <label className="text-xs text-[#d4af37] font-cinzel block mb-1 font-bold">
            TAI SYÖTÄ LASKETTU MURTOMOMENTTI SUORAAN:
          </label>
          <input
            type="text"
            placeholder="Syötä momentti (esim. 250NM)"
            value={textCodeInput}
            onChange={(e) => setTextCodeInput(e.target.value)}
            className="w-full bg-[#0d0905] border border-[#5c3e21] text-[#fbbf24] p-2.5 rounded-lg font-typewriter uppercase text-xs focus:outline-none focus:border-[#d4af37]"
          />
        </div>

        <button
          onClick={handleApplyTorque}
          disabled={animatingUnlock}
          className="btn-brass font-extrabold px-6 py-3 rounded-xl font-cinzel text-xs sm:text-sm flex items-center justify-center gap-2 uppercase tracking-wider shadow-2xl transition disabled:opacity-50 shrink-0"
        >
          {isUnlocked ? <Unlock className="w-4 h-4 text-[#4ade80]" /> : <Lock className="w-4 h-4" />}
          <span>{isUnlocked ? 'SALPA AVATTU ✓' : 'VAPAUTA 3-PULTTINEN SALPA'}</span>
        </button>
      </div>

      {/* Unlocked Confirmation Card */}
      {isUnlocked && (
        <div className="mt-5 p-5 bg-[#142314] border-2 border-[#25e24c] rounded-xl text-xs font-serif text-[#fef3c7] animate-fadeIn shadow-2xl">
          <div className="flex items-center gap-2 text-[#4ade80] font-bold font-cinzel text-sm mb-2">
            <CheckCircle2 className="w-5 h-5 text-[#25e24c]" />
            <span>PANSSARILUKON MEKANISMI LAUKESI! (382 NM)</span>
          </div>
          <p className="text-sm leading-relaxed mb-3">
            Insinöörin tarkat lujuus- ja välityslaskelmat pitivät paikkansa! Kolme karkaistua teräspulttia 
            vetäytyivät sisään ja kirstun ulompi mekaaninen panssarisalpa on nyt purettu.
          </p>
          <div className="p-3 bg-[#0a140a] rounded border border-[#25e24c]/40 font-typewriter text-xs text-[#fbbf24]">
            Hyväksytty purkukoodi: <strong className="text-base text-white">382NM</strong>
          </div>
        </div>
      )}
    </div>
  );
};
