'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Compass,
  CheckCircle2,
  Lock,
  Trophy,
  Settings,
  Timer as TimerIcon,
  AlertTriangle,
  Send,
  Key,
  Film,
  Sparkles,
  ExternalLink,
  Shield,
  Play,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GameNode, Player, TaskAttempt } from '@/lib/types';
import { soundFX } from '@/lib/audio';
import { Header } from '@/components/Header';
import { PlayerRegistrationModal } from '@/components/PlayerRegistrationModal';
import { VideoTeaserPlayer } from '@/components/VideoTeaserPlayer';
import { SealAssemblyProgress } from '@/components/SealAssemblyProgress';
import { LeaderboardTab } from '@/components/LeaderboardTab';
import { TaskGate } from '@/components/TaskGate';

// Puzzles
import { ArmoredLockCadPuzzle } from '@/components/puzzles/ArmoredLockCadPuzzle';
import { ViljatasePuzzle } from '@/components/puzzles/ViljatasePuzzle';
import { AskoPuzzle } from '@/components/puzzles/AskoPuzzle';
import { HeinolaPuzzle } from '@/components/puzzles/HeinolaPuzzle';
import { RadioScanner } from '@/components/puzzles/RadioScanner';
import { StuntPyramidiPuzzle } from '@/components/puzzles/StuntPyramidiPuzzle';
import { NuoramoinenChest } from '@/components/puzzles/NuoramoinenChest';
import {
  PioneeriPuzzle,
  AikajanaHarhatPuzzle,
  OrpopojanTraumakarttaPuzzle,
  TullikatePuzzle,
  PikselikirvesPuzzle,
  KuraisetLatakotPuzzle,
} from '@/components/puzzles/RemainingNodesPuzzles';

