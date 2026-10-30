# VÄRILÄ PROTOKOLLA 1888 // TEKNINEN LISÄMÄÄRITTELY (ANTIGRAVITY)
**Dokumentti:** `antigravity_video_flow_spec.md`  
**Päivitetty:** Lokakuu 2026  
**Viiteprojekti:** Tapaus Värilä (Halloween ARG / Next.js PWA + Supabase + Cloudflare R2 + Vercel)

---

## 1. YDINKONSEPTI & KRITIIKKISET RAJAUKSET

1. **EI NFC-SIRUJA TAI FYYSISIÄ SKANNAUKSIA:**
   - Kaikki aiemmat NFC-viitteet (`?nfc=...`, NDEF-tagit, Web NFC) on **poistettu kokonaan**.
   - Peliä ohjataan puhtaasti kahdesta paikasta:
     1. **Järjestäjän `/admin`-ohjauspaneelista** (tehtävien aktivointi kannassa + 1-klikkauksen WhatsApp-heräteviestit).
     2. **Pelaajan PWA-päätteestä** (pelaajan nimen ja oman 4-numeroisen PIN-koodin rekisteröinti, teaser-videon katselu, interaktiivinen minipeli ja koodin purku).
2. **AIKALASKENNAN SÄÄNTÖ:**
   - Aikalaskuri **EI** käynnisty WhatsApp-ilmoituksesta.
   - Aikalaskuri **EI** käy teaser-videon toiston aikana.
   - Aikalaskuri käynnistyy **vasta kun pelaaja on katsonut teaser-videon ja painaa siirtymispainiketta purkutehtävään**.
   - Aloitusaika lukitaan aina **palvelinpään aikaleimalla** (`task_attempts.started_at` Supabasessa).

---

## 2. PORTTIMALLI JA TEASER-VIDEON TOISTOLOGIIKKA (GATEKEEPER)

Mobiililaitteiden (erityisesti iOS Safari ja Android Chrome) automaattitoiston ja äänien esto (Autoplay policy) estää videoiden väkisin käynnistämisen taustalta äänien kera. Siksi tehtävänäkymässä sovelletaan **kolmivaiheista porttilogiikkaa**:

```
[ VAIHE 1: VALMIUSTILA ]
  └── Pelaaja saapuu tehtävään.
  └── Näytöllä on teemaan sopiva herätepainike: "AVAA ANOMALIASIGNAALI".
  └── Käyttäjän kosketus antaa selaimelle oikeuden toistaa ääntä ja videota.
           │
           ▼
[ VAIHE 2: TEASER-VIDEON TOISTO ]
  └── 5–8 sekunnin Veo 3.1 -teaservideo striimataan suoraan Cloudflare R2:sta.
  └── Aikalaskuri EI käy vielä.
  └── Pelaaja voi keskittyä videon tunnelmaan ja vihjeisiin.
  └── Vaihtoehdot siirtymiselle: video päättyy (`onEnded`) TAI pelaaja valitsee "Siirry purkuun".
           │
           ▼
[ VAIHE 3: PALVELINKUTSU & AJANOTTO ]
  └── PWA kutsuu taustarajapintaa: POST /api/game/start-task { playerId, nodeKey }
  └── Supabase lukitsee started_at = NOW() (jos ei jo olemassa).
  └── Ruutu siirtyy interaktiiviseen minipeliin (esim. TorqueLock, Ledger, CheerBalance).
  └── Sekuntikello alkaa tikittää ruudulla palvelinajan pohjalta.
```

---

## 3. TIETOKANTAMALLI (SUPABASE SQL)

Aja seuraavat taulumäärittelyt Supabasessa. Huomioi, että `task_attempts` sitoo aloituksen nimenomaan videon jälkeiseen siirtymään.

