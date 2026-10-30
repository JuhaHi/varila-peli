'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Shield,
  KeyRound,
  CheckCircle2,
  XCircle,
  Share2,
  MessageCircle,
  RefreshCw,
  AlertTriangle,
  Play,
  RotateCcw,
  Users,
  Trophy,
  ArrowLeft,
  Copy,
  Check,
  Film,
  Upload,
  Save,
} from 'lucide-react';
import { GameNode, Player, TaskAttempt } from '@/lib/types';
import { soundFX } from '@/lib/audio';

const ADMIN_SOLUTION_GUIDE: Record<
  string,
  {
    steps: { label: string; answer: string }[];
    acceptedCodes: string[];
    tip?: string;
  }
> = {
  'NODE-01': {
    steps: [
      { label: 'Vaihe 1 – Hammasratasparin välityssuhde (i)', answer: '3 (lasku: z₂ / z₁ = 54 / 18 = 3)' },
      { label: 'Vaihe 2 – Pääakselin vääntömomentti (M₂)', answer: '382 Nm (lasku: 3 × 127.33 Nm = 382 Nm)' },
    ],
    acceptedCodes: ['382NM', '382'],
    tip: 'Voiteluöljyläikkä peittää hammasluvut z₁ = 18 ja z₂ = 54. Pyyhi läikkä sormella tai paina "Puhdista öljyläikkä".',
  },
  'NODE-02': {
    steps: [
      { label: 'Mustetahrat (UV-lampulla)', answer: 'Tahra I (Kaura): 154.20 | Tahra II (Siemenvilja): 203.35 | Tahra III: Tase-ero = Debet − Kredit' },
      { label: 'Vaihe 1 – Debet-sarake yhteensä', answer: '854.70 (lasku: 420.00 + 280.50 + 154.20)' },
      { label: 'Vaihe 2 – Kredit-sarake yhteensä', answer: '711.85 (lasku: 310.00 + 198.50 + 203.35)' },
      { label: 'Vaihe 3 – Kappalaisen kavaltama tase-erotus', answer: '142.85 (lasku: 854.70 − 711.85)' },
    ],
    acceptedCodes: ['142.85', '142,85'],
    tip: 'Pelaaja voi napauttaa suoraan tahrarivejä tai painaa "Paljasta kaikki 3 mustetahraa kerralla".',
  },
  'NODE-03': {
    steps: [
      { label: 'Vaihe 1 – Akselin kierrekoko (leveys 48 mm)', answer: 'M48 (48 mm)' },
      { label: 'Vaihe 2 – Höyrypaineen taso', answer: '12 bar (Nuoramoisten nousu 1888)' },
    ],
    acceptedCodes: ['AKSELI-48-1888', 'LAKKO-1905', 'M48-12BAR'],
    tip: 'Valitse kahdesta pudotusvalikosta M48 ja 12 bar, jolloin salakoodi AKSELI-48-1888 täyttyy automaattisesti.',
  },
  'NODE-04': {
    steps: [
      { label: 'Vaihe 1 – Korjattu suuntapiiru', answer: '135 (lasku: 180° − 45° = 135° Kaakko)' },
      { label: 'Vaihe 2 – Kokonaismatka kätkölle (m)', answer: '460 (lasku: 280 + 125 + 55 = 460 m)' },
    ],
    acceptedCodes: ['PIONEERI-460', '460'],
    tip: 'Laske kolmen marssiosuuden metrit yhteen (280 + 125 + 55 = 460).',
  },
  'NODE-05': {
    steps: [
      { label: 'Vaihe 1 – Valittavat 2 kuumeharhaa', answer: '19. lokakuuta (kirkontorni käveli) JA 32. lokakuuta (elohopeavesi)' },
      { label: 'Vaihe 2 – 3 todellisen merkinnän päivien summa', answer: '65 (lasku: 12 + 24 + 29 = 65)' },
    ],
    acceptedCodes: ['HARHA-1888', '1888'],
    tip: 'Merkitse harhoiksi vain 19.10. ja 32.10. Todelliset päivät ovat 12.10., 24.10. ja 29.10.',
  },
  'NODE-06': {
    steps: [
      { label: 'Vaihe 1 – Lämpimän turvapaikan esine (1 sana)', answer: 'LEIVINUUNI (Renkituvan leivinuuni, +28 °C)' },
      { label: 'Vaihe 2 – Turvahuoneen numero (keskiarvo)', answer: '18 (lasku: (14 + 22) / 2 = 18)' },
    ],
    acceptedCodes: ['LEIVINUUNI-18', 'SYSMA-61.42-1888', '61.42'],
    tip: 'Myös pelkkä "UUNI" tai "RENKITUPA" hyväksytään 1. vaiheen kenttään.',
  },
  'NODE-07': {
    steps: [
      { label: 'Vaihe 1 – Valeriana officinalis (XVIII)', answer: '18 (tippaa)' },
      { label: 'Vaihe 2 – Mentha piperita (VIII)', answer: '8 (tippaa)' },
      { label: 'Vaihe 3 – Spiritus Vini Fortis (LXXXVIII)', answer: '88 (%)' },
      { label: 'Vaihe 4 – Neutraloiva vasta-aineluku', answer: '70 (lasku: 88 − 18 = 70)' },
    ],
    acceptedCodes: ['ROHDOS-70', 'TINKTUURA-1888'],
    tip: 'Roomalaiset numerot: XVIII = 18, VIII = 8, LXXXVIII = 88. Vasta-aine = 88 − 18 = 70.',
  },
  'NODE-08': {
    steps: [
      { label: 'Vaihe 1 – 5. silmukan lankaväri (symmetrinen)', answer: 'Krappipunainen (Pun-Pellava-Pun-❖-Pun-Pellava-Pun)' },
      { label: 'Vaihe 2 – Aloitussilmukat yhteensä (4 × 16)', answer: '64' },
      { label: 'Vaihe 3 – Kantalapun silmukat (puikot I ja IV kavennuksen jälkeen)', answer: '24 (lasku: (16 − 4) + (16 − 4) = 12 + 12 = 24)' },
    ],
    acceptedCodes: ['SILMUKKA-24', 'KATE-24', '24'],
    tip: 'Puikoilla I ja IV on aluksi 16 silmukkaa kummallakin. Kun molemmilta kavennetaan 4 silmukkaa, jää 12 + 12 = 24.',
  },
  'NODE-09': {
    steps: [
      { label: 'Vaihe 1 – Tasapainomittarin pito vihreällä (42–58 %)', answer: 'Pidä 4.0 sekunnin ajan kallistamalla ⬅️ Vasemmalle / Oikealle ➡️' },
    ],
    acceptedCodes: ['STUNT-VAKAUS'],
    tip: 'Jos mittari karkaa vasemmalle (< 50 %), paina Oikealle (+8 %). Jos se karkaa oikealle (> 50 %), paina Vasemmalle (−8 %).',
  },
  'NODE-10': {
    steps: [
      { label: 'Vaihe 1 – Kerää kaikki 3 kirvestä (🪓) ja mene pokaalille (🏆)', answer: 'Reitti: Alas → Alas → Oikealle → Oikealle → Alas → Oikealle' },
    ],
    acceptedCodes: ['KIRVES-CHAMP'],
    tip: 'Ruudukko: (0,0)🟢 → (1,0)🪓 → (2,0) → (2,1)🪓 → (2,2) → (3,2)🪓 → (3,3)🏆. Varo esteitä 🛑!',
  },
  'NODE-11': {
    steps: [
      { label: 'Vaihe 1 – Valitse kaikki märät lätäköt (💦)', answer: 'Valitse kaikki 7 vesilätäkköä (älä valitse porraskiveä 🪨 tai kynnysmattoa 🟫)' },
      { label: 'Vaihe 2 – Lätäköiden kokonaismäärä', answer: '7' },
    ],
    acceptedCodes: ['7', 'VARILA-SINETTI-1888'],
    tip: 'Ruudukossa on 9 kohtaa: 7 märkää lätäkköä (💦) ja 2 kuivaa estettä (Nro 3 porraskivi ja Nro 7 kynnysmatto).',
  },
};

