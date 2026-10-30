import { getSupabaseServerClient, isSupabaseConfigured, INITIAL_NODES, INITIAL_PLAYERS } from './supabaseClient';
import { GameNode, Player, TaskAttempt, CheckCodeResponse, StartTaskResponse, AuthLoginResponse, LeaderboardData } from './types';

const ADMIN_PIN = process.env.ADMIN_SECRET_PIN || '1888';

// Hyväksytyt rinnakkaiskoodit minipelikomponenteille ja tietokannan oletuskoodeille
const NODE_ACCEPTED_CODES: Record<string, string[]> = {
  'NODE-01': ['382NM', '382'],
  'NODE-02': ['142.85', '142,85'],
  'NODE-03': ['AKSELI-48-1888', 'LAKKO-1905', 'M48-12BAR'],
  'NODE-04': ['PIONEERI-460', '460'],
  'NODE-05': ['HARHA-1888', '1888'],
  'NODE-06': ['SYSMA-61.42-1888', 'LEIVINUUNI-18', '61.42'],
  'NODE-07': ['TINKTUURA-1888', 'ROHDOS-70'],
  'NODE-08': ['SILMUKKA-24', 'KATE-24', '24'],
  'NODE-09': ['STUNT-VAKAUS'],
  'NODE-10': ['KIRVES-CHAMP'],
  'NODE-11': ['VARILA-SINETTI-1888', '7'],
};

export function isNodeCodeValid(nodeKey: string, inputCode: string, dbSecret?: string): boolean {
  const cleanKey = nodeKey.trim().toUpperCase();
  const cleanInput = inputCode.trim().toUpperCase().replace(/\s+/g, '');
  const cleanSecret = (dbSecret || '').trim().toUpperCase().replace(/\s+/g, '');

  if (cleanSecret && cleanInput === cleanSecret) return true;
  const aliases = NODE_ACCEPTED_CODES[cleanKey] || [];
  return aliases.some((code) => code.toUpperCase().replace(/\s+/g, '') === cleanInput);
}

/**
 * Laskee tehtäväkohtaiset pisteet suhteellisella skaalauksella:
 * - Nopein ratkaisuaika (minTime) = 100 p
 * - Hitain ratkaisuaika (maxTime) = 10 p
 * - Muut lineaarisesti väliltä [10, 100]
 * Jos tehtävässä on vasta yksi ratkaisija tai kaikilla sama aika, kaikki saavat 100 p.
 */
export function computeRelativeNodeScores(
  completedAttempts: { id: string; duration_seconds?: number | null }[]
): Map<string, number> {
  const result = new Map<string, number>();
  if (completedAttempts.length === 0) return result;

  const times = completedAttempts.map((a) => Math.max(1, a.duration_seconds ?? 1));
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);

  for (const att of completedAttempts) {
    const t = Math.max(1, att.duration_seconds ?? 1);
    if (maxTime <= minTime) {
      result.set(att.id, 100);
    } else {
      const ratio = (t - minTime) / (maxTime - minTime); // 0.0 (fastest) -> 1.0 (slowest)
      const pts = Math.round(100 - ratio * 90);
      result.set(att.id, Math.max(10, Math.min(100, pts)));
    }
  }

  return result;
}

// In-Memory Database for local dev & serverless fallback
class InMemoryGameDatabase {
  public nodes: GameNode[] = JSON.parse(JSON.stringify(INITIAL_NODES));
  public players: Player[] = JSON.parse(JSON.stringify(INITIAL_PLAYERS));
  public attempts: TaskAttempt[] = [];

  constructor(existing?: { nodes?: GameNode[]; players?: Player[]; attempts?: TaskAttempt[] }) {
    if (existing) {
      if (existing.nodes) {
        this.nodes = INITIAL_NODES.map((initNode) => {
          const prev = existing.nodes?.find((n) => n.node_key === initNode.node_key);
          return prev
            ? {
                ...initNode,
                is_active: prev.is_active,
                unlocked_at: prev.unlocked_at,
              }
            : { ...initNode };
        });
      }
      if (existing.players) this.players = existing.players;
      if (existing.attempts) this.attempts = existing.attempts;
      this.recalculateAllScores();
    }
  }