```sql
-- 1. Pelaajat (rekisteröityvät itse nimellä + 4-num PIN)
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  pin_code TEXT NOT NULL,
  total_score INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tehtäväsolmut (11 sinettiä)
CREATE TABLE IF NOT EXISTS game_nodes (
  node_key TEXT PRIMARY KEY,               -- esim. 'NODE-01'
  title TEXT NOT NULL,
  secret_code TEXT NOT NULL,               -- esim. '382NM'
  video_url TEXT NOT NULL,                 -- esim. 'https://pub-xxx.r2.dev/panssarilukko.mp4'
  is_active BOOLEAN DEFAULT FALSE,         -- Admin aktivoi tämän
  unlocked_at TIMESTAMP WITH TIME ZONE
);

-- 3. Pelaajakohtaiset aikalaskurit ja suoritukset
CREATE TABLE IF NOT EXISTS task_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  node_key TEXT REFERENCES game_nodes(node_key),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INT,
  awarded_points INT DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  UNIQUE(player_id, node_key)
);

-- Atominen pisteiden lisäys
CREATE OR REPLACE FUNCTION increment_player_score(p_id UUID, pts INT)
RETURNS VOID AS $$
BEGIN
  UPDATE players
  SET total_score = total_score + pts
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;
```

---

## 4. PALVELINRAJAPINNAT (NEXT.JS ROUTE HANDLERS)

### 4.1. Tehtävän käynnistys ja ajanoton lukitus (`src/app/api/game/start-task/route.ts`)
```typescript
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: Request) {
  try {
    const { playerId, nodeKey } = await req.json();

    if (!playerId || !nodeKey) {
      return NextResponse.json({ error: 'Puuttuvat parametrit' }, { status: 400 });
    }

    // Tarkistetaan onko pelaaja jo käynnistänyt tämän tehtävän
    const { data: existing } = await supabase
      .from('task_attempts')
      .select('started_at, is_completed')
      .eq('player_id', playerId)
      .eq('node_key', nodeKey)
      .maybeSingle();

    if (existing) {
      // Palautetaan jo aiemmin aloitettu aika (kelloa ei voi nollata sivulatauksella)
      return NextResponse.json({
        startedAt: existing.started_at,
        isCompleted: existing.is_completed,
      });
    }

    // Ensimmäinen käynnistys videon jälkeen -> tallennetaan palvelimen nykyhetki
    const nowIso = new Date().toISOString();
    const { data: newAttempt, error } = await supabase
      .from('task_attempts')
      .insert({
        player_id: playerId,
        node_key: nodeKey,
        started_at: nowIso,
      })
      .select('started_at')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      startedAt: newAttempt.started_at,
      isCompleted: false,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
```

### 4.2. Koodin tarkistus ja nopeuspisteytys (`src/app/api/check-code/route.ts`)
```typescript
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: Request) {
  try {
    const { playerId, nodeKey, inputCode } = await req.json();

    // 1. Tarkistetaan tehtävän koodi kannasta
    const { data: node } = await supabase
      .from('game_nodes')
      .select('secret_code')
      .eq('node_key', nodeKey)
      .single();

    if (!node || node.secret_code.trim().toUpperCase() !== inputCode.trim().toUpperCase()) {
      return NextResponse.json({ success: false, error: 'Virheellinen purkukoodi!' }, { status: 400 });
    }

    // 2. Haetaan pelaajan aikaloki
    const { data: attempt } = await supabase
      .from('task_attempts')
      .select('*')
      .eq('player_id', playerId)
      .eq('node_key', nodeKey)
      .single();

    if (!attempt) {
      return NextResponse.json({ error: 'Aloitusaikaa ei löydy. Avaa tehtävä alusta.' }, { status: 400 });
    }

    if (attempt.is_completed) {
      return NextResponse.json({ error: 'Tämä anomalia on jo aiemmin purettu!' }, { status: 400 });
    }

    // 3. Lasketaan kesto sekunneissa palvelimen kellolla
    const now = new Date();
    const started = new Date(attempt.started_at);
    const durationSeconds = Math.max(1, Math.floor((now.getTime() - started.getTime()) / 1000));

    // 4. Pisteporras nopeuden mukaan
    let points = 50;
    if (durationSeconds < 60) points = 100;       // Alle 1 min
    else if (durationSeconds < 180) points = 85;  // Alle 3 min
    else if (durationSeconds < 600) points = 70;  // Alle 10 min

    // 5. Päivitetään suoritus ja kokonaispisteet
    await supabase
      .from('task_attempts')
      .update({
        completed_at: now.toISOString(),
        duration_seconds: durationSeconds,
        awarded_points: points,
        is_completed: true,
      })
      .eq('id', attempt.id);

    await supabase.rpc('increment_player_score', { p_id: playerId, pts: points });

    return NextResponse.json({
      success: true,
      points,
      durationSeconds,
      message: `Anomalia purettu ajassa ${Math.floor(durationSeconds / 60)} min ${durationSeconds % 60} s! Pisteet: +${points} p`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
```