export default function TerminalPage() {
  const [activeView, setActiveView] = useState<'quest' | 'leaderboard'>('quest');
  const [nodes, setNodes] = useState<GameNode[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [recentSolves, setRecentSolves] = useState<TaskAttempt[]>([]);
  const [playerAttempts, setPlayerAttempts] = useState<TaskAttempt[]>([]);

  // Player state (stored in localStorage)
  const [activePlayerId, setActivePlayerId] = useState<string | null>(null);
  const [activePlayerName, setActivePlayerName] = useState<string>('');
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [canCloseRegistration, setCanCloseRegistration] = useState(false);

  // Audio & visual settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [crtEnabled, setCrtEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  // Active selected node
  const [selectedNodeKey, setSelectedNodeKey] = useState<string>('NODE-01');

  // Active puzzle input and timer state
  const [inputCode, setInputCode] = useState<string>('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'bonus'; message: string } | null>(null);

  // Penalty lockout state (3 strikes = 45s lockout)
  const [errorCount, setErrorCount] = useState<number>(0);
  const [lockoutDeadline, setLockoutDeadline] = useState<number>(0);
  const [nowTime, setNowTime] = useState<number>(Date.now());

  // Master clock for accurate stopwatch & penalty cooldown
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Initial mount: load player from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem('varila_player_id');
      const storedName = localStorage.getItem('varila_player_name');

      if (storedId && storedName) {
        setActivePlayerId(storedId);
        setActivePlayerName(storedName);
        setRegistrationOpen(false);
      } else {
        setRegistrationOpen(true);
        setCanCloseRegistration(false);
      }
    }
  }, []);

  // Helper to collect local players & attempts for serverless sync
  const getLocalSyncPayload = useCallback(() => {
    if (typeof window === 'undefined') return { players: [], attempts: [], resetAt: 0 };
    const baseEpoch = new Date('2026-10-30T13:51:30.000Z').getTime();
    const localReset = Number(localStorage.getItem('varila_reset_at') || 0);
    const minEpoch = Math.max(baseEpoch, localReset);

    const knownPlayersMap = new Map<string, Player>();
    try {
      const rawKnown = localStorage.getItem('varila_known_players');
      if (rawKnown) {
        const parsed: Player[] = JSON.parse(rawKnown);
        const validKnown: Player[] = [];
        for (const p of parsed) {
          if (!p || !p.id || !p.name) continue;
          const createdT = p.created_at ? new Date(p.created_at).getTime() : 0;
          if (createdT && createdT < minEpoch) continue;
          knownPlayersMap.set(p.id, p);
          validKnown.push(p);
        }
        if (validKnown.length !== parsed.length) {
          localStorage.setItem('varila_known_players', JSON.stringify(validKnown));
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

    const allAttempts: TaskAttempt[] = [];
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
          if (validAtt.length !== parsedAtt.length) {
            localStorage.setItem(`varila_attempts_${pid}`, JSON.stringify(validAtt));
          }
          allAttempts.push(...validAtt);
          const p = knownPlayersMap.get(pid);
          if (p && p.total_score === undefined) {
            const totalScore = validAtt
              .filter((a) => a.is_completed)
              .reduce((sum, a) => sum + (a.awarded_points || 0), 0);
            p.total_score = totalScore;
          }
        }
      } catch {
        // ignore
      }
    }

    return {
      players: Array.from(knownPlayersMap.values()),
      attempts: allAttempts,
      resetAt: minEpoch,
    };
  }, []);

  // Fetch nodes, leaderboard, and attempts
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const syncPayload = getLocalSyncPayload();
      let savedNodeStates: Record<string, boolean> | undefined = undefined;
      if (typeof window !== 'undefined') {
        try {
          const rawStates = localStorage.getItem('varila_node_states');
          if (rawStates) savedNodeStates = JSON.parse(rawStates);
        } catch {
          // ignore
        }
      }

      const [nodesRes, leadRes] = await Promise.all([
        fetch('/api/nodes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nodeStates: savedNodeStates }),
        }),
        fetch('/api/leaderboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(syncPayload),
        }),
      ]);

      if (nodesRes.ok) {
        const nodesData: GameNode[] = await nodesRes.json();
        const mergedNodes = savedNodeStates
          ? nodesData.map((n) =>
              savedNodeStates![n.node_key] !== undefined
                ? { ...n, is_active: Boolean(savedNodeStates![n.node_key]) }
                : n
            )
          : nodesData;
        setNodes(mergedNodes);
      }
      if (leadRes.ok) {
        const leadData = await leadRes.json();
        if (typeof window !== 'undefined' && leadData.reset_at) {
          const localReset = Number(localStorage.getItem('varila_reset_at') || 0);
          if (leadData.reset_at > localReset) {
            localStorage.setItem('varila_reset_at', String(leadData.reset_at));
            const loginAt = Number(localStorage.getItem('varila_login_at') || 0);
            if (loginAt && loginAt < leadData.reset_at) {
              Object.keys(localStorage).forEach((k) => {
                if (k.startsWith('varila_attempts_') || k === 'varila_known_players') {
                  localStorage.removeItem(k);
                }
              });
              setPlayerAttempts([]);
            }
          }
        }
        const serverPlayers: Player[] = leadData.players || [];
        setPlayers(serverPlayers);
        setRecentSolves(leadData.recent_solves || []);

        // Synkronoidaan palvelimen laskemat suhteelliset pisteet aktiivisen pelaajan suorituksiin
        if (activePlayerId && Array.isArray(leadData.recent_solves)) {
          setPlayerAttempts((prev) => {
            let changed = false;
            const updated = prev.map((att) => {
              if (att.player_id !== activePlayerId) return att;
              const serverMatch = leadData.recent_solves.find(
                (s: TaskAttempt) =>
                  s.player_id === activePlayerId &&
                  s.node_key.toUpperCase() === att.node_key.toUpperCase() &&
                  s.is_completed
              );
              if (serverMatch && serverMatch.awarded_points !== undefined && serverMatch.awarded_points !== att.awarded_points) {
                changed = true;
                return { ...att, awarded_points: serverMatch.awarded_points };
              }
              return att;
            });
            if (changed && typeof window !== 'undefined') {
              localStorage.setItem(`varila_attempts_${activePlayerId}`, JSON.stringify(updated));
            }
            return updated;
          });
        }
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getLocalSyncPayload]);

  const fetchPlayerAttempts = useCallback(async (playerId: string) => {
    const baseEpoch = new Date('2026-10-30T13:51:30.000Z').getTime();
    let minEpoch = baseEpoch;
    let localSaved: TaskAttempt[] = [];
    if (typeof window !== 'undefined') {
      const localReset = Number(localStorage.getItem('varila_reset_at') || 0);
      if (localReset > minEpoch) minEpoch = localReset;
      try {
        const raw = localStorage.getItem(`varila_attempts_${playerId}`);
        if (raw) {
          const parsed: TaskAttempt[] = JSON.parse(raw);
          // TÄRKEÄ SUODATUS: Pidä vain tämän pelaajan omat JA nollauksen jälkeiset suoritukset
          localSaved = parsed.filter((a) => {
            if (!a || a.player_id !== playerId) return false;
            const startT = a.started_at ? new Date(a.started_at).getTime() : 0;
            return !startT || startT >= minEpoch;
          });
          if (localSaved.length !== parsed.length) {
            localStorage.setItem(`varila_attempts_${playerId}`, JSON.stringify(localSaved));
          }
        }
      } catch {
        // ignore
      }
    }

    try {
      const res = await fetch(`/api/attempts?playerId=${encodeURIComponent(playerId)}`);
      if (res.ok) {
        const serverAttempts: TaskAttempt[] = (await res.json()).filter(
          (sa: TaskAttempt) => sa && sa.player_id === playerId
        );
        setPlayerAttempts((prev) => {
          const map = new Map<string, TaskAttempt>();
          const ownPrev = prev.filter((a) => a && a.player_id === playerId);
          for (const a of [...localSaved, ...ownPrev]) {
            map.set(a.node_key.toUpperCase(), a);
          }
          for (const sa of serverAttempts) {
            const key = sa.node_key.toUpperCase();
            const existing = map.get(key);
            if (!existing || sa.is_completed || !existing.is_completed) {
              map.set(key, sa);
            }
          }
          const merged = Array.from(map.values());
          if (typeof window !== 'undefined') {
            localStorage.setItem(`varila_attempts_${playerId}`, JSON.stringify(merged));
          }
          return merged;
        });
        return;
      }
    } catch (err) {
      console.error('Attempts error:', err);
    }

    setPlayerAttempts(localSaved);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (activePlayerId) {
      fetchPlayerAttempts(activePlayerId);
    }
  }, [activePlayerId, fetchPlayerAttempts]);

  const showNotification = (message: string, type: 'success' | 'error' | 'bonus' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 6000);
  };

  const handlePlayerRegistered = (player: Player) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('varila_player_id', player.id);
      localStorage.setItem('varila_player_name', player.name);
      localStorage.setItem('varila_login_at', String(Date.now()));
      try {
        const rawKnown = localStorage.getItem('varila_known_players');
        const known: Player[] = rawKnown ? JSON.parse(rawKnown) : [];
        const filtered = known.filter(
          (p) => p && p.id !== player.id && p.name.toLowerCase() !== player.name.toLowerCase()
        );
        filtered.push(player);
        localStorage.setItem('varila_known_players', JSON.stringify(filtered));
      } catch {
        // ignore
      }
    }

    // Ladataan heti pelaajan aiemmat tallennetut suoritukset
    let existingAttempts: TaskAttempt[] = [];
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(`varila_attempts_${player.id}`);
        if (raw) {
          existingAttempts = JSON.parse(raw);
        } else {
          // Tarkistetaan löytyykö samannimiselle pelaajalle toisella id:llä tallennettuja suorituksia
          const rawKnown = localStorage.getItem('varila_known_players');
          if (rawKnown) {
            const known: Player[] = JSON.parse(rawKnown);
            const oldMatch = known.find((k) => k.name.toLowerCase() === player.name.toLowerCase());
            if (oldMatch && oldMatch.id !== player.id) {
              const oldRaw = localStorage.getItem(`varila_attempts_${oldMatch.id}`);
              if (oldRaw) {
                const oldAtt: TaskAttempt[] = JSON.parse(oldRaw);
                existingAttempts = oldAtt.map((a) => ({ ...a, player_id: player.id }));
                localStorage.setItem(`varila_attempts_${player.id}`, JSON.stringify(existingAttempts));
              }
            }
          }
        }
      } catch {
        // ignore
      }
    }

    setPlayerAttempts(existingAttempts);
    setInputCode('');
    setErrorCount(0);
    setLockoutDeadline(0);
    setActivePlayerId(player.id);
    setActivePlayerName(player.name);
    setPlayers((prev) => (prev.some((p) => p.id === player.id) ? prev : [...prev, player]));
    setRegistrationOpen(false);
    showNotification(`Tervetuloa tutkintaan, ${player.name}!`, 'success');
    fetchPlayerAttempts(player.id);
    fetchData();
  };

  // Find solved node keys for this player ONLY
  const solvedNodeKeys = playerAttempts
    .filter((a) => a.player_id === activePlayerId && a.is_completed)
    .map((a) => a.node_key);

  // Active current node: the selected node or first active unsolved node
  const selectedNodeObj = nodes.find((n) => n.node_key === selectedNodeKey);
  const firstActiveUnsolved = nodes.find(
    (n) => n.is_active && !solvedNodeKeys.includes(n.node_key)
  );
  const activeNode: GameNode | undefined =
    selectedNodeObj && selectedNodeObj.is_active
      ? selectedNodeObj
      : firstActiveUnsolved || selectedNodeObj || nodes[0];

  // Auto-poll every 6s when waiting for Admin to unlock a task
  useEffect(() => {
    if (activeNode?.is_active) return;
    const pollTimer = setInterval(() => {
      fetchData();
    }, 6000);
    return () => clearInterval(pollTimer);
  }, [activeNode?.is_active, fetchData]);

  const currentAttempt = playerAttempts.find(
    (a) =>
      a.player_id === activePlayerId &&
      a.node_key.toUpperCase() === (activeNode?.node_key || '').toUpperCase()
  );

  const isCurrentSolved = Boolean(currentAttempt?.is_completed || (activeNode && solvedNodeKeys.includes(activeNode.node_key)));

  // Lasketaan aktiivisen pelaajan pistemäärä myös paikallisista ratkaistuista tehtävistä,
  // jotta yläpalkin pisteet ja Pistetilanne päivittyvät välittömästi
  const activePlayerLocalScore = playerAttempts
    .filter((a) => a.player_id === activePlayerId && a.is_completed)
    .reduce((sum, a) => sum + (a.awarded_points || 0), 0);

  const displayPlayers: Player[] = (() => {
    const map = new Map<string, Player>();
    for (const p of players) {
      map.set(p.id, { ...p });
    }
    const localSync = getLocalSyncPayload();
    for (const lp of localSync.players) {
      const existing = Array.from(map.values()).find(
        (x) => x.id === lp.id || x.name.toLowerCase() === lp.name.toLowerCase()
      );
      if (!existing) {
        map.set(lp.id, { ...lp });
      }
    }
    if (activePlayerId && activePlayerName) {
      const existing = Array.from(map.values()).find(
        (x) => x.id === activePlayerId || x.name.toLowerCase() === activePlayerName.toLowerCase()
      );
      if (!existing) {
        map.set(activePlayerId, {
          id: activePlayerId,
          name: activePlayerName,
          total_score: activePlayerLocalScore,
          created_at: new Date().toISOString(),
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.total_score - a.total_score);
  })();

  const displaySolves: TaskAttempt[] = (() => {
    const list = [...recentSolves];
    for (const att of playerAttempts) {
      if (att.player_id === activePlayerId && att.is_completed) {
        const exists = list.some(
          (s) =>
            s.player_id === att.player_id &&
            s.node_key.toUpperCase() === att.node_key.toUpperCase()
        );
        if (!exists) {
          list.unshift({
            ...att,
            player_name: activePlayerName || 'Pelaaja',
          });
        }
      }
    }
    return list;
  })();

  // TaskGate callback: triggered ONLY after teaser video is watched and user clicks "Siirry ratkaisemaan tehtävää"
  const handleTaskGateStarted = (startedAt: string) => {
    if (!activeNode) return;
    const pid = activePlayerId || 'local-player';
    const newAttempt: TaskAttempt = {
      id: `att-${Date.now()}`,
      player_id: pid,
      node_key: activeNode.node_key,
      started_at: startedAt,
      completed_at: null,
      duration_seconds: null,
      awarded_points: 0,
      is_completed: false,
    };
    setPlayerAttempts((prev) => {
      const updated = [
        ...prev.filter((a) => a.node_key.toUpperCase() !== activeNode.node_key.toUpperCase()),
        newAttempt,
      ];
      if (typeof window !== 'undefined') {
        localStorage.setItem(`varila_attempts_${pid}`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  // Calculate elapsed seconds from server-recorded started_at
  const elapsedSeconds = (() => {
    if (!currentAttempt) return 0;
    if (currentAttempt.is_completed && currentAttempt.duration_seconds !== null && currentAttempt.duration_seconds !== undefined) {
      return currentAttempt.duration_seconds;
    }
    const startTime = new Date(currentAttempt.started_at).getTime();
    return Math.max(0, Math.floor((nowTime - startTime) / 1000));
  })();

  // Check code submission
  const handleSubmitCode = async (codeToVerify?: string) => {
    if (!activePlayerId || !activeNode) {
      setRegistrationOpen(true);
      return;
    }

    if (lockoutDeadline > nowTime) {
      const remaining = Math.ceil((lockoutDeadline - nowTime) / 1000);
      soundFX.playFailure();
      showNotification(`🚨 Aikasakko käynnissä! Odota vielä ${remaining}s ennen seuraavaa yritystä.`, 'error');
      return;
    }

    const code = (codeToVerify || inputCode).trim();
    if (!code) {
      showNotification('Syötä koodi ennen vahvistusta.', 'error');
      return;
    }

    soundFX.playKeyClick();
    try {
      const res = await fetch('/api/check-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: activePlayerId,
          playerName: activePlayerName,
          nodeKey: activeNode.node_key,
          inputCode: code,
          startedAt: currentAttempt?.started_at,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        soundFX.playSuccess();
        confetti({
          particleCount: 140,
          spread: 90,
          origin: { y: 0.6 },
          colors: ['#25e24c', '#fbbf24', '#ffffff', '#eab308'],
        });
        showNotification(`🎉 ${data.message}`, 'success');
        setInputCode('');
        setErrorCount(0);
        setPlayerAttempts((prev) => {
          const solvedAttempt: TaskAttempt = {
            id: currentAttempt?.id || `att-${Date.now()}`,
            player_id: activePlayerId,
            node_key: activeNode.node_key,
            started_at: currentAttempt?.started_at || new Date().toISOString(),
            completed_at: new Date().toISOString(),
            duration_seconds: data.durationSeconds || elapsedSeconds,
            awarded_points: data.points || 100,
            is_completed: true,
          };
          const updated = [
            ...prev.filter((a) => a.node_key.toUpperCase() !== activeNode.node_key.toUpperCase()),
            solvedAttempt,
          ];
          if (typeof window !== 'undefined') {
            localStorage.setItem(`varila_attempts_${activePlayerId}`, JSON.stringify(updated));
          }
          return updated;
        });
        fetchData();
        fetchPlayerAttempts(activePlayerId);
      } else {
        soundFX.playFailure();
        const nextErrors = errorCount + 1;
        setErrorCount(nextErrors);

        if (nextErrors >= 3) {
          const penaltyUntil = Date.now() + 45000;
          setLockoutDeadline(penaltyUntil);
          showNotification(`🚨 3 VIRHEELLISTÄ YRITYSTÄ! 45s aikasakko aktivoitu. Kertaa vihjeet!`, 'error');
        } else {
          showNotification(`⚠️ ${data.message || 'Virheellinen koodi'} (${nextErrors}/3 virhettä ennen aikasakkoa)`, 'error');
        }
      }
    } catch {
      soundFX.playFailure();
      showNotification('Yhteysvirhe koodin tarkistuksessa', 'error');
    }
  };

  const isLocked = lockoutDeadline > nowTime;
  const remainingSecs = isLocked ? Math.ceil((lockoutDeadline - nowTime) / 1000) : 0;
  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isAllSolved = nodes.length > 0 && solvedNodeKeys.length >= nodes.length;

  return (
    <div className={`min-h-screen bg-[#070a07] text-[#e8d5b5] flex flex-col font-serif ${crtEnabled ? 'crt-overlay crt-vignette' : ''}`}>
      {/* Victorian Header */}
      <Header
        players={displayPlayers}
        activePlayerId={activePlayerId}
        activePlayerName={activePlayerName}
        onOpenProfileModal={() => {
          setCanCloseRegistration(true);
          setRegistrationOpen(true);
        }}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          const next = soundFX.toggleSound();
          setSoundEnabled(next);
        }}
        crtEnabled={crtEnabled}
        onToggleCrt={() => setCrtEnabled(!crtEnabled)}
      />

      {/* Floating Notification Banner */}
      {notification && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 w-11/12 max-w-lg font-serif animate-bounce">
          <div
            className={`p-4 rounded-xl border shadow-2xl flex items-center gap-3 text-xs font-bold ${
              notification.type === 'bonus'
                ? 'bg-[#2b1706]/95 text-[#fef3c7] border-[#d4af37] shadow-[0_0_30px_rgba(212,175,55,0.6)]'
                : notification.type === 'success'
                ? 'bg-[#0e2311]/95 text-[#dcfce7] border-[#25e24c] shadow-[0_0_30px_rgba(37,226,76,0.6)]'
                : 'bg-[#2a0e0e]/95 text-[#fee2e2] border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.6)]'
            }`}
          >
            {notification.type === 'bonus' ? (
              <Sparkles className="w-5 h-5 text-[#fbbf24] shrink-0" />
            ) : notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-[#25e24c] shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <div className="flex-1 font-serif text-sm">{notification.message}</div>
          </div>
        </div>
      )}

      {/* Navigation Bar */}
      <nav className="bg-[#101410] border-b border-[#25e24c]/30 sticky top-[57px] z-20 font-cinzel text-xs shadow-md">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <div className="flex">
            <button
              onClick={() => {
                soundFX.playKeyClick();
                setActiveView('quest');
              }}
              className={`py-3 px-4 font-bold border-b-2 flex items-center gap-2 transition ${
                activeView === 'quest'
                  ? 'border-[#25e24c] text-[#25e24c] bg-[#142314]'
                  : 'border-transparent text-[#a88456] hover:text-[#fef3c7]'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>ARKISTOPÄÄTE // 1888</span>
            </button>

            <button
              onClick={() => {
                soundFX.playKeyClick();
                setActiveView('leaderboard');
              }}
              className={`py-3 px-4 font-bold border-b-2 flex items-center gap-2 transition ${
                activeView === 'leaderboard'
                  ? 'border-[#25e24c] text-[#25e24c] bg-[#142314]'
                  : 'border-transparent text-[#a88456] hover:text-[#fef3c7]'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>PISTETILANNE</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="text-[#a88456] hover:text-[#25e24c] text-[11px] font-cinzel font-bold px-3 py-1.5 rounded border border-[#25e24c]/30 flex items-center gap-1.5 transition"
              title="Avaa järjestäjän WhatsApp-hallinta"
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Admin / WA</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-3 sm:p-5 font-serif space-y-5">
        {activeView === 'quest' && (
          <>
            {/* 1. SINETTI - 11-osainen kultainen sinettikuva */}
            <SealAssemblyProgress
              totalNodes={11}
              solvedCount={solvedNodeKeys.length}
              solvedNodeKeys={solvedNodeKeys}
              nodes={nodes}
              onSelectNode={(key) => {
                soundFX.playKeyClick();
                setSelectedNodeKey(key);
              }}
            />

            {/* Task selector pill row */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
              {nodes.map((n, idx) => {
                const isSolved = solvedNodeKeys.includes(n.node_key);
                const isSelected = activeNode?.node_key === n.node_key;
                return (
                  <button
                    key={n.node_key}
                    onClick={() => {
                      soundFX.playKeyClick();
                      setSelectedNodeKey(n.node_key);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold shrink-0 transition flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-[#18361b] text-[#4ade80] border-[#25e24c] shadow-[0_0_10px_rgba(37,226,76,0.3)]'
                        : isSolved
                        ? 'bg-[#121c12] text-[#86efac] border-[#15803d]'
                        : n.is_active
                        ? 'bg-[#1a150e] text-[#fbbf24] border-[#8b5a2b]'
                        : 'bg-[#0d0f0d] text-stone-500 border-stone-800'
                    }`}
                  >
                    <span>{idx + 1}.</span>
                    <span>{n.node_key}</span>
                    {isSolved && <span>✓</span>}
                  </button>
                );
              })}
            </div>

            {/* 2. TEHTÄVÄNÄKYMÄ */}
            {isAllSolved ? (
              <div className="parchment-card rounded-2xl border-2 border-emerald-500 p-6 text-center shadow-2xl space-y-4">
                <span className="text-3xl">🎉</span>
                <h2 className="font-cinzel text-xl font-bold text-[#fef08a] uppercase">
                  VÄRILÄN SUURI SINETTI 1888 ON MURTETTU!
                </h2>
                <p className="text-sm text-[#e4cdad] max-w-lg mx-auto">
                  Kaikki 11 anomaliaa on ratkaistu ja kirstun salpa on vapaa avattavaksi sukujuhlassa!
                </p>
              </div>
            ) : !activeNode?.is_active ? (
              // Tehtävää ei ole vielä aktivoitu admin-paneelista
              <div className="parchment-card rounded-2xl border-2 border-[#5c3e21] p-6 text-center shadow-2xl space-y-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-[#1b120a] border border-[#5c3e21] flex items-center justify-center">
                  <Lock className="w-6 h-6 text-[#a88456]" />
                </div>
                <h3 className="font-cinzel text-base sm:text-lg font-bold text-[#fef3c7] uppercase">
                  {activeNode?.title || 'LUKITTU ANOMALIA'} ({activeNode?.node_key || 'ODOTTAA'})
                </h3>
                <p className="text-xs text-[#a88456] max-w-md mx-auto">
                  Kaikki tehtävät ovat alussa lukittuina. Järjestäjä (Admin) avaa tehtävät ohjauspaneelista pelin alkaessa ja ilmoittaa niistä <strong>WhatsApp-ryhmässä</strong>!
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      soundFX.playKeyClick();
                      fetchData();
                    }}
                    className="bg-[#23180f] hover:bg-[#312114] text-[#fbbf24] border border-[#d4af37] text-xs font-cinzel font-bold px-4 py-2 rounded-lg inline-flex items-center gap-2 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Päivitä tehtävätilanne</span>
                  </button>
                </div>
              </div>
            ) : (!currentAttempt && !isCurrentSolved) ? (
              // VAIHE 1, 2 & 3: TASKGATE (Katsotaan video ensin rauhassa ilman kellon tikitystä)
              <TaskGate
                playerId={activePlayerId || ''}
                nodeKey={activeNode.node_key}
                title={activeNode.title}
                storyText={activeNode.story_text}
                videoUrl={activeNode.video_url}
                onTaskStarted={handleTaskGateStarted}
              />
            ) : isCurrentSolved ? (
              // TEHTÄVÄ ON JO RATKAISTU -> SULJETTU TILA! Tehtävä sulkeutuu kyseiseltä pelaajalta, ei voi tehdä uudestaan.
              <div className="parchment-card rounded-2xl border-2 border-emerald-500/80 p-6 sm:p-8 text-center shadow-2xl space-y-5 animate-fadeIn">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-950/80 border-2 border-emerald-400 flex items-center justify-center shadow-[0_0_25px_rgba(34,197,94,0.4)]">
                  <CheckCircle2 className="w-9 h-9 text-emerald-400" />
                </div>

                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500 text-xs font-mono uppercase tracking-widest font-bold">
                    ✓ ANOMALIA PURETTU JA SULJETTU
                  </div>
                  <h2 className="text-xl sm:text-2xl font-cinzel font-bold text-[#fef08a] mt-2 uppercase tracking-wide">
                    {activeNode.title}
                  </h2>
                  <div className="text-xs text-[#a88456] font-mono mt-1">
                    {activeNode.node_key} • SINETIN LOHKO ON VALAISTU KULTAISENA
                  </div>
                </div>

                <div className="paper-document p-4 rounded-xl text-[#2b1d0c] max-w-md mx-auto text-xs space-y-2.5 shadow-inner">
                  <div className="flex justify-between items-center font-bold text-sm border-b border-[#a88456]/40 pb-1.5">
                    <span>Myönnetyt pisteet:</span>
                    <span className="text-emerald-700 font-mono text-base font-extrabold">
                      +{currentAttempt?.awarded_points || 100} p
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span>Oma ratkaisuaika:</span>
                    <span className="font-mono font-bold text-stone-900">
                      {formatSeconds(currentAttempt?.duration_seconds || elapsedSeconds)}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#785434] italic pt-1.5 border-t border-[#a88456]/30">
                    🔒 Olet jo purkanut tämän anomalian. Tehtävä on sulkeutunut uudelleenyrityksiltä aikalaskennan ja pisteiden turvaamiseksi.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  {(() => {
                    const nextUnsolved = nodes.find(
                      (n) => n.is_active && !solvedNodeKeys.includes(n.node_key)
                    );
                    if (nextUnsolved) {
                      return (
                        <button
                          onClick={() => {
                            soundFX.playKeyClick();
                            setSelectedNodeKey(nextUnsolved.node_key);
                          }}
                          className="btn-brass font-cinzel font-bold text-xs sm:text-sm px-6 py-3 rounded-xl flex items-center gap-2 uppercase tracking-wider shadow-lg"
                        >
                          <span>Siirry seuraavaan tehtävään: {nextUnsolved.node_key}</span>
                          <span>→</span>
                        </button>
                      );
                    }
                    return (
                      <div className="text-xs text-[#fbbf24] font-cinzel">
                        ✨ Kaikki tähän mennessä avatut anomaliat on ratkaistu! Odota pelinjohtajan avausta seuraavalle tehtävälle.
                      </div>
                    );
                  })()}

                  <button
                    onClick={() => setVideoModalOpen(true)}
                    className="bg-[#24170d] hover:bg-[#3b230d] text-[#fbbf24] border border-[#d4af37] text-xs font-cinzel font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition"
                  >
                    <Film className="w-3.5 h-3.5" />
                    <span>Katso vihjetallenne uudelleen</span>
                  </button>
                </div>
              </div>
            ) : (
              // Tehtävä on käynnissä (ei vielä ratkaistu) -> Minipeli & Juokseva aikalaskuri!
              <div className="parchment-card rounded-2xl border-2 border-[#d4af37] p-4 sm:p-5 shadow-2xl space-y-5">
                {/* Header info */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#5c3e21]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold bg-[#143318] text-[#86efac] border border-[#22c55e] px-2 py-0.5 rounded">
                        AKTIIVINEN ANOMALIA ✓
                      </span>
                      <h2 className="text-base sm:text-lg font-cinzel font-bold text-[#fef3c7] uppercase">
                        {activeNode.title}
                      </h2>
                    </div>
                    {isCurrentSolved && (
                      <div className="text-xs text-emerald-400 font-serif font-bold mt-0.5">
                        ✓ Ratkaistu (+{currentAttempt?.awarded_points}p)
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setVideoModalOpen(true)}
                      className="bg-[#24170d] hover:bg-[#3b230d] text-[#fbbf24] border border-[#d4af37] text-xs font-cinzel font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
                      title="Katso vihjetallenne uudelleen"
                    >
                      <Film className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Katso Tallenne</span>
                    </button>

                    {/* Aikalaskuri & Virhelaskuri */}
                    <div className="flex items-center gap-3 bg-[#170e08] px-3 py-1.5 rounded-xl border border-[#4a2e16] text-xs">
                      <div className="flex items-center gap-1.5 text-[#fbbf24]">
                        <TimerIcon className="w-3.5 h-3.5" />
                        <span className="font-typewriter text-sm font-bold">{formatSeconds(elapsedSeconds)}</span>
                      </div>
                      <span className="text-[#5c3e21]">|</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-[#a88456]">Virheet:</span>
                        {[1, 2, 3].map((strike) => (
                          <span
                            key={strike}
                            className={`w-3 h-3 rounded-full text-[8px] flex items-center justify-center font-bold ${
                              errorCount >= strike
                                ? 'bg-red-600 text-white'
                                : 'bg-[#29170c] text-[#785434]'
                            }`}
                          >
                            ✕
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Aikasakko Banner if Locked */}
                {isLocked && (
                  <div className="p-3.5 bg-red-950/80 border-2 border-red-500 rounded-xl text-xs text-red-200 flex items-center justify-between gap-3 animate-pulse">
                    <div className="flex items-center gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                      <div>
                        <strong className="font-cinzel text-red-100 uppercase block">
                          3 Virheellistä Yritystä! 45s aikasakko
                        </strong>
                        <span>Tutki vihjeitä tarkemmin ennen uutta vahvistusta!</span>
                      </div>
                    </div>
                    <div className="font-typewriter text-sm font-bold text-red-300 px-3 py-1 bg-red-900 rounded border border-red-400">
                      00:{remainingSecs.toString().padStart(2, '0')}
                    </div>
                  </div>
                )}

                {/* 3. ITSE TEHTÄVÄKOMPONENTTI */}
                {activeNode.node_key === 'NODE-01' ? (
                  <ArmoredLockCadPuzzle
                    onSuccessCode={(code) => {
                      setInputCode(code);
                      handleSubmitCode(code);
                    }}
                    standalone={false}
                  />
                ) : activeNode.node_key === 'NODE-02' ? (
                  <ViljatasePuzzle
                    onSuccessCode={(code) => {
                      setInputCode(code);
                      handleSubmitCode(code);
                    }}
                  />
                ) : activeNode.node_key === 'NODE-03' ? (
                  <AskoPuzzle
                    onSuccessCode={(code) => {
                      setInputCode(code);
                      handleSubmitCode(code);
                    }}
                  />
                ) : activeNode.node_key === 'NODE-04' ? (
                  <PioneeriPuzzle
                    onSuccessCode={(code) => {
                      setInputCode(code);
                      handleSubmitCode(code);
                    }}
                  />
                ) : activeNode.node_key === 'NODE-05' ? (
                  <AikajanaHarhatPuzzle
                    onSuccessCode={(code) => {
                      setInputCode(code);
                      handleSubmitCode(code);
                    }}
                  />
                ) : activeNode.node_key === 'NODE-06' ? (
                  <OrpopojanTraumakarttaPuzzle
                    onSuccessCode={(code) => {
                      setInputCode(code);
                      handleSubmitCode(code);
                    }}
                  />
                ) : activeNode.node_key === 'NODE-07' ? (
                  <HeinolaPuzzle
                    onSuccessCode={(code) => {
                      setInputCode(code);
                      handleSubmitCode(code);
                    }}
                  />
                ) : activeNode.node_key === 'NODE-08' ? (
                  <TullikatePuzzle
                    onSuccessCode={(code) => {
                      setInputCode(code);
                      handleSubmitCode(code);
                    }}
                  />
                ) : activeNode.node_key === 'NODE-09' ? (
                  <StuntPyramidiPuzzle
                    onSuccessCode={(code) => {
                      setInputCode(code);
                      handleSubmitCode(code);
                    }}
                  />
                ) : activeNode.node_key === 'NODE-10' ? (
                  <PikselikirvesPuzzle
                    onSuccessCode={(code) => {
                      setInputCode(code);
                      handleSubmitCode(code);
                    }}
                  />
                ) : activeNode.node_key === 'NODE-11' ? (
                  <KuraisetLatakotPuzzle
                    onSuccessCode={(code) => {
                      setInputCode(code);
                      handleSubmitCode(code);
                    }}
                  />
                ) : (
                  // Generic rich puzzle interface for remaining nodes
                  <div className="p-5 bg-[#180f08] border border-[#5c3e21] rounded-xl space-y-4">
                    <div className="text-xs text-[#fef3c7] font-serif leading-relaxed">
                      <strong className="text-[#fbbf24] font-cinzel">🎯 Tehtävänanto: </strong>
                      {activeNode.role_hint}
                    </div>
                    {activeNode.story_text && (
                      <p className="text-xs text-[#e4cdad] italic">
                        {activeNode.story_text}
                      </p>
                    )}
                  </div>
                )}

                {/* Koodin syöttölomake */}
                <div className="pt-3 border-t border-[#5c3e21] flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <Key className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-[#a88456]" />
                    <input
                      type="text"
                      disabled={isLocked || isCurrentSolved}
                      placeholder={
                        isCurrentSolved
                          ? 'Tehtävä on jo ratkaistu! Hyvin tehty.'
                          : isLocked
                          ? `Lukittu aikasakossa (${remainingSecs}s)...`
                          : 'Syötä ratkaisukoodi...'
                      }
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value)}
                      className={`w-full bg-[#0d0905] border text-[#fbbf24] text-xs pl-9 pr-3 py-2.5 rounded-lg font-typewriter uppercase focus:outline-none ${
                        isLocked
                          ? 'border-red-600/60 opacity-60 cursor-not-allowed'
                          : 'border-[#5c3e21] focus:border-[#d4af37]'
                      }`}
                    />
                  </div>

                  <button
                    disabled={isLocked || isCurrentSolved}
                    onClick={() => handleSubmitCode()}
                    className={`font-bold text-xs font-cinzel px-5 py-2.5 rounded-lg transition flex items-center justify-center gap-2 uppercase tracking-wider shadow-lg ${
                      isCurrentSolved
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-600 cursor-default'
                        : isLocked
                        ? 'bg-red-950/60 text-red-400 border border-red-700 cursor-not-allowed'
                        : 'btn-brass'
                    }`}
                  >
                    {isCurrentSolved ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>RATKAISTU</span>
                      </>
                    ) : isLocked ? (
                      <>
                        <Lock className="w-3.5 h-3.5 text-red-400" />
                        <span>SAKKO ({remainingSecs}s)</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Vahvista Koodi</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Pistetilanne Tab */}
        {activeView === 'leaderboard' && (
          <LeaderboardTab
            players={displayPlayers}
            solves={displaySolves}
            onRefresh={fetchData}
            isLoading={isLoading}
          />
        )}
      </main>

      {/* Registration / Profile Modal */}
      <PlayerRegistrationModal
        isOpen={registrationOpen}
        onRegistered={handlePlayerRegistered}
        onLogout={() => {
          if (typeof window !== 'undefined') {
            // Huom: Säilytetään pelaajan suoritushistoria localStoragessa, jotta sinetti palautuu kun palaa samalla nimellä
            localStorage.removeItem('varila_player_id');
            localStorage.removeItem('varila_player_name');
            localStorage.removeItem('varila_player_pin');
          }
          setActivePlayerId(null);
          setActivePlayerName('');
          setPlayerAttempts([]);
          setCanCloseRegistration(false);
          setRegistrationOpen(true);
        }}
        currentPlayerName={activePlayerName}
        canClose={canCloseRegistration}
        onClose={() => setRegistrationOpen(false)}
      />

      {/* Video Replay Modal */}
      {videoModalOpen && activeNode && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="parchment-card max-w-xl w-full p-4 rounded-2xl border-2 border-[#d4af37] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#5c3e21]">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-[#fbbf24]" />
                <h3 className="font-cinzel font-bold text-sm text-[#fef3c7]">
                  🎬 {activeNode.title}
                </h3>
              </div>
              <button
                onClick={() => setVideoModalOpen(false)}
                className="text-[#a88456] hover:text-white font-bold text-xs font-cinzel px-2 py-1"
              >
                ✕ Sulje
              </button>
            </div>
            <video
              src={activeNode.video_url}
              controls
              autoPlay
              playsInline
              className="w-full aspect-video rounded-xl bg-black object-contain"
            />
            <div className="text-center">
              <span className="text-[11px] text-[#fbbf24] font-mono">
                ⏱️ Aikalaskuri jatkaa käyntiään taustalla tallenteen aikana
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto border-t-2 border-[#5c3e21] py-3 bg-[#0a0704] text-center text-xs text-[#a88456] font-cinzel">
        <div>TAPAUS VÄRILÄ // PROTOKOLLA 1888 • NUORAMOINEN</div>
      </footer>
    </div>
  );
}