  public recalculateAllScores(): void {
    // Group completed attempts by node_key and recompute relative points (100p fastest .. 10p slowest)
    const nodeKeys = Array.from(
      new Set(this.attempts.filter((a) => a.is_completed).map((a) => a.node_key.toUpperCase()))
    );

    for (const nk of nodeKeys) {
      const nodeCompleted = this.attempts.filter(
        (a) => a.is_completed && a.node_key.toUpperCase() === nk
      );
      const relativeScores = computeRelativeNodeScores(nodeCompleted);
      for (const a of nodeCompleted) {
        a.awarded_points = relativeScores.get(a.id) ?? 100;
      }
    }

    // Recompute every player's total_score from their completed attempts
    for (const p of this.players) {
      p.total_score = this.attempts
        .filter((a) => a.player_id === p.id && a.is_completed)
        .reduce((sum, a) => sum + (a.awarded_points || 0), 0);
    }
  }

  public getNodes(includeSecrets = false): GameNode[] {
    return this.nodes.map((node) => {
      const copy = { ...node };
      if (!includeSecrets) {
        delete copy.secret_code;
      }
      return copy;
    });
  }

  public getNode(nodeKey: string): GameNode | undefined {
    const key = nodeKey.trim().toUpperCase();
    return this.nodes.find((n) => n.node_key.toUpperCase() === key);
  }

  public getPlayers(): Player[] {
    return [...this.players].sort((a, b) => b.total_score - a.total_score);
  }

  public getPlayer(id: string): Player | undefined {
    return this.players.find((p) => p.id === id);
  }