---

## 5. FRONTEND-KOMPONENTTI: TASKGATE (`src/components/TaskGate.tsx`)

Tämä komponentti asettaa videon portiksi ennen peliä. Se takaa, että video katsotaan ensin ilman aikarajapaineita:

```tsx
'use client';

import { useState, useRef } from 'react';

interface TaskGateProps {
  playerId: string;
  nodeKey: string;
  title: string;
  videoUrl: string;
  onTaskStarted: (startedAt: string) => void;
}

export default function TaskGate({
  playerId,
  nodeKey,
  title,
  videoUrl,
  onTaskStarted,
}: TaskGateProps) {
  const [phase, setPhase] = useState<'prompt' | 'playing' | 'ready'>('prompt');
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Käynnistää videon käyttäjän painalluksesta (ratkaisee mobiiliselainten esto-ongelman)
  const handleStartPlayback = () => {
    setPhase('playing');
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch((err) => {
        console.warn('Autoplay vaatii käyttäjän hyväksynnän:', err);
      });
    }
  };

  // Video päättyi tai pelaaja kuittasi katselun -> kutsutaan backendin aikalaskuria
  const handleProceedToTask = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/game/start-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, nodeKey }),
      });
      const data = await res.json();
      if (res.ok) {
        onTaskStarted(data.startedAt);
      } else {
        alert(data.error || 'Ajanoton käynnistys epäonnistui');
      }
    } catch (e) {
      console.error(e);
      alert('Yhteysvirhe palvelimeen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-stone-950 border-2 border-stone-800 rounded-lg overflow-hidden font-mono text-stone-200 shadow-2xl">
      {/* VAIHE 1: Käynnistyskehotus */}
      {phase === 'prompt' && (
        <div className="p-8 text-center space-y-4">
          <div className="text-xs text-red-500 tracking-widest uppercase animate-pulse">
            ⚠️ SALATTU SIGNAALI VASTAANOTETTU
          </div>
          <h2 className="text-lg font-bold text-amber-500 font-serif uppercase">
            {title}
          </h2>
          <p className="text-xs text-stone-400 leading-relaxed">
            Arkistosta palautettu filmikatkelma vuodelta 1888 sisältää vihjeen mekanismin murtamiseen.
            Katso tallenne rauhassa ennen siirtymistä purkutyöhön.
          </p>
          <button
            onClick={handleStartPlayback}
            className="w-full py-4 bg-amber-700 hover:bg-amber-600 active:bg-amber-500 text-black font-bold uppercase text-xs tracking-widest transition shadow-lg"
          >
            ▶ Avaa ja katso anomaliatallenne
          </button>
        </div>
      )}

      {/* VAIHE 2: Video toistuu */}
      <div className={phase === 'prompt' ? 'hidden' : 'relative bg-black'}>
        <video
          ref={videoRef}
          src={videoUrl}
          playsInline
          preload="auto"
          onEnded={() => setPhase('ready')}
          className="w-full aspect-video object-contain"
        />

        {phase === 'playing' && (
          <div className="p-3 bg-stone-950/90 border-t border-stone-800 flex justify-between items-center text-xs">
            <span className="text-zinc-500 text-[11px] uppercase animate-pulse">
              Toistetaan arkistosignaalia...
            </span>
            <button
              onClick={() => {
                if (videoRef.current) videoRef.current.pause();
                setPhase('ready');
              }}
              className="text-stone-400 hover:text-white underline text-[11px]"
            >
              Ohita katselu →
            </button>
          </div>
        )}

        {/* VAIHE 3: Video katsottu -> Käynnistetään kello ja siirrytään pulmaan */}
        {phase === 'ready' && (
          <div className="p-6 bg-stone-950 border-t-2 border-amber-600 text-center space-y-3">
            <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider">
              ✓ Signaali katsottu ja rekisteröity
            </div>
            <p className="text-xs text-stone-400">
              Huomio: Henkilökohtainen ajanotto käynnistyy välittömästi alla olevasta painikkeesta.
            </p>
            <button
              disabled={loading}
              onClick={handleProceedToTask}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-400 text-black font-bold uppercase text-xs tracking-wider transition disabled:opacity-50"
            >
              {loading ? 'Käynnistetään ajanottoa...' : 'Siirry ratkaisemaan tehtävää ⏱️'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 6. SIVUTASON KOKOAMINEN (`src/app/task/[id]/page.tsx`)

Näin sivu kytkee yhteen istunnon, videoportin ja varsinaisen minipelin:

```tsx
'use client';