export default function AdminPage() {
  const [adminPin, setAdminPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [nodes, setNodes] = useState<GameNode[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [recentSolves, setRecentSolves] = useState<TaskAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [videoDrafts, setVideoDrafts] = useState<Record<string, string>>({});
  const [uploadingNode, setUploadingNode] = useState<string | null>(null);
  const [previewNode, setPreviewNode] = useState<string | null>(null);

  // Aina kun /admin avataan, tyhjennetään vanha istuntomuisti ja vaaditaan PIN-koodi (1888)
  useEffect(() => {
    sessionStorage.removeItem('varila_admin_pin');
    setIsAuthenticated(false);
    setAdminPin('');
  }, []);

  const fetchStats = useCallback(async (pinOverride?: string) => {
    const activePin = pinOverride ?? adminPin ?? '';
    const knownPlayersMap = new Map<string, Player>();
    const allAttempts: TaskAttempt[] = [];
    const baseEpoch = new Date('2026-10-30T13:51:30.000Z').getTime();
    let minEpoch = baseEpoch;

    if (typeof window !== 'undefined') {
      const localReset = Number(localStorage.getItem('varila_reset_at') || 0);
      if (localReset > minEpoch) minEpoch = localReset;

      try {
        const rawKnown = localStorage.getItem('varila_known_players');
        if (rawKnown) {
          const parsed: Player[] = JSON.parse(rawKnown);
          for (const p of parsed) {
            if (!p || !p.id || !p.name) continue;
            const createdT = p.created_at ? new Date(p.created_at).getTime() : 0;
            if (createdT && createdT < minEpoch) continue;
            knownPlayersMap.set(p.id, p);
          }
        }
      } catch {
        // ignore
      }
      const storedId = localStorage.getItem('varila_player_id');
      const storedName = localStorage.getItem('varila_player_name');
      const loginAt = Number(localStorage.getItem('varila_login_at') || 0);
      if (storedId && storedName && loginAt >= minEpoch && !knownPlayersMap.has(storedId)) {
        knownPlayersMap.set(storedId, {
          id: storedId,
          name: storedName,
          total_score: 0,
          created_at: new Date(loginAt).toISOString(),
        });
      }
      for (const pid of Array.from(knownPlayersMap.keys())) {
        try {
          const rawAtt = localStorage.getItem(`varila_attempts_${pid}`);
          if (rawAtt) {
            const parsedAtt: TaskAttempt[] = JSON.parse(rawAtt);
            const validAtt = parsedAtt.filter((a) => {
              if (!a || a.player_id !== pid) return false;
              const startT = a.started_at ? new Date(a.started_at).getTime() : 0;
              return !startT || startT >= minEpoch;
            });
            allAttempts.push(...validAtt);
            const totalScore = validAtt
              .filter((a) => a.is_completed)
              .reduce((sum, a) => sum + (a.awarded_points || 0), 0);
            const p = knownPlayersMap.get(pid);
            if (p && p.total_score === undefined) {
              p.total_score = totalScore;
            }
          }
        } catch {
          // ignore
        }
      }
    }

    try {
      const [nodesRes, leadRes] = await Promise.all([
        fetch(`/api/admin/toggle-node?pin=${encodeURIComponent(activePin)}`),
        fetch('/api/leaderboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            players: Array.from(knownPlayersMap.values()),
            attempts: allAttempts,
            resetAt: minEpoch,
          }),
        }),
      ]);

      if (nodesRes.ok) {
        const nodesData: GameNode[] = await nodesRes.json();
        let savedStates: Record<string, boolean> = {};
        if (typeof window !== 'undefined') {
          try {
            const raw = localStorage.getItem('varila_node_states');
            if (raw) savedStates = JSON.parse(raw);
          } catch {
            // ignore
          }
        }
        const mergedNodes = nodesData.map((n) =>
          savedStates[n.node_key] !== undefined
            ? { ...n, is_active: Boolean(savedStates[n.node_key]) }
            : n
        );
        setNodes(mergedNodes);
      } else if (nodesRes.status === 401) {
        setIsAuthenticated(false);
        setAuthError('Virheellinen järjestäjän PIN-koodi! Pääsy evätty.');
      }
      if (leadRes.ok) {
        const leadData = await leadRes.json();
        setPlayers(leadData.players || []);
        setRecentSolves(leadData.recent_solves || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, [adminPin]);

  const verifyPin = async (pinToTest: string) => {
    setIsLoading(true);
    setAuthError(null);

    if (pinToTest.trim() !== '1888') {
      soundFX.playFailure();
      setIsAuthenticated(false);
      setIsLoading(false);
      setAuthError('Virheellinen järjestäjän PIN-koodi! Pääsy evätty.');
      return;
    }

    try {
      const res = await fetch(`/api/admin/toggle-node?pin=${encodeURIComponent(pinToTest.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setNodes(data);
        setIsAuthenticated(true);
        soundFX.playSuccess();
        fetchStats(pinToTest.trim());
      } else {
        soundFX.playFailure();
        setIsAuthenticated(false);
        const errData = await res.json().catch(() => ({}));
        setAuthError(errData.error || 'Virheellinen järjestäjän PIN-koodi! Pääsy evätty.');
      }
    } catch {
      soundFX.playFailure();
      setAuthError('Yhteysvirhe järjestelmään.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPin.trim()) {
      setAuthError('Syötä järjestäjän PIN-koodi.');
      return;
    }
    verifyPin(adminPin.trim());
  };

  const handleLogoutAdmin = () => {
    soundFX.playKeyClick();
    sessionStorage.removeItem('varila_admin_pin');
    setAdminPin('');
    setIsAuthenticated(false);
  };

  const handleToggle = async (nodeKey: string, currentStatus: boolean) => {
    soundFX.playKeyClick();
    const newStatus = !currentStatus;
    try {
      const res = await fetch('/api/admin/toggle-node', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeKey,
          isActive: newStatus,
          adminPin,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        soundFX.playSuccess();
        if (typeof window !== 'undefined') {
          try {
            const raw = localStorage.getItem('varila_node_states');
            const states: Record<string, boolean> = raw ? JSON.parse(raw) : {};
            states[nodeKey] = newStatus;
            localStorage.setItem('varila_node_states', JSON.stringify(states));
          } catch {
            // ignore
          }
        }
        setNodes((prev) =>
          prev.map((n) =>
            n.node_key === nodeKey
              ? {
                  ...n,
                  is_active: newStatus,
                  unlocked_at: newStatus ? new Date().toISOString() : null,
                }
              : n
          )
        );
        setActionMessage(`Tehtävä ${nodeKey} ${newStatus ? 'AKTIVOITU RYHMÄLLE' : 'LUKITTU'}!`);
        setTimeout(() => setActionMessage(null), 4000);
      } else {
        soundFX.playFailure();
        alert(data.error || 'Päivitys epäonnistui');
      }
    } catch (err) {
      soundFX.playFailure();
      alert('Yhteysvirhe');
    }
  };

  const handleWhatsAppShare = (node: GameNode) => {
    soundFX.playKeyClick();
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const rawVideo = (videoDrafts[node.node_key] ?? node.video_url ?? '').trim();
    const fullVideoUrl = rawVideo.startsWith('http') ? rawVideo : `${origin}${rawVideo}`;
    const message = `⚠️ HÄLYTYS: Uusi Värilä-anomalia havaittu!\n\nTehtävä "${node.title}" (${node.node_key}) on nyt avattu päätelaitteille ratkottavaksi!\n\n🎬 Anomaliavideo: ${fullVideoUrl}\n🗝️ Avaa arkisto heti osoitteessa: ${origin}`;
    const shareUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(shareUrl, '_blank');
  };

  const handleShareVideoFile = async (node: GameNode) => {
    soundFX.playKeyClick();
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const rawVideo = (videoDrafts[node.node_key] ?? node.video_url ?? '').trim();
    const fullVideoUrl = rawVideo.startsWith('http') ? rawVideo : `${origin}${rawVideo}`;
    const caption = `🎬 TAPAUS VÄRILÄ // ${node.node_key}: ${node.title}\n\nKatso anomaliatallenne ja ratkaise tehtävä arkistopäätteellä: ${origin}`;

    try {
      // Kokeillaan jakaa itse MP4-videotiedosto suoraan (toimii puhelimilla ja tuetuilla selaimilla suoraan WhatsAppiin)
      if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
        setActionMessage(`Valmistellaan tehtävän ${node.node_key} Veo-videota jaettavaksi...`);
        const res = await fetch(fullVideoUrl);
        if (res.ok) {
          const blob = await res.blob();
          const num = node.node_key.replace(/[^0-9]/g, '').padStart(2, '0');
          const videoFile = new File([blob], `varila-node${num}.mp4`, { type: 'video/mp4' });
          if (navigator.canShare({ files: [videoFile] })) {
            setActionMessage(null);
            await navigator.share({
              title: `${node.node_key} – ${node.title}`,
              text: caption,
              files: [videoFile],
            });
            return;
          }
        }
      }
    } catch {
      // Jos käyttäjä peruuttaa tai selain ei tue tiedostojakoa, siirrytään WhatsApp-linkkiin
    }

    setActionMessage(null);
    const shareUrl = `https://wa.me/?text=${encodeURIComponent(`${caption}\n\n▶️ Suora videolinkki: ${fullVideoUrl}`)}`;
    window.open(shareUrl, '_blank');
  };

  const handleCopyLink = (node: GameNode) => {
    soundFX.playKeyClick();
    const host = typeof window !== 'undefined' ? window.location.host : '';
    const protocol = typeof window !== 'undefined' ? window.location.protocol : 'https:';
    const message = `⚠️ HÄLYTYS: Uusi Värilä-anomalia havaittu! Tehtävä "${node.title}" on avattu päätteelle: ${protocol}//${host}`;
    navigator.clipboard.writeText(message);
    setCopiedKey(node.node_key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleSaveVideoUrl = async (nodeKey: string, currentUrl: string) => {
    const newUrl = (videoDrafts[nodeKey] ?? currentUrl).trim();
    if (!newUrl) return;
    soundFX.playKeyClick();
    setUploadingNode(nodeKey);
    try {
      const res = await fetch('/api/admin/upload-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeKey, videoUrl: newUrl, adminPin }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        soundFX.playSuccess();
        setNodes((prev) =>
          prev.map((n) => (n.node_key === nodeKey ? { ...n, video_url: data.videoUrl } : n))
        );
        setActionMessage(`Tehtävän ${nodeKey} videopolku tallennettu: ${data.videoUrl}`);
        setTimeout(() => setActionMessage(null), 4000);
      } else {
        soundFX.playFailure();
        alert(data.error || 'Videopolun tallennus epäonnistui.');
      }
    } catch {
      soundFX.playFailure();
      alert('Yhteysvirhe tallennettaessa videopolkua.');
    } finally {
      setUploadingNode(null);
    }
  };

  const handleUploadVideoFile = async (nodeKey: string, file?: File | null) => {
    if (!file) return;
    soundFX.playKeyClick();
    setUploadingNode(nodeKey);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('nodeKey', nodeKey);
      formData.append('adminPin', adminPin);

      const res = await fetch('/api/admin/upload-video', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        soundFX.playSuccess();
        setNodes((prev) =>
          prev.map((n) => (n.node_key === nodeKey ? { ...n, video_url: data.videoUrl } : n))
        );
        setVideoDrafts((prev) => ({ ...prev, [nodeKey]: data.videoUrl }));
        setActionMessage(
          `Video ladattu tehtävälle ${nodeKey} -> ${data.videoUrl} (muista git push jos julkaiset Verceliin)`
        );
        setTimeout(() => setActionMessage(null), 5000);
      } else {
        soundFX.playFailure();
        alert(data.error || 'Videotiedoston lataus epäonnistui.');
      }
    } catch {
      soundFX.playFailure();
      alert('Yhteysvirhe videotiedoston latauksessa.');
    } finally {
      setUploadingNode(null);
    }
  };

  const handleResetGame = async () => {
    if (!confirm('VAROITUS: Haluatko varmasti nollata kaikkien pelaajien pisteet ja suoritukset?')) {
      return;
    }
    try {
      const res = await fetch('/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminPin }),
      });
      if (res.ok) {
        const resData = await res.json().catch(() => ({}));
        const resetTime = resData.resetAt || Date.now();
        soundFX.playSuccess();
        if (typeof window !== 'undefined') {
          Object.keys(localStorage).forEach((k) => {
            if (k.startsWith('varila_')) localStorage.removeItem(k);
          });
          localStorage.setItem('varila_reset_at', String(resetTime));
        }
        setPlayers([]);
        setRecentSolves([]);
        setNodes((prev) =>
          prev.map((n) => ({ ...n, is_active: false, unlocked_at: null }))
        );
        alert('Peli, tehtävät ja pelaajat alustettu onnistuneesti!');
        fetchStats();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'Nollaus epäonnistui');
      }
    } catch {
      alert('Nollaus epäonnistui');
    }
  };

  // If not logged in as admin
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#070907] text-[#25e24c] font-mono flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0d120d] border-2 border-[#25e24c] rounded-2xl p-6 shadow-[0_0_50px_rgba(37,226,76,0.3)]">
          <div className="flex items-center gap-3 border-b border-[#25e24c]/40 pb-4 mb-5">
            <Shield className="w-8 h-8 text-[#25e24c] animate-pulse" />
            <div>
              <h1 className="text-lg font-bold tracking-widest text-[#25e24c]">
                TAPAUS VÄRILÄ // 1888
              </h1>
              <p className="text-xs text-[#25e24c]/70">ADMIN-HALLINTAPÄÄTE</p>
            </div>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase mb-2 text-[#25e24c]/90">
                Syötä järjestäjän PIN-koodi:
              </label>
              <div className="relative">
                <KeyRound className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-[#25e24c]/60" />
                <input
                  type="password"
                  maxLength={10}
                  autoFocus
                  placeholder="PIN-koodi..."
                  value={adminPin}
                  onChange={(e) => {
                    setAdminPin(e.target.value);
                    if (authError) setAuthError(null);
                  }}
                  className="w-full bg-[#050805] border border-[#25e24c] text-[#25e24c] font-mono text-center tracking-widest text-lg py-3 pl-10 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#25e24c]"
                />
              </div>
              {authError && (
                <p className="text-xs text-red-400 mt-2 font-mono flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{authError}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !adminPin}
              className="w-full bg-[#25e24c] hover:bg-[#1fbd3f] text-black font-bold py-3 px-4 rounded-xl uppercase tracking-wider transition disabled:opacity-50"
            >
              {isLoading ? 'Vahvistetaan...' : 'Kirjaudu Ohjauspaneeliin'}
            </button>

            <div className="text-center pt-2">
              <Link
                href="/"
                className="text-xs text-[#25e24c]/60 hover:text-[#25e24c] underline flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Palaa pelaajan päätteelle</span>
              </Link>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const activeCount = nodes.filter((n) => n.is_active).length;

  return (
    <div className="min-h-screen bg-[#070907] text-[#e0ffe5] font-mono flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-[#25e24c]/40 bg-[#0d120d]/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-[#25e24c]" />
            <div>
              <div className="text-sm font-bold tracking-widest text-[#25e24c] flex items-center gap-2">
                <span>TAPAUS VÄRILÄ // ADMIN</span>
                <span className="text-[10px] bg-[#25e24c]/20 text-[#25e24c] border border-[#25e24c]/40 px-2 py-0.5 rounded-full">
                  PROTOKOLLA 1888
                </span>
              </div>
              <div className="text-[11px] text-[#25e24c]/70">
                Pelinohjaus • WhatsApp-jakokeskus
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchStats()}
              className="bg-[#121c12] hover:bg-[#1b2b1b] text-[#25e24c] border border-[#25e24c]/40 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Päivitä</span>
            </button>
            <button
              onClick={handleLogoutAdmin}
              className="bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-500/40 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
              title="Kirjaudu ulos Admin-paneelista"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lukitse</span>
            </button>
            <Link
              href="/"
              className="bg-[#121c12] hover:bg-[#1b2b1b] text-[#25e24c] border border-[#25e24c]/40 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Pelaajan näkymä</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6 flex-1">
        {/* Banner Alert */}
        {actionMessage && (
          <div className="p-3 bg-[#132c16] border-2 border-[#25e24c] text-[#dcfce7] rounded-xl text-xs font-bold flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-[#25e24c]" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#0d120d] border border-[#25e24c]/40 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-[#25e24c]/70 uppercase">Aktiiviset Tehtävät</div>
              <div className="text-2xl font-bold text-[#25e24c] mt-1">
                {activeCount} / {nodes.length}
              </div>
            </div>
            <Play className="w-8 h-8 text-[#25e24c]/40" />
          </div>

          <div className="bg-[#0d120d] border border-[#25e24c]/40 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-[#25e24c]/70 uppercase">Rekisteröityneet Pelaajat</div>
              <div className="text-2xl font-bold text-[#25e24c] mt-1">{players.length}</div>
            </div>
            <Users className="w-8 h-8 text-[#25e24c]/40" />
          </div>

          <div className="bg-[#0d120d] border border-[#25e24c]/40 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-[#25e24c]/70 uppercase">Hyväksytyt Ratkaisut</div>
              <div className="text-2xl font-bold text-[#25e24c] mt-1">{recentSolves.length}</div>
            </div>
            <Trophy className="w-8 h-8 text-[#25e24c]/40" />
          </div>
        </div>

        {/* 11 Task Nodes Management Cards */}
        <div className="bg-[#0d120d] border border-[#25e24c]/40 rounded-2xl p-4 sm:p-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[#25e24c]/30 mb-5">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#25e24c] flex items-center gap-2">
                <span>11 SUKUMYSTEERIN OHJAUSPANEELI</span>
              </h2>
              <p className="text-xs text-[#25e24c]/70 mt-0.5">
                Aktivoi tehtävä salaa lokakuun aikana ja lähetä heräte WhatsApp-ryhmään yhdellä klikkauksella.
              </p>
            </div>
            <div className="text-xs text-[#25e24c]/60">
              Ajanotto alkaa pelaajalle vasta hänen avatessaan tehtävän!
            </div>
          </div>

          <div className="space-y-4">
            {nodes.map((node, index) => (
              <div
                key={node.node_key}
                className={`p-4 rounded-xl border transition-all ${
                  node.is_active
                    ? 'bg-[#121c12] border-[#25e24c] shadow-[0_0_20px_rgba(37,226,76,0.15)]'
                    : 'bg-[#090d09] border-[#25e24c]/20 opacity-80'
                }`}
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  {/* Left: Info */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold bg-[#25e24c]/20 text-[#25e24c] px-2.5 py-1 rounded border border-[#25e24c]/40">
                        {node.node_key}
                      </span>
                      <span className="text-sm font-bold text-white">
                        {index + 1}. {node.title}
                      </span>
                      {node.is_active ? (
                        <span className="text-[10px] font-bold bg-[#14532d] text-[#86efac] px-2 py-0.5 rounded border border-[#22c55e]">
                          AKTIIVINEN RYHMÄLLE ✓
                        </span>
                      ) : (
                        <span className="text-[10px] bg-[#1c1917] text-[#a8a29e] px-2 py-0.5 rounded border border-[#44403c]">
                          LUKITTU (ODOTTAA)
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-[#25e24c]/80 flex flex-wrap items-center gap-3">
                      <span>🎯 <strong>Kohde:</strong> {node.target_person}</span>
                      <span>🔑 <strong>Salakoodi:</strong> <code className="bg-black px-2 py-0.5 rounded text-amber-300 font-mono font-bold">{node.secret_code || '---'}</code></span>
                      {node.unlocked_at && (
                        <span>⏱️ <strong>Avattu:</strong> {new Date(node.unlocked_at).toLocaleString('fi-FI')}</span>
                      )}
                    </div>

                    {node.role_hint && (
                      <div className="text-[11px] text-[#e0ffe5]/70 italic">
                        💡 {node.role_hint}
                      </div>
                    )}

                    {/* Pelinjohtajan ratkaisuopas & välivaiheet */}
                    {ADMIN_SOLUTION_GUIDE[node.node_key] && (
                      <div className="mt-2 bg-black/75 border border-amber-500/40 rounded-lg p-3 space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/20 pb-1.5">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                            📋 Pelinjohtajan oikeat vastaukset & välivaiheet
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] text-amber-200/70">Hyväksytyt loppukoodit:</span>
                            {ADMIN_SOLUTION_GUIDE[node.node_key].acceptedCodes.map((code) => (
                              <code
                                key={code}
                                className="bg-amber-950/80 border border-amber-500/50 text-amber-200 px-1.5 py-0.5 rounded text-[11px] font-mono font-bold"
                              >
                                {code}
                              </code>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-0.5">
                          {ADMIN_SOLUTION_GUIDE[node.node_key].steps.map((step, sIdx) => (
                            <div
                              key={sIdx}
                              className="bg-[#0b130c] border border-[#25e24c]/25 rounded px-2.5 py-1.5 text-xs"
                            >
                              <div className="text-[10px] text-[#25e24c]/75 font-semibold">
                                {step.label}:
                              </div>
                              <div className="text-white font-mono font-bold mt-0.5">
                                {step.answer}
                              </div>
                            </div>
                          ))}
                        </div>

                        {ADMIN_SOLUTION_GUIDE[node.node_key].tip && (
                          <div className="text-[11px] text-amber-200/80 pt-0.5">
                            🧭 <strong>Vinkki pelaajalle:</strong> {ADMIN_SOLUTION_GUIDE[node.node_key].tip}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Video Management Row */}
                    <div className="pt-2 mt-2 border-t border-[#25e24c]/20 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Film className="w-3.5 h-3.5 text-[#25e24c] shrink-0" />
                        <span className="text-[11px] font-bold text-[#25e24c]">Video:</span>
                        <input
                          type="text"
                          value={videoDrafts[node.node_key] ?? node.video_url ?? ''}
                          onChange={(e) =>
                            setVideoDrafts((prev) => ({
                              ...prev,
                              [node.node_key]: e.target.value,
                            }))
                          }
                          placeholder="/videos/node01.mp4 tai https://pub-xxx.r2.dev/..."
                          className="flex-1 min-w-[210px] bg-black/80 border border-[#25e24c]/40 rounded px-2.5 py-1 text-xs text-[#e0ffe5] font-mono focus:outline-none focus:border-[#25e24c]"
                        />
                        <button
                          type="button"
                          disabled={uploadingNode === node.node_key}
                          onClick={() => handleSaveVideoUrl(node.node_key, node.video_url)}
                          className="bg-[#162a19] hover:bg-[#1f3d24] text-[#86efac] border border-[#25e24c]/50 text-[11px] font-bold px-2.5 py-1 rounded flex items-center gap-1 transition disabled:opacity-50"
                          title="Tallenna videon osoite"
                        >
                          <Save className="w-3 h-3" />
                          <span>Tallenna URL</span>
                        </button>

                        <label className="cursor-pointer bg-[#1e293b] hover:bg-[#334155] text-sky-300 border border-sky-500/50 text-[11px] font-bold px-2.5 py-1 rounded flex items-center gap-1 transition">
                          <Upload className="w-3 h-3" />
                          <span>
                            {uploadingNode === node.node_key ? 'Ladataan...' : 'Valitse MP4 koneelta'}
                          </span>
                          <input
                            type="file"
                            accept="video/mp4,video/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleUploadVideoFile(node.node_key, f);
                              e.target.value = '';
                            }}
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() =>
                            setPreviewNode((prev) =>
                              prev === node.node_key ? null : node.node_key
                            )
                          }
                          className="bg-black/60 hover:bg-black text-amber-300 border border-amber-500/40 text-[11px] px-2.5 py-1 rounded transition"
                        >
                          {previewNode === node.node_key ? 'Sulje esikatselu' : '▶ Esikatsele'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleShareVideoFile(node)}
                          className="bg-[#14532d] hover:bg-[#166534] text-[#86efac] border border-[#22c55e]/60 text-[11px] font-bold px-2.5 py-1 rounded flex items-center gap-1 transition"
                          title="Lähetä tämän tehtävän Veo-video suoraan WhatsAppiin"
                        >
                          <Share2 className="w-3 h-3" />
                          <span>Lähetä Veo-video (WA)</span>
                        </button>
                      </div>

                      {previewNode === node.node_key && (
                        <div className="bg-black rounded-lg p-2 border border-[#25e24c]/30 max-w-md">
                          <video
                            src={videoDrafts[node.node_key] ?? node.video_url}
                            controls
                            autoPlay
                            playsInline
                            className="w-full aspect-video rounded bg-black object-contain"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto shrink-0">
                    {/* Toggle Button */}
                    <button
                      onClick={() => handleToggle(node.node_key, node.is_active)}
                      className={`text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 transition uppercase ${
                        node.is_active
                          ? 'bg-red-950/70 hover:bg-red-900 text-red-200 border border-red-500'
                          : 'bg-[#25e24c] hover:bg-[#1fbd3f] text-black font-extrabold shadow-lg'
                      }`}
                    >
                      {node.is_active ? (
                        <>
                          <XCircle className="w-4 h-4" />
                          <span>Sulje Tehtävä</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          <span>Aktivoi Ryhmälle</span>
                        </>
                      )}
                    </button>

                    {/* WhatsApp Broadcast Button (appears when active) */}
                    {node.is_active && (
                      <>
                        <button
                          onClick={() => handleWhatsAppShare(node)}
                          className="bg-[#25D366] hover:bg-[#20ba59] text-black font-extrabold text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-lg transition"
                          title="Lähetä WhatsApp-ryhmään"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Jaa WhatsAppiin</span>
                        </button>

                        <button
                          onClick={() => handleCopyLink(node)}
                          className="bg-[#121c12] hover:bg-[#1b2b1b] text-[#25e24c] border border-[#25e24c]/40 text-xs px-3 py-2.5 rounded-lg flex items-center gap-1.5 transition"
                          title="Kopioi teksti leikepöydälle"
                        >
                          {copiedKey === node.node_key ? (
                            <>
                              <Check className="w-4 h-4 text-[#86efac]" />
                              <span>Kopioitu!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span>Kopioi</span>
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard & Solves Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Players Table */}
          <div className="bg-[#0d120d] border border-[#25e24c]/40 rounded-2xl p-4 sm:p-5">
            <h3 className="text-sm font-bold text-[#25e24c] flex items-center gap-2 mb-3 pb-2 border-b border-[#25e24c]/30 uppercase">
              <Trophy className="w-4 h-4" />
              <span>Pelaajien Pistetaulukko ({players.length})</span>
            </h3>
            {players.length === 0 ? (
              <p className="text-xs text-[#25e24c]/60 py-4 text-center">Ei vielä rekisteröityneitä pelaajia.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[#25e24c]/70 border-b border-[#25e24c]/20">
                    <tr>
                      <th className="py-2">#</th>
                      <th className="py-2">Nimi</th>
                      <th className="py-2 text-right">Pisteet</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#25e24c]/10">
                    {players.map((p, idx) => (
                      <tr key={p.id} className="hover:bg-[#121c12]">
                        <td className="py-2 font-bold text-[#25e24c]/60">#{idx + 1}</td>
                        <td className="py-2 font-bold text-white">{p.name}</td>
                        <td className="py-2 text-right font-bold text-[#25e24c]">{p.total_score} p</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent Solves Feed */}
          <div className="bg-[#0d120d] border border-[#25e24c]/40 rounded-2xl p-4 sm:p-5">
            <h3 className="text-sm font-bold text-[#25e24c] flex items-center gap-2 mb-3 pb-2 border-b border-[#25e24c]/30 uppercase">
              <CheckCircle2 className="w-4 h-4" />
              <span>Viimeisimmät Suoritukset ({recentSolves.length})</span>
            </h3>
            {recentSolves.length === 0 ? (
              <p className="text-xs text-[#25e24c]/60 py-4 text-center">Ei vielä suorituksia.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {recentSolves.map((s) => (
                  <div key={s.id} className="p-2.5 bg-[#090d09] border border-[#25e24c]/20 rounded-lg text-xs flex items-center justify-between">
                    <div>
                      <strong className="text-white">{s.player_name}</strong>
                      <span className="text-[#25e24c]/60"> ratkaisi </span>
                      <strong className="text-[#25e24c]">{s.node_key}</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-amber-300 font-bold">+{s.awarded_points}p</span>
                      <span className="text-[#25e24c]/60 text-[10px] block">
                        {s.duration_seconds}s
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-[#140b0b] border border-red-700/60 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold text-red-400 uppercase flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Vaara-alue // Pelin Palautus</span>
            </h4>
            <p className="text-[11px] text-red-300/70 mt-0.5">
              Nollaa pelaajat, suoritukset ja lukitsee tehtävät takaisin alkutilaan.
            </p>
          </div>
          <button
            onClick={handleResetGame}
            className="bg-red-950 hover:bg-red-900 text-red-200 border border-red-600 text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Nollaa Koko Peli</span>
          </button>
        </div>
      </main>
    </div>
  );
}
