'use client';

import React, { useState } from 'react';
import {
  Compass,
  MapPin,
  BookOpen,
  Anchor,
  Trophy,
  Footprints,
  CheckCircle2,
  Calculator,
  AlertTriangle,
  Sparkles,
  Flame,
  Home,
} from 'lucide-react';
import { soundFX } from '@/lib/audio';

interface PuzzleProps {
  onSuccessCode?: (code: string) => void;
}

/**
 * NODE-04: Pioneerikoordinaatit (PIONEERI-460)
 */
export const PioneeriPuzzle: React.FC<PuzzleProps> = ({ onSuccessCode }) => {
  const [bearingInput, setBearingInput] = useState('');
  const [distanceInput, setDistanceInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);

  // Laskenta:
  // Suuntapiiru: Lähtösuunta 180 piirua - magneettinen eranto 45 piirua = 135 piirua
  // Kokonaismatka: Tie 410 (280 m) + Tainionvirran ylitys (125 m) + Kalliolinnoitus (55 m) = 460 m
  const bearingVal = parseFloat(bearingInput.trim().replace(',', '.'));
  const distVal = parseFloat(distanceInput.trim().replace(',', '.'));

  const isBearingOk = !isNaN(bearingVal) && Math.abs(bearingVal - 135) < 0.1;
  const isDistOk = !isNaN(distVal) && Math.abs(distVal - 460) < 0.1;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    soundFX.playKeyClick();

    if (!isBearingOk) {
      soundFX.playFailure();
      setErrorMsg('Vaihe 1 (Suuntapiiru) on väärin! Vähennä magneettinen korjaus (45 piirua) perussuunnasta (180 piirua).');
      return;
    }
    if (!isDistOk) {
      soundFX.playFailure();
      setErrorMsg('Vaihe 2 (Kokonaismatka) on väärin! Laske yhteen kaikkien kolmen mittausetapin metrit (280 + 125 + 55).');
      return;
    }

    setSolved(true);
    soundFX.playSuccess();
    if (onSuccessCode) onSuccessCode('PIONEERI-460');
  };

  return (
    <div className="parchment-card rounded-2xl border-2 border-[#8b5a2b] p-4 sm:p-5 shadow-2xl space-y-4 font-serif">
      <div className="flex items-center justify-between border-b border-[#5c3e21] pb-3">
        <div className="flex items-center gap-2 text-[#fbbf24]">
          <Compass className="w-5 h-5 text-[#d4af37]" />
          <div>
            <h3 className="font-cinzel font-bold text-sm sm:text-base text-[#fef3c7] uppercase">
              NODE-04 // Pioneerikartasto & Tuliasemien Mittaus
            </h3>
            <span className="text-[11px] text-[#a88456] block">
              Topografinen kenttämittaus • Sysmä – Tie 410 – Nuoramoinen
            </span>
          </div>
        </div>
        <div className="text-xs bg-[#24170d] border border-[#d4af37]/60 text-[#fbbf24] px-3 py-1 rounded-lg font-typewriter">
          KARTTALEHTI 410
        </div>
      </div>

      {/* Tactical Field Map SVG */}
      <div className="paper-document p-4 rounded-xl border-2 border-[#5c3e21] text-[#2b1d0c] space-y-3">
        <div className="flex justify-between items-center text-[10px] font-typewriter border-b border-[#a88456] pb-1">
          <span>PIONEERIMITTAUSPÖYTÄKIRJA // 1888</span>
          <span>SEKTORI: SYSMÄ–NUORAMOINEN</span>
        </div>

        <svg viewBox="0 0 420 150" className="w-full h-36 bg-[#e9d8b8] rounded-lg border border-[#a88456]">
          <defs>
            <pattern id="mapGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#c7b087" strokeWidth="0.6" />
            </pattern>
          </defs>
          <rect width="420" height="150" fill="url(#mapGrid)" />

          {/* Route path */}
          <polyline
            points="50,115 175,65 300,85 375,35"
            fill="none"
            stroke="#991b1b"
            strokeWidth="2.5"
            strokeDasharray="5 3"
          />

          {/* Point A */}
          <circle cx="50" cy="115" r="5" fill="#1e293b" />
          <text x="20" y="135" fontSize="9" fontFamily="monospace" fill="#1e293b" fontWeight="bold">
            A: TIE 410 (0 m)
          </text>

          {/* Leg 1 label */}
          <text x="85" y="80" fontSize="9" fontFamily="monospace" fill="#991b1b" fontWeight="bold">
            Etappi 1: 280 m
          </text>

          {/* Point B */}
          <circle cx="175" cy="65" r="5" fill="#1e293b" />
          <text x="140" y="50" fontSize="9" fontFamily="monospace" fill="#1e293b" fontWeight="bold">
            B: VIRRAN YLITYS
          </text>

          {/* Leg 2 label */}
          <text x="205" y="95" fontSize="9" fontFamily="monospace" fill="#991b1b" fontWeight="bold">
            Etappi 2: +125 m
          </text>

          {/* Point C */}
          <circle cx="300" cy="85" r="5" fill="#1e293b" />
          <text x="285" y="108" fontSize="9" fontFamily="monospace" fill="#1e293b" fontWeight="bold">
            C: SILLANPÄÄ
          </text>

          {/* Leg 3 label */}
          <text x="305" y="52" fontSize="9" fontFamily="monospace" fill="#991b1b" fontWeight="bold">
            Etappi 3: +55 m
          </text>

          {/* Target Point D */}
          <circle cx="375" cy="35" r="6" fill="#991b1b" stroke="#fbbf24" strokeWidth="1.5" />
          <text x="320" y="20" fontSize="9" fontFamily="monospace" fill="#7f1d1d" fontWeight="bold">
            KOHDE: KALLIOKÄTKÖ
          </text>
        </svg>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-typewriter bg-[#e2cca4] p-2.5 rounded border border-[#a88456]">
          <div>
            <strong>Kompassin lähtösuunta:</strong> 180 piirua
            <br />
            <strong>Magneettinen erantokorjaus:</strong> −45 piirua
          </div>
          <div>
            <strong>Etapit (A → D):</strong>
            <br />
            280 m + 125 m + 55 m
          </div>
        </div>
      </div>

      {/* Two-step calculation */}
      <form onSubmit={handleVerify} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-[#18110a] p-3.5 rounded-xl border border-[#4a3219]">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-cinzel font-bold text-[#fbbf24]">
                1. KORJATTU SUUNTAPIIRU:
              </label>
              {isBearingOk && <span className="text-xs text-emerald-400 font-mono font-bold">✓ Oikein</span>}
            </div>
            <p className="text-[11px] text-[#a88456] mb-2">
              Vähennä erantokorjaus (45) lähtösuunnasta (180):
            </p>
            <input
              type="text"
              inputMode="decimal"
              placeholder="Syötä suuntapiiru..."
              value={bearingInput}
              onChange={(e) => setBearingInput(e.target.value)}
              className="w-full bg-[#0d0905] border border-[#5c3e21] text-[#fbbf24] px-3 py-2.5 rounded-lg font-typewriter text-sm focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          <div className="bg-[#18110a] p-3.5 rounded-xl border border-[#4a3219]">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-cinzel font-bold text-[#fbbf24]">
                2. KOKONAISMATKA KOHTEESEEN (m):
              </label>
              {isDistOk && <span className="text-xs text-emerald-400 font-mono font-bold">✓ Oikein</span>}
            </div>
            <p className="text-[11px] text-[#a88456] mb-2">
              Laske kolmen etappimatkan summa (m):
            </p>
            <input
              type="text"
              inputMode="decimal"
              placeholder="Syötä kokonaismatka (m)..."
              value={distanceInput}
              onChange={(e) => setDistanceInput(e.target.value)}
              className="w-full bg-[#0d0905] border border-[#5c3e21] text-[#fbbf24] px-3 py-2.5 rounded-lg font-typewriter text-sm focus:outline-none focus:border-[#d4af37]"
            />
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/80 border border-red-500/60 rounded-xl text-xs text-red-200">
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          className="w-full btn-brass font-bold py-3 px-4 rounded-xl font-cinzel text-xs sm:text-sm flex items-center justify-center gap-2 uppercase shadow-xl"
        >
          <MapPin className="w-4 h-4" />
          <span>Lukitse Pioneerikoordinaatit</span>
        </button>
      </form>

      {solved && (
        <div className="p-3 bg-[#142314] border border-emerald-500 rounded-xl text-xs text-emerald-200 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Koordinaatit lukittu! Purkukoodi: <strong className="font-typewriter text-amber-300">PIONEERI-460</strong>
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * NODE-05: Kappalaisen aikajana & harhat (HARHA-1888)
 */
export const AikajanaHarhatPuzzle: React.FC<PuzzleProps> = ({ onSuccessCode }) => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [yearInput, setYearInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);

  const entries = [
    {
      id: 1,
      date: '12. lokakuuta',
      text: 'Syyssade piiskasi virkatalon ikkunoita. Tarkistin viljamakasiinin lukot ennen iltahuutoa.',
      isHallucination: false,
    },
    {
      id: 2,
      date: '19. lokakuuta (Yö 4 ilman unta)',
      text: 'Kello löi kolmetoista kertaa keskiyöllä ja Nuoramoisten kirkontorni käveli vastavirtaan.',
      isHallucination: true,
    },
    {
      id: 3,
      date: '24. lokakuuta',
      text: 'Kuriiri toi sinetöidyn kirjeen Heinolasta. Talletin avaimen rautakirstun pohjalle.',
      isHallucination: false,
    },
    {
      id: 4,
      date: '32. lokakuuta (Yö 9 ilman unta)',
      text: 'Päijänteen vesi muuttui elohopeaksi ja varjot puhuivat latinaa uunin luukusta.',
      isHallucination: true,
    },
    {
      id: 5,
      date: '29. lokakuuta',
      text: 'Kirstun kolme pulttia on voideltu ja sinetti jaettu yhteentoista osaan.',
      isHallucination: false,
    },
  ];

  const toggleEntry = (id: number) => {
    soundFX.playKeyClick();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Todellisten päivämäärien summa: 12 + 24 + 29 = 65
  const realDaysSum = parseFloat(yearInput.trim());
  const isHallucinationsCorrect =
    selectedIds.length === 2 && selectedIds.includes(2) && selectedIds.includes(4);
  const isSumCorrect = !isNaN(realDaysSum) && realDaysSum === 65;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    soundFX.playKeyClick();

    if (!isHallucinationsCorrect) {
      soundFX.playFailure();
      setErrorMsg('Valitse päiväkirjasta täsmälleen ne kaksi (2) merkintää, jotka ovat unettomuuden aiheuttamia harhoja!');
      return;
    }

    if (!isSumCorrect) {
      soundFX.playFailure();
      setErrorMsg('Todellisten merkintöjen päivämäärien (päivänumeroiden) summa ei täsmää! Laske yhteen kolmen todellisen lokakuun merkinnän päivänumerot.');
      return;
    }

    setSolved(true);
    soundFX.playSuccess();
    if (onSuccessCode) onSuccessCode('HARHA-1888');
  };

  return (
    <div className="parchment-card rounded-2xl border-2 border-[#8b5a2b] p-4 sm:p-5 shadow-2xl space-y-4 font-serif">
      <div className="flex items-center justify-between border-b border-[#5c3e21] pb-3">
        <div className="flex items-center gap-2 text-[#fbbf24]">
          <BookOpen className="w-5 h-5 text-[#d4af37]" />
          <div>
            <h3 className="font-cinzel font-bold text-sm sm:text-base text-[#fef3c7] uppercase">
              NODE-05 // Kappalaisen Aikajana & Harha-analyysi
            </h3>
            <span className="text-[11px] text-[#a88456] block">
              Päiväkirjan todellisuustarkistus • Syksy 1888
            </span>
          </div>
        </div>
      </div>

      <p className="text-xs text-[#e4cdad]">
        1. Klikkaa ja merkitse päiväkirjasta ne <strong>kaksi (2) merkintää</strong>, jotka ovat selvästi unettomuuden aiheuttamia aistiharhoja.
      </p>

      <div className="space-y-2">
        {entries.map((item) => {
          const isSelected = selectedIds.includes(item.id);
          return (
            <button
              type="button"
              key={item.id}
              onClick={() => toggleEntry(item.id)}
              className={`w-full text-left p-3 rounded-xl border transition flex items-start justify-between gap-3 ${
                isSelected
                  ? 'bg-red-950/70 border-red-500 text-red-100'
                  : 'bg-[#18110a] border-[#4a3219] text-[#e4cdad] hover:border-[#8b5a2b]'
              }`}
            >
              <div className="text-xs">
                <span className="font-typewriter font-bold text-[#fbbf24] block mb-0.5">
                  {item.date}
                </span>
                <span className="italic">&quot;{item.text}&quot;</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono shrink-0 border ${
                  isSelected
                    ? 'bg-red-800 text-white border-red-400'
                    : 'bg-[#0d0905] text-[#a88456] border-[#5c3e21]'
                }`}
              >
                {isSelected ? 'HARHA ✕' : 'TODELLINEN'}
              </span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleVerify} className="space-y-3 pt-1">
        <div className="bg-[#18110a] p-3.5 rounded-xl border border-[#4a3219]">
          <label className="text-xs font-cinzel font-bold text-[#fbbf24] block mb-1">
            2. TODELLISTEN MERKINTÖJEN PÄIVÄNUMEROIDEN SUMMA:
          </label>
          <p className="text-[11px] text-[#a88456] mb-2">
            Laske yhteen kolmen todellisen lokakuun merkinnän päivänumerot (esim. 12 + ...):
          </p>
          <input
            type="text"
            inputMode="numeric"
            placeholder="Syötä kolmen todellisen päivänumeron summa..."
            value={yearInput}
            onChange={(e) => setYearInput(e.target.value)}
            className="w-full bg-[#0d0905] border border-[#5c3e21] text-[#fbbf24] px-3 py-2.5 rounded-lg font-typewriter text-sm focus:outline-none focus:border-[#d4af37]"
          />
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/80 border border-red-500/60 rounded-xl text-xs text-red-200">
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          className="w-full btn-brass font-bold py-3 px-4 rounded-xl font-cinzel text-xs sm:text-sm flex items-center justify-center gap-2 uppercase shadow-xl"
        >
          <Calculator className="w-4 h-4" />
          <span>Vahvista Aikajana-analyysi</span>
        </button>
      </form>

      {solved && (
        <div className="p-3 bg-[#142314] border border-emerald-500 rounded-xl text-xs text-emerald-200 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Harhat erotettu todellisista tapahtumista! Purkukoodi: <strong className="font-typewriter text-amber-300">HARHA-1888</strong>
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * NODE-06: Orpopojan traumakartta (LEIVINUUNI-18)
 */
export const OrpopojanTraumakarttaPuzzle: React.FC<PuzzleProps> = ({ onSuccessCode }) => {
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [placeInput, setPlaceInput] = useState('');
  const [roomNumInput, setRoomNumInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);

  const rooms = [
    {
      id: 1,
      code: 'HUONE #11',
      name: 'Kylmä maakellari',
      note: 'Salpa lukittu ulkopuolelta, hiiret rapisevat pimeässä.',
      stressLevel: 'Pelkotaso: 90%',
      temp: '+3 °C',
      isSafe: false,
    },
    {
      id: 2,
      code: 'HUONE #14',
      name: 'Voudin konttori',
      note: 'Raskaat saappaat kuuluvat käytävästä, karttakeppi pöydällä.',
      stressLevel: 'Pelkotaso: 85%',
      temp: '+14 °C',
      isSafe: false,
    },
    {
      id: 3,
      code: 'HUONE #?? (Kätkö)',
      name: 'Renkituvan Leivinuuni',
      note: 'Hiilloksen lämpö suojaa pakkaselta. Muurin kolossa ruisleipää ja piilopaikka.',
      stressLevel: 'Pelkotaso: 0% (TURVAPAIKKA)',
      temp: '+28 °C',
      isSafe: true,
    },
    {
      id: 4,
      code: 'HUONE #22',
      name: 'Pohjoinen vintti',
      note: 'Tuuli ulvoo kattopäreiden välistä ja varjot heiluvat.',
      stressLevel: 'Pelkotaso: 75%',
      temp: '+5 °C',
      isSafe: false,
    },
  ];

  // Huonenumeron laskenta:
  // Renkituvan turvahuone sijaitsee Voudin konttorin (#14) ja Pohjoisen vintin (#22) puolivälissä: (14 + 22) / 2 = 18
  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);
  const cleanPlace = placeInput.trim().toUpperCase();
  const roomNumVal = parseInt(roomNumInput.trim(), 10);

  const isPlaceOk = cleanPlace === 'LEIVINUUNI';
  const isRoomNumOk = roomNumVal === 18;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    soundFX.playKeyClick();

    if (!isPlaceOk) {
      soundFX.playFailure();
      setErrorMsg('Vaihe 1: Syötä pohjapiirroksesta löytyvän lämpimän turvapaikan esine (yksi sana, esim. LEIVINUUNI).');
      return;
    }
    if (!isRoomNumOk) {
      soundFX.playFailure();
      setErrorMsg('Vaihe 2: Laske turvahuoneen numero! Se on Voudin konttorin (14) ja Pohjoisen vintin (22) tarkka keskiarvo.');
      return;
    }

    setSolved(true);
    soundFX.playSuccess();
    if (onSuccessCode) onSuccessCode('LEIVINUUNI-18');
  };

  return (
    <div className="parchment-card rounded-2xl border-2 border-[#8b5a2b] p-4 sm:p-5 shadow-2xl space-y-4 font-serif">
      <div className="flex items-center justify-between border-b border-[#5c3e21] pb-3">
        <div className="flex items-center gap-2 text-[#fbbf24]">
          <Home className="w-5 h-5 text-[#d4af37]" />
          <div>
            <h3 className="font-cinzel font-bold text-sm sm:text-base text-[#fef3c7] uppercase">
              NODE-06 // Orpopojan Traumakartta & Piilopaikka
            </h3>
            <span className="text-[11px] text-[#a88456] block">
              Virkatalon hiilipiirros 1888 • Tutki huoneet ja laske turvahuoneen numero
            </span>
          </div>
        </div>
      </div>

      {/* Floorplan Blueprint */}
      <div className="paper-document p-4 rounded-xl border-2 border-[#5c3e21] text-[#2b1d0c] space-y-3">
        <div className="flex justify-between items-center text-[10px] font-typewriter border-b border-[#a88456] pb-1">
          <span>ORPOPOJAN HIILIPIIRROS // RENKITUPA</span>
          <span>KLIKKAA HUONEITA TUTKIAKSESI</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {rooms.map((room) => {
            const isSelected = selectedRoomId === room.id;
            return (
              <button
                key={room.id}
                type="button"
                onClick={() => {
                  soundFX.playKeyClick();
                  setSelectedRoomId(room.id);
                }}
                className={`p-3 rounded-lg border-2 text-left transition touch-manipulation ${
                  isSelected
                    ? 'bg-[#3b2413] text-[#fef3c7] border-[#d4af37] shadow-md'
                    : 'bg-[#e6d2b2] text-[#2b1d0c] border-[#8b5a2b] hover:bg-[#dcc39c]'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-typewriter opacity-80">
                  <span>{room.code}</span>
                  <span>{room.temp}</span>
                </div>
                <div className="font-cinzel font-bold text-xs mt-0.5">{room.name}</div>
              </button>
            );
          })}
        </div>

        {selectedRoom ? (
          <div className="p-3 rounded-lg bg-[#24170d] text-[#fef3c7] border border-[#d4af37] text-xs space-y-1 animate-fadeIn">
            <div className="flex items-center justify-between font-typewriter text-[11px] text-[#fbbf24]">
              <span>{selectedRoom.code} — {selectedRoom.name}</span>
              <span>{selectedRoom.stressLevel}</span>
            </div>
            <p className="italic text-[#e4cdad]">&quot;{selectedRoom.note}&quot;</p>
            {selectedRoom.isSafe && (
              <p className="text-[11px] text-amber-300 font-typewriter pt-1">
                Vihjemerkintä muurissa: &quot;Huonenumero on Voudin konttorin (#14) ja Pohjoisen vintin (#22) keskiarvo.&quot;
              </p>
            )}
          </div>
        ) : (
          <div className="text-xs italic text-[#6b4c30] text-center py-2">
            Klikkaa yllä olevia pohjapiirroksen huoneita lukeaksesi orpopojan merkinnät.
          </div>
        )}
      </div>

      <form onSubmit={handleVerify} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-[#18110a] p-3.5 rounded-xl border border-[#4a3219]">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-cinzel font-bold text-[#fbbf24]">
                1. TURVAPAIKAN NIMI (YKSITTÄINEN SANA):
              </label>
              {isPlaceOk && <span className="text-xs text-emerald-400 font-mono font-bold">✓ Oikein</span>}
            </div>
            <p className="text-[11px] text-[#a88456] mb-2">
              Mikä lämmin paikka renkituvassa toimii kätkönä?
            </p>
            <input
              type="text"
              placeholder="Syötä turvapaikka..."
              value={placeInput}
              onChange={(e) => setPlaceInput(e.target.value)}
              className="w-full bg-[#0d0905] border border-[#5c3e21] text-[#fbbf24] px-3 py-2 rounded-lg font-typewriter uppercase text-xs focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          <div className="bg-[#18110a] p-3.5 rounded-xl border border-[#4a3219]">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-cinzel font-bold text-[#fbbf24]">
                2. TURVAHUONEEN NUMERO:
              </label>
              {isRoomNumOk && <span className="text-xs text-emerald-400 font-mono font-bold">✓ Oikein</span>}
            </div>
            <p className="text-[11px] text-[#a88456] mb-2">
              Huoneiden #14 ja #22 keskiarvo:
            </p>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Syötä huonenumero..."
              value={roomNumInput}
              onChange={(e) => setRoomNumInput(e.target.value)}
              className="w-full bg-[#0d0905] border border-[#5c3e21] text-[#fbbf24] px-3 py-2.5 rounded-lg font-typewriter text-sm focus:outline-none focus:border-[#d4af37]"
            />
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/80 border border-red-500/60 rounded-xl text-xs text-red-200">
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          className="w-full btn-brass font-bold py-3 px-4 rounded-xl font-cinzel text-xs sm:text-sm flex items-center justify-center gap-2 uppercase shadow-xl"
        >
          <Flame className="w-4 h-4" />
          <span>Vahvista Traumakartan Kätkö</span>
        </button>
      </form>

      {solved && (
        <div className="p-3 bg-[#142314] border border-emerald-500 rounded-xl text-xs text-emerald-200 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Turvapaikka paikannettu! Purkukoodi: <strong className="font-typewriter text-amber-300">LEIVINUUNI-18</strong>
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * NODE-08: Kutojan silmukkalasku & kirjoneule (SILMUKKA-24)
 */
export const TullikatePuzzle: React.FC<PuzzleProps> = ({ onSuccessCode }) => {
  // Symmetrinen 7 silmukan kirjoneulerivi: [Punainen, Luonnonvalkoinen, Punainen, Kultatähti, ?, Luonnonvalkoinen, Punainen]
  const [missingStitchColor, setMissingStitchColor] = useState<'white' | 'red' | 'gold' | null>(null);
  const [castOnInput, setCastOnInput] = useState('');
  const [heelStitchesInput, setHeelStitchesInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);

  // Laskenta:
  // 1. Aloitussilmukat yhteensä 4 puikolla: 4 × 16 s = 64 s
  // 2. Nilkan kavennus: jokaiselta puikolta kavennetaan 4 s -> 16 - 4 = 12 s / puikko
  //    Kantalappuun yhdistetään puikot I ja IV: 12 s + 12 s = 24 silmukkaa
  const castOnVal = parseInt(castOnInput.trim(), 10);
  const heelVal = parseInt(heelStitchesInput.trim(), 10);

  const isPatternOk = missingStitchColor === 'red';
  const isCastOnOk = castOnVal === 64;
  const isHeelOk = heelVal === 24;

  const patternRow = [
    { pos: 1, label: 'Punainen', bg: 'bg-red-800 border-red-400 text-red-100', symbol: '∨' },
    { pos: 2, label: 'Pellava', bg: 'bg-[#f5ebd6] border-[#a88456] text-[#3b2413]', symbol: '∨' },
    { pos: 3, label: 'Punainen', bg: 'bg-red-800 border-red-400 text-red-100', symbol: '∨' },
    { pos: 4, label: 'Keskus', bg: 'bg-amber-500 border-yellow-200 text-black', symbol: '❖' },
    {
      pos: 5,
      label: 'Puuttuva',
      bg:
        missingStitchColor === 'red'
          ? 'bg-red-800 border-red-400 text-red-100'
          : missingStitchColor === 'white'
          ? 'bg-[#f5ebd6] border-[#a88456] text-[#3b2413]'
          : missingStitchColor === 'gold'
          ? 'bg-amber-500 border-yellow-200 text-black'
          : 'bg-[#0d0905] border-dashed border-[#fbbf24] text-[#fbbf24]',
      symbol: missingStitchColor ? '∨' : '?',
    },
    { pos: 6, label: 'Pellava', bg: 'bg-[#f5ebd6] border-[#a88456] text-[#3b2413]', symbol: '∨' },
    { pos: 7, label: 'Punainen', bg: 'bg-red-800 border-red-400 text-red-100', symbol: '∨' },
  ];

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    soundFX.playKeyClick();

    if (!isPatternOk) {
      soundFX.playFailure();
      setErrorMsg('Vaihe 1: Täydennä ensin kirjoneuleen 5. silmukka niin, että mallikerta on peilikuvana symmetrinen keskisilmukan (❖) molemmin puolin!');
      return;
    }
    if (!isCastOnOk) {
      soundFX.playFailure();
      setErrorMsg('Vaihe 2 (Aloitussilmukat yhteensä) on väärin! Laske 4 puikkoa × 16 silmukkaa.');
      return;
    }
    if (!isHeelOk) {
      soundFX.playFailure();
      setErrorMsg('Vaihe 3 (Kantalapun silmukat) on väärin! Kun jokaiselta 16 silmukan puikolta kavennetaan 4 silmukkaa, montako silmukkaa jää yhteensä kahdelle puikolle (I ja IV)?');
      return;
    }

    setSolved(true);
    soundFX.playSuccess();
    if (onSuccessCode) onSuccessCode('SILMUKKA-24');
  };

  return (
    <div className="parchment-card rounded-2xl border-2 border-[#8b5a2b] p-4 sm:p-5 shadow-2xl space-y-4 font-serif">
      <div className="flex items-center justify-between border-b border-[#5c3e21] pb-3">
        <div className="flex items-center gap-2 text-[#fbbf24]">
          <Sparkles className="w-5 h-5 text-[#d4af37]" />
          <div>
            <h3 className="font-cinzel font-bold text-sm sm:text-base text-[#fef3c7] uppercase">
              NODE-08 // Kutojan Silmukkalasku & Kirjoneule
            </h3>
            <span className="text-[11px] text-[#a88456] block">
              Virkatalon villasukka- ja ryijyohje • Mallikerta 1888
            </span>
          </div>
        </div>
        <div className="text-xs bg-[#24170d] border border-[#d4af37]/60 text-[#fbbf24] px-3 py-1 rounded-lg font-typewriter">
          4 PUIKKOA
        </div>
      </div>

      {/* Vintage Knitting Pattern Card */}
      <div className="paper-document p-4 rounded-xl border-2 border-[#5c3e21] text-[#2b1d0c] space-y-3">
        <div className="font-cinzel font-bold text-xs sm:text-sm border-b border-[#a88456] pb-1 flex justify-between">
          <span>NUORAMOISTEN KIRJONEULESUKKA // OHJE 1888</span>
          <span>LANKA: 7 VELJESTÄ / KARTANON VILLA</span>
        </div>

        <div className="text-xs space-y-1.5 leading-relaxed">
          <p>
            <strong>1. Varren aloitus:</strong> Luo jokaiselle <strong>4 sukkapuikolle 16 silmukkaa</strong> ja neulo 2o 2n -joustinneuletta.
          </p>
          <p>
            <strong>2. Kirjoneuleen mallikerta (7 silmukkaa):</strong> Mallikerta on symmetrinen keskitähden (❖) ympärillä. Valitse puuttuvan <strong>5. silmukan</strong> lankaväri:
          </p>
        </div>

        {/* Interactive Stitch Chart */}
        <div className="bg-[#e5cfab] p-3 rounded-lg border border-[#a88456] space-y-2.5">
          <div className="grid grid-cols-7 gap-1.5 max-w-sm mx-auto">
            {patternRow.map((st) => (
              <div
                key={st.pos}
                className={`h-11 rounded-lg border-2 flex flex-col items-center justify-center font-bold text-sm shadow-sm ${st.bg}`}
              >
                <span>{st.symbol}</span>
                <span className="text-[9px] font-mono opacity-80">#{st.pos}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <span className="text-[11px] font-bold text-[#4a2e16]">Valitse 5. silmukan lanka:</span>
            <button
              type="button"
              onClick={() => {
                soundFX.playKeyClick();
                setMissingStitchColor('red');
              }}
              className={`px-2.5 py-1 rounded text-xs font-bold border transition ${
                missingStitchColor === 'red'
                  ? 'bg-red-800 text-white border-yellow-300 scale-105'
                  : 'bg-red-900/80 text-red-100 border-red-700'
              }`}
            >
              🧶 Krappipunainen
            </button>
            <button
              type="button"
              onClick={() => {
                soundFX.playKeyClick();
                setMissingStitchColor('white');
              }}
              className={`px-2.5 py-1 rounded text-xs font-bold border transition ${
                missingStitchColor === 'white'
                  ? 'bg-[#f5ebd6] text-[#2b1d0c] border-amber-700 scale-105'
                  : 'bg-[#e8d9be] text-[#4a2e16] border-[#a88456]'
              }`}
            >
              🧶 Luonnonvalkoinen
            </button>
            <button
              type="button"
              onClick={() => {
                soundFX.playKeyClick();
                setMissingStitchColor('gold');
              }}
              className={`px-2.5 py-1 rounded text-xs font-bold border transition ${
                missingStitchColor === 'gold'
                  ? 'bg-amber-500 text-black border-white scale-105'
                  : 'bg-amber-600/80 text-black border-amber-800'
              }`}
            >
              🧶 Kultalanka
            </button>
          </div>
        </div>

        <p className="text-xs leading-relaxed">
          <strong>3. Nilkan kavennus ja kantalappu:</strong> Ennen kantapäätä kavenna jokaiselta 4 puikolta <strong>4 silmukkaa</strong> (2 oikein yhteen). Siirrä sen jälkeen <strong>puikkojen I ja IV</strong> jäljelle jääneet silmukat samalle puikolle kantalappua varten.
        </p>
      </div>

      <form onSubmit={handleVerify} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-[#18110a] p-3.5 rounded-xl border border-[#4a3219]">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-cinzel font-bold text-[#fbbf24]">
                2. ALOITUSSILMUKAT YHTEENSÄ:
              </label>
              {isCastOnOk && <span className="text-xs text-emerald-400 font-mono font-bold">✓ Oikein</span>}
            </div>
            <p className="text-[11px] text-[#a88456] mb-2">
              4 puikkoa × 16 silmukkaa:
            </p>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Syötä aloitussilmukat (s)..."
              value={castOnInput}
              onChange={(e) => setCastOnInput(e.target.value)}
              className="w-full bg-[#0d0905] border border-[#5c3e21] text-[#fbbf24] px-3 py-2.5 rounded-lg font-typewriter text-sm focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          <div className="bg-[#18110a] p-3.5 rounded-xl border border-[#4a3219]">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-cinzel font-bold text-[#fbbf24]">
                3. KANTALAPUN SILMUKAT (PUIKOT I + IV):
              </label>
              {isHeelOk && <span className="text-xs text-emerald-400 font-mono font-bold">✓ Oikein</span>}
            </div>
            <p className="text-[11px] text-[#a88456] mb-2">
              Kahden puikon silmukat yhteensä kavennusten jälkeen:
            </p>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Syötä kantalapun silmukat..."
              value={heelStitchesInput}
              onChange={(e) => setHeelStitchesInput(e.target.value)}
              className="w-full bg-[#0d0905] border border-[#5c3e21] text-[#fbbf24] px-3 py-2.5 rounded-lg font-typewriter text-sm focus:outline-none focus:border-[#d4af37]"
            />
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/80 border border-red-500/60 rounded-xl text-xs text-red-200">
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          className="w-full btn-brass font-bold py-3 px-4 rounded-xl font-cinzel text-xs sm:text-sm flex items-center justify-center gap-2 uppercase shadow-xl"
        >
          <Calculator className="w-4 h-4" />
          <span>Vahvista Silmukkalasku</span>
        </button>
      </form>

      {solved && (
        <div className="p-3 bg-[#142314] border border-emerald-500 rounded-xl text-xs text-emerald-200 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Mallikerta ja kantalapun silmukat täsmäävät! Purkukoodi: <strong className="font-typewriter text-amber-300">SILMUKKA-24</strong>
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * NODE-10: Pikselikirves ja Tappara (KIRVES-CHAMP)
 */
export const PikselikirvesPuzzle: React.FC<PuzzleProps> = ({ onSuccessCode }) => {
  // 4x4 Ice Rink Grid: Start at (0,0), reach Trophy at (3,3) collecting all 3 Kirves emblems
  // Blocked cells (defenders): (0,2), (1,1), (2,3), (3,1)
  // Kirves emblems at: (1,0), (2,1), (3,2)
  const [path, setPath] = useState<string[]>(['0,0']);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);

  const obstacles = new Set(['0,2', '1,1', '2,3', '3,1']);
  const emblems = new Set(['1,0', '2,1', '3,2']);
  const goal = '3,3';

  const currentPos = path[path.length - 1];
  const collectedEmblems = path.filter((p) => emblems.has(p)).length;

  const handleCellClick = (r: number, c: number) => {
    if (solved) return;
    setErrorMsg(null);
    const key = `${r},${c}`;

    if (obstacles.has(key)) {
      soundFX.playFailure();
      setErrorMsg('Törmäsit vastustajan puolustajaan! Reitti nollattiin aloitusympyrään.');
      setPath(['0,0']);
      return;
    }

    const [cr, cc] = currentPos.split(',').map(Number);
    const dist = Math.abs(r - cr) + Math.abs(c - cc);
    if (dist !== 1) {
      soundFX.playKeyClick();
      setErrorMsg('Voit luistella vain viereiseen ruutuun (ylös, alas, vasemmalle tai oikealle)!');
      return;
    }

    soundFX.playKeyClick();
    const nextPath = [...path, key];
    setPath(nextPath);

    if (key === goal) {
      const collected = new Set(nextPath.filter((p) => emblems.has(p))).size;
      if (collected < 3) {
        soundFX.playFailure();
        setErrorMsg('Saavuit maalille, mutta et kerännyt kaikkia 3 kirvestunnusta matkalla! Yritä uudelleen.');
        setPath(['0,0']);
      } else {
        setSolved(true);
        soundFX.playSuccess();
        if (onSuccessCode) onSuccessCode('KIRVES-CHAMP');
      }
    }
  };

  return (
    <div className="parchment-card rounded-2xl border-2 border-[#8b5a2b] p-4 sm:p-5 shadow-2xl space-y-4 font-serif">
      <div className="flex items-center justify-between border-b border-[#5c3e21] pb-3">
        <div className="flex items-center gap-2 text-[#fbbf24]">
          <Trophy className="w-5 h-5 text-[#d4af37]" />
          <div>
            <h3 className="font-cinzel font-bold text-sm sm:text-base text-[#fef3c7] uppercase">
              NODE-10 // Pikselikirves & Jäälabyrintti
            </h3>
            <span className="text-[11px] text-[#a88456] block">
              Kerää kaikki 3 kirvesmerkkiä (🪓) ja luistele pokaalille (🏆)
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            soundFX.playKeyClick();
            setPath(['0,0']);
            setErrorMsg(null);
          }}
          className="btn-brass px-3 py-1 rounded-lg text-xs font-cinzel font-bold"
        >
          Aloita alusta
        </button>
      </div>

      <div className="flex items-center justify-between text-xs bg-[#18110a] px-3.5 py-2 rounded-xl border border-[#4a3219]">
        <span>Kerätyt kirvesmerkit: <strong className="text-[#fbbf24]">{collectedEmblems} / 3</strong></span>
        <span className="text-[#a88456]">Klikkaa viereistä ruutua luistellaksesi</span>
      </div>

      <div className="grid grid-cols-4 gap-2 max-w-xs mx-auto p-3 bg-[#0b1929] border-2 border-[#38bdf8] rounded-2xl shadow-inner">
        {Array.from({ length: 4 }).map((_, r) =>
          Array.from({ length: 4 }).map((__, c) => {
            const key = `${r},${c}`;
            const isCurrent = currentPos === key;
            const isVisited = path.includes(key);
            const isObstacle = obstacles.has(key);
            const isEmblem = emblems.has(key);
            const isGoal = key === goal;

            return (
              <button
                key={key}
                type="button"
                onClick={() => handleCellClick(r, c)}
                className={`h-14 rounded-xl font-bold text-lg flex items-center justify-center border transition ${
                  isCurrent
                    ? 'bg-orange-500 border-white text-white scale-105 shadow-[0_0_15px_rgba(249,115,22,0.8)]'
                    : isObstacle
                    ? 'bg-red-950/80 border-red-500/50 text-red-300'
                    : isVisited
                    ? 'bg-blue-800/80 border-orange-400 text-white'
                    : 'bg-[#132a42] border-[#29527a] text-sky-200 hover:bg-[#1c3d5e]'
                }`}
              >
                {isCurrent
                  ? '🏒'
                  : isGoal
                  ? '🏆'
                  : isObstacle
                  ? '🛑'
                  : isEmblem
                  ? '🪓'
                  : key === '0,0'
                  ? '🟢'
                  : '·'}
              </button>
            );
          })
        )}
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-950/80 border border-red-500/60 rounded-xl text-xs text-red-200 text-center">
          {errorMsg}
        </div>
      )}

      {solved && (
        <div className="p-3 bg-[#142314] border border-emerald-500 rounded-xl text-xs text-emerald-200 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Mestaruuspokaali saavutettu! Purkukoodi: <strong className="font-typewriter text-amber-300">KIRVES-CHAMP</strong>
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * NODE-11: Kuraiset jäljet ja lätäköt (Koodi: 7)
 */
export const KuraisetLatakotPuzzle: React.FC<PuzzleProps> = ({ onSuccessCode }) => {
  const [jumpedIds, setJumpedIds] = useState<number[]>([]);
  const [countInput, setCountInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);

  // Kuistilla on 9 kohtaa, joista 7 on oikeita kuralätäköitä ja 2 on kuivia kiviä
  const spots = [
    { id: 1, label: 'Kuralätäkkö', icon: '💦', isPuddle: true },
    { id: 2, label: 'Kuiva porraskivi', icon: '🪨', isPuddle: false },
    { id: 3, label: 'Syvä lätäkkö', icon: '💦', isPuddle: true },
    { id: 4, label: 'Leveä kuralätäkkö', icon: '💦', isPuddle: true },
    { id: 5, label: 'Sammallätäkkö', icon: '💦', isPuddle: true },
    { id: 6, label: 'Kuiva kynnysmatto', icon: '🟫', isPuddle: false },
    { id: 7, label: 'Pihan lätäkkö', icon: '💦', isPuddle: true },
    { id: 8, label: 'Kaivon lätäkkö', icon: '💦', isPuddle: true },
    { id: 9, label: 'Kuistin lätäkkö', icon: '💦', isPuddle: true },
  ];

  const toggleSpot = (id: number, isPuddle: boolean) => {
    setErrorMsg(null);
    if (!isPuddle) {
      soundFX.playFailure();
      setErrorMsg('Hups! Tuo on kuiva kohta – hyppää vain vesilätäköihin (💦)!');
      return;
    }
    soundFX.playKeyClick();
    setJumpedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    soundFX.playKeyClick();

    if (jumpedIds.length < 7) {
      soundFX.playFailure();
      setErrorMsg(`Olet hypännyt vasta ${jumpedIds.length} lätäkköön! Etsi ja klikkaa ensin kaikki pihan vesilätäköt.`);
      return;
    }

    if (countInput.trim() === '7') {
      setSolved(true);
      soundFX.playSuccess();
      if (onSuccessCode) onSuccessCode('7');
    } else {
      soundFX.playFailure();
      setErrorMsg('Lätäköiden lukumäärä ei täsmää! Laske montako vesilätäkköä (💦) hyppäsit.');
    }
  };

  return (
    <div className="parchment-card rounded-2xl border-2 border-[#8b5a2b] p-4 sm:p-5 shadow-2xl space-y-4 font-serif">
      <div className="flex items-center justify-between border-b border-[#5c3e21] pb-3">
        <div className="flex items-center gap-2 text-[#fbbf24]">
          <Footprints className="w-5 h-5 text-[#d4af37]" />
          <div>
            <h3 className="font-cinzel font-bold text-sm sm:text-base text-[#fef3c7] uppercase">
              NODE-11 // Kuraiset Jäljet ja Lätäköt
            </h3>
            <span className="text-[11px] text-[#a88456] block">
              Klikkaa jokaiseen vesilätäkköön (💦), vältä kuivia kiviä ja laske lätäköt!
            </span>
          </div>
        </div>
        <div className="text-xs bg-[#24170d] border border-[#d4af37]/60 text-[#fbbf24] px-3 py-1 rounded-lg font-typewriter">
          HYPÄTTY: {jumpedIds.length}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {spots.map((s) => {
          const isJumped = jumpedIds.includes(s.id);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => toggleSpot(s.id, s.isPuddle)}
              className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                isJumped
                  ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200 shadow-md'
                  : 'bg-[#18110a] border-[#4a3219] text-[#e4cdad] hover:border-[#d4af37]'
              }`}
            >
              <span className="text-2xl">{isJumped ? '👢💦' : s.icon}</span>
              <span className="text-[11px] font-cinzel">{s.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleVerify} className="pt-2 flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          inputMode="numeric"
          placeholder="Montako vesilätäkköä pihalla oli yhteensä?..."
          value={countInput}
          onChange={(e) => setCountInput(e.target.value)}
          className="flex-1 bg-[#0d0905] border border-[#5c3e21] text-[#fbbf24] px-4 py-2.5 rounded-lg font-typewriter text-sm focus:outline-none focus:border-[#d4af37]"
        />
        <button
          type="submit"
          className="btn-brass font-bold text-xs font-cinzel px-5 py-2.5 rounded-lg uppercase"
        >
          Vahvista Lätäköt
        </button>
      </form>

      {errorMsg && (
        <div className="p-3 bg-red-950/80 border border-red-500/60 rounded-xl text-xs text-red-200">
          {errorMsg}
        </div>
      )}

      {solved && (
        <div className="p-3 bg-[#142314] border border-emerald-500 rounded-xl text-xs text-emerald-200 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Kaikki 7 kuralätäkköä hypätty! Purkukoodi: <strong className="font-typewriter text-amber-300">7</strong>
          </span>
        </div>
      )}
    </div>
  );
};