import { useState, useEffect } from 'react';
import TaskGate from '@/components/TaskGate';
import TorqueLock from '@/components/games/TorqueLock'; // Esimerkkipelilaite

export default function TaskPage({ params }: { params: { id: string } }) {
  const [taskStartedAt, setTaskStartedAt] = useState<string | null>(null);
  const [player, setPlayer] = useState<any>(null);

  useEffect(() => {
    const session = localStorage.getItem('varila_player_session');
    if (session) setPlayer(JSON.parse(session));
  }, []);

  // 1. Jos video on katsomatta tai aloitusta ei ole kuitattu: näytetään video
  if (!taskStartedAt) {
    return (
      <main className="min-h-screen bg-stone-950 p-4 flex items-center justify-center">
        {player && (
          <TaskGate
            playerId={player.id}
            nodeKey={params.id}
            title="Insinöörin panssarilukko // 1888"
            videoUrl="https://pub-xxx.r2.dev/node-01-panssarilukko.mp4"
            onTaskStarted={(startedAt) => setTaskStartedAt(startedAt)}
          />
        )}
      </main>
    );
  }

  // 2. Kun video on katsottu ja aloitusaika lukittu palvelimelle: minipeli aukeaa
  return (
    <main className="min-h-screen bg-stone-950 p-4 text-white">
      <div className="max-w-md mx-auto mb-4 flex justify-between items-center text-xs text-amber-500 font-mono border-b border-stone-800 pb-2">
        <span>TUTKIJA: {player?.name}</span>
        <span className="text-emerald-400 animate-pulse">⏱️ AJANOTTO KÄYNNISSÄ</span>
      </div>

      <TorqueLock
        onSolve={async (code) => {
          const res = await fetch('/api/check-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              playerId: player.id,
              nodeKey: params.id,
              inputCode: code,
            }),
          });
          const result = await res.json();
          alert(result.message);
        }}
      />
    </main>
  );
}
```

---

## 7. YHTEENVETO ANTIGRAVITYLLE

1. **Ei kosketusta NFC-tunnisteisiin tai kenttäskannereihin.**
2. **Käyttäjän klikkaus aloittaa aina toiston** (mobiili-videotuki taattu).
3. **Kello tikittää vasta videon jälkeen** palvelimen luvalla (`started_at`).
4. **Vastaukset tarkistetaan palvelimella** (`/api/check-code`), joka laskee erotuksen ja jakaa pisteet 100/85/70/50 p.