  public loginOrRegister(name: string, pinCode: string): AuthLoginResponse {
    const cleanName = name.trim();
    const cleanPin = pinCode.trim();

    if (!cleanName) {
      return { success: false, error: 'Nimi on pakollinen.' };
    }
    if (!cleanPin || cleanPin.length < 4) {
      return { success: false, error: 'Syötä 4-numeroinen PIN-koodi.' };
    }

    const existing = this.players.find(
      (p) => p.name.toLowerCase() === cleanName.toLowerCase()
    );

    if (existing) {
      if (existing.pin_code && existing.pin_code !== cleanPin) {
        return { success: false, error: 'Virheellinen PIN-koodi tälle nimelle.' };
      }
      return {
        success: true,
        player: {
          id: existing.id,
          name: existing.name,
          total_score: existing.total_score,
          created_at: existing.created_at,
        },
        message: `Tervetuloa takaisin, ${existing.name}!`,
      };
    }

    // New player
    const newPlayer: Player = {
      id: `player-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: cleanName,
      pin_code: cleanPin,
      total_score: 0,
      created_at: new Date().toISOString(),
    };
    this.players.push(newPlayer);

    return {
      success: true,
      player: {
        id: newPlayer.id,
        name: newPlayer.name,
        total_score: 0,
        created_at: newPlayer.created_at,
      },
      message: `Tervetuloa tutkintaan, ${newPlayer.name}!`,
    };
  }

  public startTask(playerId: string, nodeKey: string): StartTaskResponse {
    const node = this.getNode(nodeKey);
    if (!node) {
      return { success: false, node_key: nodeKey, started_at: '', error: 'Tuntematon tehtäväsolmu.' };
    }
    if (!node.is_active) {
      return { success: false, node_key: nodeKey, started_at: '', error: 'Tämä tehtävä ei ole vielä aktiivinen.' };
    }

    const existing = this.attempts.find(
      (a) => a.player_id === playerId && a.node_key.toUpperCase() === node.node_key.toUpperCase()
    );

    if (existing) {
      return {
        success: true,
        node_key: node.node_key,
        started_at: existing.started_at,
        startedAt: existing.started_at,
        already_started: true,
        is_completed: existing.is_completed,
        isCompleted: existing.is_completed,
        awarded_points: existing.awarded_points,
      };
    }

    const startedAt = new Date().toISOString();
    const newAttempt: TaskAttempt = {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      player_id: playerId,
      node_key: node.node_key,
      started_at: startedAt,
      completed_at: null,
      duration_seconds: null,
      awarded_points: 0,
      is_completed: false,
    };
    this.attempts.push(newAttempt);

    return {
      success: true,
      node_key: node.node_key,
      started_at: startedAt,
      startedAt: startedAt,
      already_started: false,
      is_completed: false,
      isCompleted: false,
    };
  }

  public checkCode(playerId: string, nodeKey: string, inputCode: string): CheckCodeResponse {
    const node = this.getNode(nodeKey);
    if (!node) {
      return { success: false, message: 'Tuntematon anomalia.' };
    }

    if (!isNodeCodeValid(node.node_key, inputCode, node.secret_code)) {
      return {
        success: false,
        message: 'Virheellinen purkukoodi. Tarkista vihjeet ja laskelmat!',
      };
    }

    let attempt = this.attempts.find(
      (a) => a.player_id === playerId && a.node_key.toUpperCase() === node.node_key.toUpperCase()
    );

    if (attempt && attempt.is_completed) {
      return {
        success: true,
        points: attempt.awarded_points,
        durationSeconds: attempt.duration_seconds || 0,
        message: 'Olet jo ratkaissut tämän tehtävän aikaisemmin!',
        alreadySolved: true,
      };
    }

    const completedAt = new Date();
    let startTime = attempt ? new Date(attempt.started_at).getTime() : completedAt.getTime() - 30000;
    const durationSeconds = Math.max(1, Math.round((completedAt.getTime() - startTime) / 1000));

    if (!attempt) {
      attempt = {
        id: `att-${Date.now()}`,
        player_id: playerId,
        node_key: node.node_key,
        started_at: new Date(startTime).toISOString(),
        completed_at: completedAt.toISOString(),
        duration_seconds: durationSeconds,
        awarded_points: 100,
        is_completed: true,
      };
      this.attempts.push(attempt);
    } else {
      attempt.completed_at = completedAt.toISOString();
      attempt.duration_seconds = durationSeconds;
      attempt.is_completed = true;
    }

    this.recalculateAllScores();

    const points = attempt.awarded_points;

    return {
      success: true,
      points,
      durationSeconds,
      message: `KOODI HYVÄKSYTTY! Aika: ${durationSeconds}s. Suhteelliset pisteet tällä hetkellä: +${points}p (100p nopein – 10p hitain)`,
    };
  }

  public toggleNode(nodeKey: string, isActive: boolean, adminPin: string): { success: boolean; error?: string; node?: GameNode } {
    if (adminPin !== ADMIN_PIN) {
      return { success: false, error: 'Virheellinen Admin PIN-koodi.' };
    }

    const node = this.getNode(nodeKey);
    if (!node) {
      return { success: false, error: 'Tehtävää ei löydy.' };
    }

    node.is_active = isActive;
    node.unlocked_at = isActive ? new Date().toISOString() : null;

    return { success: true, node };
  }

  public getLeaderboard(): LeaderboardData {
    this.recalculateAllScores();
    const players = this.getPlayers();
    const recentSolves = this.attempts
      .filter((a) => a.is_completed)
      .sort((a, b) => new Date(b.completed_at || 0).getTime() - new Date(a.completed_at || 0).getTime())
      .slice(0, 30)
      .map((a) => {
        const p = this.getPlayer(a.player_id);
        return {
          ...a,
          player_name: p?.name || 'Tuntematon',
        };
      });

    return { players, recent_solves: recentSolves };
  }

  public getPlayerAttempts(playerId: string): TaskAttempt[] {
    this.recalculateAllScores();
    return this.attempts.filter((a) => a.player_id === playerId);
  }

  public resetAll() {
    this.nodes = JSON.parse(JSON.stringify(INITIAL_NODES));
    this.players = [];
    this.attempts = [];
  }
}

// Global in-memory singleton (re-instantiates on HMR to pick up updated methods while preserving state)
const globalForGame = global as unknown as { inMemoryDb?: InMemoryGameDatabase };
export const inMemoryDb = new InMemoryGameDatabase(globalForGame.inMemoryDb as any);
if (process.env.NODE_ENV !== 'production') globalForGame.inMemoryDb = inMemoryDb;

// ==========================================
// UNIFIED CONTROLLERS (SUPABASE + MEMORY FALLBACK)
// ==========================================

export async function handleAuthLogin(name: string, pinCode: string): Promise<AuthLoginResponse> {
  const cleanName = name.trim();
  const cleanPin = pinCode.trim();

  if (!cleanName) return { success: false, error: 'Nimi on pakollinen.' };
  if (!cleanPin || cleanPin.length < 4) return { success: false, error: 'Syötä 4-numeroinen PIN-koodi.' };

  const sb = getSupabaseServerClient();
  if (sb) {
    try {
      const { data: existingPlayer } = await sb
        .from('players')
        .select('*')
        .ilike('name', cleanName)
        .maybeSingle();

      if (existingPlayer) {
        if (existingPlayer.pin_code !== cleanPin) {
          return { success: false, error: 'Virheellinen PIN-koodi tälle nimelle.' };
        }
        return {
          success: true,
          player: {
            id: existingPlayer.id,
            name: existingPlayer.name,
            total_score: existingPlayer.total_score,
            created_at: existingPlayer.created_at,
          },
          message: `Tervetuloa takaisin, ${existingPlayer.name}!`,
        };
      }

      // Insert new player
      const { data: newPlayer, error } = await sb
        .from('players')
        .insert({
          name: cleanName,
          pin_code: cleanPin,
          total_score: 0,
        })
        .select()
        .single();

      if (error || !newPlayer) {
        return { success: false, error: 'Virhe pelaajan luonnissa: ' + (error?.message || 'Tuntematon virhe') };
      }

      return {
        success: true,
        player: {
          id: newPlayer.id,
          name: newPlayer.name,
          total_score: newPlayer.total_score,
          created_at: newPlayer.created_at,
        },
        message: `Tervetuloa tutkintaan, ${newPlayer.name}!`,
      };
    } catch {
      // Fallback
    }
  }

  return inMemoryDb.loginOrRegister(cleanName, cleanPin);
}

export async function handleStartTask(playerId: string, nodeKey: string): Promise<StartTaskResponse> {
  const cleanKey = nodeKey.trim().toUpperCase();
  const sb = getSupabaseServerClient();

  if (sb) {
    try {
      // Check node active state
      const { data: node } = await sb
        .from('game_nodes')
        .select('is_active')
        .eq('node_key', cleanKey)
        .maybeSingle();

      if (!node) {
        return { success: false, node_key: cleanKey, started_at: '', error: 'Tehtävää ei löydy.' };
      }
      if (!node.is_active) {
        return { success: false, node_key: cleanKey, started_at: '', error: 'Tehtävä ei ole vielä aktiivinen.' };
      }

      // Check existing attempt
      const { data: existing } = await sb
        .from('task_attempts')
        .select('*')
        .eq('player_id', playerId)
        .eq('node_key', cleanKey)
        .maybeSingle();

      if (existing) {
        return {
          success: true,
          node_key: cleanKey,
          started_at: existing.started_at,
          startedAt: existing.started_at,
          already_started: true,
          is_completed: existing.is_completed,
          isCompleted: existing.is_completed,
          awarded_points: existing.awarded_points,
        };
      }

      // Insert new attempt with server NOW()
      const { data: created, error } = await sb
        .from('task_attempts')
        .insert({
          player_id: playerId,
          node_key: cleanKey,
          is_completed: false,
          awarded_points: 0,
        })
        .select()
        .single();

      if (error || !created) {
        return { success: false, node_key: cleanKey, started_at: '', error: 'Aikalaskurin alustus epäonnistui.' };
      }

      return {
        success: true,
        node_key: cleanKey,
        started_at: created.started_at,
        startedAt: created.started_at,
        already_started: false,
        is_completed: false,
        isCompleted: false,
      };
    } catch {
      // Fallback
    }
  }

  return inMemoryDb.startTask(playerId, cleanKey);
}

export async function handleCheckCode(
  playerId: string,
  nodeKey: string,
  inputCode: string
): Promise<CheckCodeResponse> {
  const cleanKey = nodeKey.trim().toUpperCase();
  const cleanInput = inputCode.trim().toUpperCase().replace(/\s+/g, '');
  const sb = getSupabaseServerClient();

  if (sb) {
    try {
      const { data: node } = await sb
        .from('game_nodes')
        .select('secret_code, is_active')
        .eq('node_key', cleanKey)
        .maybeSingle();

      if (!node) {
        return { success: false, message: 'Tuntematon anomalia.' };
      }

      if (!isNodeCodeValid(cleanKey, inputCode, node.secret_code)) {
        return {
          success: false,
          message: 'Virheellinen purkukoodi. Tarkista vihjeet ja yritä uudelleen!',
        };
      }

      // Fetch attempt
      let { data: attempt } = await sb
        .from('task_attempts')
        .select('*')
        .eq('player_id', playerId)
        .eq('node_key', cleanKey)
        .maybeSingle();

      if (attempt && attempt.is_completed) {
        return {
          success: true,
          points: attempt.awarded_points,
          durationSeconds: attempt.duration_seconds || 0,
          message: 'Olet jo ratkaissut tämän tehtävän aikaisemmin!',
          alreadySolved: true,
        };
      }

      const completedAt = new Date();
      const startTime = attempt ? new Date(attempt.started_at).getTime() : completedAt.getTime() - 30000;
      const durationSeconds = Math.max(1, Math.round((completedAt.getTime() - startTime) / 1000));

      if (!attempt) {
        const { data: newAttempt } = await sb
          .from('task_attempts')
          .insert({
            player_id: playerId,
            node_key: cleanKey,
            started_at: new Date(startTime).toISOString(),
            completed_at: completedAt.toISOString(),
            duration_seconds: durationSeconds,
            awarded_points: 100,
            is_completed: true,
          })
          .select()
          .single();
        attempt = newAttempt;
      } else {
        await sb
          .from('task_attempts')
          .update({
            completed_at: completedAt.toISOString(),
            duration_seconds: durationSeconds,
            is_completed: true,
          })
          .eq('id', attempt.id);
      }

      // Fetch all completed attempts for this node to compute relative scores (100p fastest .. 10p slowest)
      const { data: nodeCompleted } = await sb
        .from('task_attempts')
        .select('id, player_id, duration_seconds')
        .eq('node_key', cleanKey)
        .eq('is_completed', true);

      let points = 100;
      if (nodeCompleted && nodeCompleted.length > 0) {
        const relativeScores = computeRelativeNodeScores(nodeCompleted);
        if (attempt?.id && relativeScores.has(attempt.id)) {
          points = relativeScores.get(attempt.id)!;
        }

        // Update awarded_points for each completed attempt on this node
        await Promise.all(
          nodeCompleted.map((att) =>
            sb
              .from('task_attempts')
              .update({ awarded_points: relativeScores.get(att.id) ?? 100 })
              .eq('id', att.id)
          )
        );

        // Recompute total_score for all players who have completed attempts
        const { data: allCompleted } = await sb
          .from('task_attempts')
          .select('player_id, awarded_points')
          .eq('is_completed', true);

        if (allCompleted) {
          const totalsByPlayer = new Map<string, number>();
          for (const row of allCompleted) {
            totalsByPlayer.set(
              row.player_id,
              (totalsByPlayer.get(row.player_id) || 0) + (row.awarded_points || 0)
            );
          }
          await Promise.all(
            Array.from(totalsByPlayer.entries()).map(([pId, total]) =>
              sb.from('players').update({ total_score: total }).eq('id', pId)
            )
          );
        }
      }

      return {
        success: true,
        points,
        durationSeconds,
        message: `KOODI HYVÄKSYTTY! Aika: ${durationSeconds}s. Suhteelliset pisteet tällä hetkellä: +${points}p (100p nopein – 10p hitain)`,
      };
    } catch {
      // Fallback
    }
  }

  return inMemoryDb.checkCode(playerId, cleanKey, inputCode);
}

export async function handleToggleNode(
  nodeKey: string,
  isActive: boolean,
  adminPin: string
): Promise<{ success: boolean; error?: string; node?: GameNode }> {
  if (adminPin !== ADMIN_PIN) {
    return { success: false, error: 'Virheellinen Admin PIN-koodi.' };
  }

  const cleanKey = nodeKey.trim().toUpperCase();
  const sb = getSupabaseServerClient();

  if (sb) {
    try {
      const { data, error } = await sb
        .from('game_nodes')
        .update({
          is_active: isActive,
          unlocked_at: isActive ? new Date().toISOString() : null,
        })
        .eq('node_key', cleanKey)
        .select()
        .single();

      if (error || !data) {
        return { success: false, error: error?.message || 'Päivitys epäonnistui.' };
      }

      return { success: true, node: data };
    } catch {
      // Fallback
    }
  }

  return inMemoryDb.toggleNode(cleanKey, isActive, adminPin);
}

export async function getGameNodes(includeSecrets = false): Promise<GameNode[]> {
  const sb = getSupabaseServerClient();
  if (sb) {
    try {
      const { data, error } = await sb
        .from('game_nodes')
        .select('*')
        .order('node_key', { ascending: true });

      if (!error && data && data.length > 0) {
        return (data as unknown as GameNode[]).map((node) => {
          const copy = { ...node };
          if (!includeSecrets) {
            delete copy.secret_code;
          }
          return copy;
        });
      }
    } catch {
      // Fallback
    }
  }

  return inMemoryDb.getNodes(includeSecrets);
}

export async function getLeaderboard(): Promise<LeaderboardData> {
  const sb = getSupabaseServerClient();
  if (sb) {
    try {
      const { data: players } = await sb
        .from('players')
        .select('id, name, total_score, created_at')
        .order('total_score', { ascending: false });

      const { data: solves } = await sb
        .from('task_attempts')
        .select('id, player_id, node_key, started_at, completed_at, duration_seconds, awarded_points, is_completed, players(name)')
        .eq('is_completed', true)
        .order('completed_at', { ascending: false })
        .limit(30);

      if (players) {
        const formattedSolves: TaskAttempt[] = (solves || []).map((s: any) => ({
          id: s.id,
          player_id: s.player_id,
          player_name: s.players?.name || 'Pelaaja',
          node_key: s.node_key,
          started_at: s.started_at,
          completed_at: s.completed_at,
          duration_seconds: s.duration_seconds,
          awarded_points: s.awarded_points,
          is_completed: s.is_completed,
        }));

        return { players, recent_solves: formattedSolves };
      }
    } catch {
      // Fallback
    }
  }

  return inMemoryDb.getLeaderboard();
}

export async function getPlayerAttempts(playerId: string): Promise<TaskAttempt[]> {
  const sb = getSupabaseServerClient();
  if (sb) {
    try {
      const { data } = await sb
        .from('task_attempts')
        .select('*')
        .eq('player_id', playerId);
      if (data) return data;
    } catch {
      // Fallback
    }
  }
  return inMemoryDb.getPlayerAttempts(playerId);
}
