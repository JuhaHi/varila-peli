import { getSupabaseServerClient, isSupabaseConfigured, INITIAL_NODES, INITIAL_PLAYERS } from './supabaseClient';
import { GameNode, Player, TaskAttempt, CheckCodeResponse, StartTaskResponse, AuthLoginResponse, LeaderboardData } from './types';

const ADMIN_PIN = (process.env.ADMIN_SECRET_PIN || '1888').trim();

export function verifyAdminPin(pin?: string | null): boolean {
  return Boolean(pin && pin.trim() === ADMIN_PIN);
}

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

// Aikakynnys (2026-10-30T13:51:30Z), jota vanhemmat avausleimat ja suoritukset tulkitaan nollatuiksi,
// jotta kaikki 11 tehtävää ja suoritushistoria ovat puhtaat pelin alkaessa.
export const INITIAL_LOCK_EPOCH = new Date('2026-10-30T13:51:30.000Z').getTime();

interface NodeOverrideState {
  is_active: boolean;
  unlocked_at: string | null;
  updated_at: number;
}

interface SharedMemoryState {
  nodes: GameNode[];
  nodeOverrides: Record<string, NodeOverrideState>;
  players: Player[];
  attempts: TaskAttempt[];
  resetAt: number;
}

const globalForGame = globalThis as unknown as {
  __varilaSharedState?: SharedMemoryState;
  inMemoryDb?: { nodes?: GameNode[]; players?: Player[]; attempts?: TaskAttempt[] };
};

if (!globalForGame.__varilaSharedState) {
  globalForGame.__varilaSharedState = {
    nodes: INITIAL_NODES.map((initNode) => ({
      ...initNode,
      is_active: false,
      unlocked_at: null,
    })),
    nodeOverrides: {},
    players: globalForGame.inMemoryDb?.players || JSON.parse(JSON.stringify(INITIAL_PLAYERS)),
    attempts: globalForGame.inMemoryDb?.attempts || [],
    resetAt: INITIAL_LOCK_EPOCH,
  };
} else if (!globalForGame.__varilaSharedState.nodeOverrides) {
  globalForGame.__varilaSharedState.nodeOverrides = {};
}

// In-Memory Database for local dev & serverless fallback (all route bundles share __varilaSharedState)
class InMemoryGameDatabase {
  public get nodes(): GameNode[] {
    return globalForGame.__varilaSharedState!.nodes;
  }
  public set nodes(val: GameNode[]) {
    globalForGame.__varilaSharedState!.nodes = val;
  }

  public get nodeOverrides(): Record<string, NodeOverrideState> {
    return globalForGame.__varilaSharedState!.nodeOverrides;
  }
  public set nodeOverrides(val: Record<string, NodeOverrideState>) {
    globalForGame.__varilaSharedState!.nodeOverrides = val;
  }

  public get players(): Player[] {
    return globalForGame.__varilaSharedState!.players;
  }
  public set players(val: Player[]) {
    globalForGame.__varilaSharedState!.players = val;
  }

  public get attempts(): TaskAttempt[] {
    return globalForGame.__varilaSharedState!.attempts;
  }
  public set attempts(val: TaskAttempt[]) {
    globalForGame.__varilaSharedState!.attempts = val;
  }

  public get resetAt(): number {
    return globalForGame.__varilaSharedState!.resetAt;
  }
  public set resetAt(val: number) {
    globalForGame.__varilaSharedState!.resetAt = val;
  }

  public recalculateAllScores(): void {
    const minValidEpoch = Math.max(INITIAL_LOCK_EPOCH, this.resetAt || 0);

    // Siivotaan vanhentuneet pelaajat (luotu ennen viimeisintä nollausta)
    this.players = this.players.filter((p) => {
      if (!p || !p.id || !p.name) return false;
      const createdTime = p.created_at ? new Date(p.created_at).getTime() : 0;
      return !createdTime || createdTime >= minValidEpoch;
    });

    const validPlayerIds = new Set(this.players.map((p) => p.id));

    // Siivotaan orvot suoritukset ("Tuntematon") sekä ennen nollausta tehdyt suoritukset
    this.attempts = this.attempts.filter((a) => {
      if (!a || !a.player_id || !validPlayerIds.has(a.player_id)) return false;
      const startT = a.started_at ? new Date(a.started_at).getTime() : 0;
      const compT = a.completed_at ? new Date(a.completed_at).getTime() : startT;
      if (startT && startT < minValidEpoch) return false;
      if (compT && compT < minValidEpoch) return false;
      return true;
    });

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

    // New player - use deterministic ID based on lowercase name to ensure re-logins match
    const normalizedName = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const deterministicId = `player-${normalizedName || Date.now()}`;
    const newPlayer: Player = {
      id: deterministicId,
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

  public checkCode(
    playerId: string,
    nodeKey: string,
    inputCode: string,
    clientStartedAt?: string,
    playerName?: string
  ): CheckCodeResponse {
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

    if (playerName && !this.players.some((p) => p.id === playerId)) {
      this.players.push({
        id: playerId,
        name: playerName.trim(),
        total_score: 0,
        created_at: new Date().toISOString(),
      });
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
    const parsedClientStart = clientStartedAt ? new Date(clientStartedAt).getTime() : NaN;
    const startTime = attempt
      ? new Date(attempt.started_at).getTime()
      : !isNaN(parsedClientStart)
      ? parsedClientStart
      : completedAt.getTime() - 30000;
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
    if (!verifyAdminPin(adminPin)) {
      return { success: false, error: 'Virheellinen Admin PIN-koodi.' };
    }

    const cleanKey = nodeKey.trim().toUpperCase();
    const node = this.getNode(cleanKey);
    if (!node) {
      return { success: false, error: 'Tehtävää ei löydy.' };
    }

    const unlockedAt = isActive ? new Date().toISOString() : null;
    node.is_active = isActive;
    node.unlocked_at = unlockedAt;

    this.nodeOverrides[cleanKey] = {
      is_active: isActive,
      unlocked_at: unlockedAt,
      updated_at: Date.now(),
    };

    return { success: true, node: { ...node } };
  }

  public syncNodeStates(clientStates?: Record<string, boolean>) {
    if (!clientStates || typeof clientStates !== 'object') return;
    for (const [rawKey, activeVal] of Object.entries(clientStates)) {
      const cleanKey = rawKey.trim().toUpperCase();
      const node = this.getNode(cleanKey);
      if (!node) continue;
      if (this.nodeOverrides[cleanKey] === undefined) {
        const isActive = Boolean(activeVal);
        const unlockedAt = isActive ? node.unlocked_at || new Date().toISOString() : null;
        node.is_active = isActive;
        node.unlocked_at = unlockedAt;
        this.nodeOverrides[cleanKey] = {
          is_active: isActive,
          unlocked_at: unlockedAt,
          updated_at: Date.now(),
        };
      }
    }
  }

  public updateNodeVideo(nodeKey: string, videoUrl: string, adminPin: string): { success: boolean; error?: string; node?: GameNode } {
    if (adminPin !== ADMIN_PIN) {
      return { success: false, error: 'Virheellinen Admin PIN-koodi.' };
    }

    const node = this.getNode(nodeKey);
    if (!node) {
      return { success: false, error: 'Tehtävää ei löydy.' };
    }

    node.video_url = videoUrl.trim();
    return { success: true, node };
  }

  public getLeaderboard(): LeaderboardData {
    this.recalculateAllScores();
    const players = this.getPlayers();
    const recentSolves = this.attempts
      .filter((a) => a.is_completed && Boolean(this.getPlayer(a.player_id)))
      .sort((a, b) => new Date(b.completed_at || 0).getTime() - new Date(a.completed_at || 0).getTime())
      .slice(0, 30)
      .map((a) => {
        const p = this.getPlayer(a.player_id)!;
        return {
          ...a,
          player_name: p.name,
        };
      });

    return { players, recent_solves: recentSolves, reset_at: Math.max(INITIAL_LOCK_EPOCH, this.resetAt) } as LeaderboardData;
  }

  public syncClientData(clientPlayers?: Player[], clientAttempts?: TaskAttempt[], clientResetAt?: number) {
    if (clientResetAt && clientResetAt > this.resetAt) {
      this.resetAll(clientResetAt);
    }

    const minValidEpoch = Math.max(INITIAL_LOCK_EPOCH, this.resetAt || 0);

    if (Array.isArray(clientPlayers)) {
      for (const cp of clientPlayers) {
        if (!cp || !cp.id || !cp.name) continue;
        const createdTime = cp.created_at ? new Date(cp.created_at).getTime() : 0;
        if (createdTime && createdTime < minValidEpoch) continue;

        const existing = this.players.find(
          (p) => p.id === cp.id || p.name.toLowerCase() === cp.name.trim().toLowerCase()
        );
        if (!existing) {
          this.players.push({
            id: cp.id,
            name: cp.name.trim(),
            total_score: cp.total_score || 0,
            created_at: cp.created_at || new Date().toISOString(),
          });
        } else if ((cp.total_score || 0) > (existing.total_score || 0)) {
          existing.total_score = cp.total_score;
        }
      }
    }

    const validPlayerIds = new Set(this.players.map((p) => p.id));

    if (Array.isArray(clientAttempts)) {
      for (const ca of clientAttempts) {
        if (!ca || !ca.player_id || !ca.node_key) continue;
        // Hylätään orvot suoritukset (pelaajaa ei ole olemassa) sekä nollausta vanhemmat suoritukset
        if (!validPlayerIds.has(ca.player_id)) continue;
        const startT = ca.started_at ? new Date(ca.started_at).getTime() : 0;
        const compT = ca.completed_at ? new Date(ca.completed_at).getTime() : startT;
        if (startT && startT < minValidEpoch) continue;
        if (compT && compT < minValidEpoch) continue;

        const existing = this.attempts.find(
          (a) =>
            a.player_id === ca.player_id &&
            a.node_key.toUpperCase() === ca.node_key.toUpperCase()
        );
        if (!existing) {
          this.attempts.push({ ...ca });
        } else if (ca.is_completed && !existing.is_completed) {
          existing.completed_at = ca.completed_at || new Date().toISOString();
          existing.duration_seconds = ca.duration_seconds ?? existing.duration_seconds ?? 30;
          existing.awarded_points = ca.awarded_points || 100;
          existing.is_completed = true;
        }
      }
    }

    this.recalculateAllScores();
  }

  public getPlayerAttempts(playerId: string): TaskAttempt[] {
    this.recalculateAllScores();
    return this.attempts.filter((a) => a.player_id === playerId);
  }

  public resetAll(customResetAt?: number) {
    this.nodes.splice(
      0,
      this.nodes.length,
      ...INITIAL_NODES.map((n) => ({
        ...n,
        is_active: false,
        unlocked_at: null,
      }))
    );
    this.nodeOverrides = {};
    this.players.splice(0, this.players.length);
    this.attempts.splice(0, this.attempts.length);
    this.resetAt = customResetAt || Date.now();
  }
}

export const inMemoryDb = new InMemoryGameDatabase();
globalForGame.inMemoryDb = inMemoryDb;

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
        inMemoryDb.loginOrRegister(cleanName, cleanPin);
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

      if (!error && newPlayer) {
        inMemoryDb.loginOrRegister(cleanName, cleanPin);
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
      }
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
      // Check existing attempt first
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

      if (!error && created) {
        inMemoryDb.startTask(playerId, cleanKey);
        return {
          success: true,
          node_key: cleanKey,
          started_at: created.started_at,
          startedAt: created.started_at,
          already_started: false,
          is_completed: false,
          isCompleted: false,
        };
      }
    } catch {
      // Fallback to inMemoryDb
    }
  }

  const memResult = inMemoryDb.startTask(playerId, cleanKey);
  if (!memResult.success) {
    const nowIso = new Date().toISOString();
    return {
      success: true,
      node_key: cleanKey,
      started_at: nowIso,
      startedAt: nowIso,
      already_started: false,
      is_completed: false,
      isCompleted: false,
    };
  }
  return memResult;
}

export async function handleCheckCode(
  playerId: string,
  nodeKey: string,
  inputCode: string,
  clientStartedAt?: string,
  playerName?: string
): Promise<CheckCodeResponse> {
  const cleanKey = nodeKey.trim().toUpperCase();
  const sb = getSupabaseServerClient();

  if (sb) {
    try {
      const { data: node } = await sb
        .from('game_nodes')
        .select('secret_code, is_active')
        .eq('node_key', cleanKey)
        .maybeSingle();

      if (!isNodeCodeValid(cleanKey, inputCode, node?.secret_code)) {
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
      const parsedClientStart = clientStartedAt ? new Date(clientStartedAt).getTime() : NaN;
      const startTime = attempt
        ? new Date(attempt.started_at).getTime()
        : !isNaN(parsedClientStart)
        ? parsedClientStart
        : completedAt.getTime() - 30000;
      const durationSeconds = Math.max(1, Math.round((completedAt.getTime() - startTime) / 1000));

      if (!attempt) {
        const { data: newAttempt, error: insError } = await sb
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
        if (insError) {
          return inMemoryDb.checkCode(playerId, cleanKey, inputCode, clientStartedAt, playerName);
        }
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

      inMemoryDb.checkCode(playerId, cleanKey, inputCode, clientStartedAt, playerName);

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

  return inMemoryDb.checkCode(playerId, cleanKey, inputCode, clientStartedAt, playerName);
}

export async function handleToggleNode(
  nodeKey: string,
  isActive: boolean,
  adminPin: string
): Promise<{ success: boolean; error?: string; node?: GameNode }> {
  if (!verifyAdminPin(adminPin)) {
    return { success: false, error: 'Virheellinen Admin PIN-koodi.' };
  }

  const cleanKey = nodeKey.trim().toUpperCase();
  const memResult = inMemoryDb.toggleNode(cleanKey, isActive, adminPin.trim());
  if (!memResult.success || !memResult.node) {
    return memResult;
  }

  const sb = getSupabaseServerClient();
  if (sb) {
    try {
      const unlockedAt = memResult.node.unlocked_at;
      const { data, error } = await sb
        .from('game_nodes')
        .update({
          is_active: isActive,
          unlocked_at: unlockedAt,
        })
        .eq('node_key', cleanKey)
        .select()
        .maybeSingle();

      if (!error && data) {
        return { success: true, node: { ...memResult.node, is_active: isActive, unlocked_at: unlockedAt } };
      }

      // Jos riviä ei vielä ollut Supabasessa, yritetään upsertata solmu
      await sb
        .from('game_nodes')
        .upsert(
          {
            node_key: memResult.node.node_key,
            title: memResult.node.title,
            target_person: memResult.node.target_person,
            secret_code: memResult.node.secret_code || '1888',
            video_url: memResult.node.video_url,
            is_active: isActive,
            unlocked_at: unlockedAt,
            story_text: memResult.node.story_text || '',
            role_hint: memResult.node.role_hint || '',
          },
          { onConflict: 'node_key' }
        );
    } catch {
      // Fallback to inMemoryDb
    }
  }

  return memResult;
}

export async function handleUpdateNodeVideo(
  nodeKey: string,
  videoUrl: string,
  adminPin: string
): Promise<{ success: boolean; error?: string; node?: GameNode }> {
  if (!verifyAdminPin(adminPin)) {
    return { success: false, error: 'Virheellinen Admin PIN-koodi.' };
  }

  const cleanKey = nodeKey.trim().toUpperCase();
  const cleanUrl = videoUrl.trim();
  const memRes = inMemoryDb.updateNodeVideo(cleanKey, cleanUrl, adminPin.trim());
  const sb = getSupabaseServerClient();

  if (sb) {
    try {
      const { data, error } = await sb
        .from('game_nodes')
        .update({ video_url: cleanUrl })
        .eq('node_key', cleanKey)
        .select()
        .maybeSingle();

      if (!error && data) {
        return { success: true, node: data };
      }
    } catch {
      // Fallback
    }
  }

  return memRes;
}

export async function getGameNodes(
  includeSecrets = false,
  clientNodeStates?: Record<string, boolean>
): Promise<GameNode[]> {
  if (clientNodeStates) {
    inMemoryDb.syncNodeStates(clientNodeStates);
  }

  const sb = getSupabaseServerClient();
  const minUnlockEpoch = Math.max(INITIAL_LOCK_EPOCH, inMemoryDb.resetAt || 0);

  if (sb) {
    try {
      const { data, error } = await sb
        .from('game_nodes')
        .select('*')
        .order('node_key', { ascending: true });

      if (!error && data && data.length > 0) {
        return (data as unknown as GameNode[]).map((node) => {
          const copy = { ...node };
          const cleanKey = copy.node_key.trim().toUpperCase();
          const override = inMemoryDb.nodeOverrides[cleanKey];

          if (override !== undefined) {
            copy.is_active = override.is_active;
            copy.unlocked_at = override.unlocked_at;
          } else if (copy.is_active) {
            // Varmistetaan, että vanhat (ennen pelin nollausta/aloitusta tehdyt) avaukset ovat lukittuja
            const unlockedTime = copy.unlocked_at ? new Date(copy.unlocked_at).getTime() : 0;
            if (!unlockedTime || unlockedTime < minUnlockEpoch) {
              copy.is_active = false;
              copy.unlocked_at = null;
            }
          }

          if (
            !copy.video_url ||
            copy.video_url.includes('pub-xxx.r2.dev') ||
            copy.video_url.includes('pub-xxxxxx.r2.dev')
          ) {
            const fallback = INITIAL_NODES.find((n) => n.node_key === copy.node_key);
            if (fallback) copy.video_url = fallback.video_url;
          }
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

export async function getLeaderboard(
  clientPlayers?: Player[],
  clientAttempts?: TaskAttempt[],
  clientResetAt?: number
): Promise<LeaderboardData> {
  if (
    (clientPlayers && clientPlayers.length > 0) ||
    (clientAttempts && clientAttempts.length > 0) ||
    clientResetAt
  ) {
    inMemoryDb.syncClientData(clientPlayers, clientAttempts, clientResetAt);
  }

  const sb = getSupabaseServerClient();
  const memBoard = inMemoryDb.getLeaderboard();
  const minValidEpoch = Math.max(INITIAL_LOCK_EPOCH, inMemoryDb.resetAt || 0);

  if (sb) {
    try {
      const { data: players } = await sb
        .from('players')
        .select('id, name, total_score, created_at')
        .order('total_score', { ascending: false });

      const { data: solves } = await sb
        .from('task_attempts')
        .select('id, player_id, node_key, started_at, completed_at, duration_seconds, awarded_points, is_completed')
        .eq('is_completed', true)
        .order('completed_at', { ascending: false })
        .limit(30);

      const validSbPlayers = (players || []).filter((p: any) => {
        const t = p.created_at ? new Date(p.created_at).getTime() : 0;
        return !t || t >= minValidEpoch;
      });

      if (validSbPlayers.length > 0) {
        const mergedPlayerMap = new Map<string, Player>();
        for (const p of validSbPlayers) {
          mergedPlayerMap.set(p.id, p);
        }
        for (const mp of memBoard.players) {
          const existing = Array.from(mergedPlayerMap.values()).find(
            (x) => x.id === mp.id || x.name.toLowerCase() === mp.name.toLowerCase()
          );
          if (!existing) {
            mergedPlayerMap.set(mp.id, mp);
          } else if (mp.total_score > existing.total_score) {
            existing.total_score = mp.total_score;
          }
        }

        const mergedPlayers = Array.from(mergedPlayerMap.values()).sort(
          (a, b) => b.total_score - a.total_score
        );

        const playerMap = new Map<string, string>();
        for (const p of mergedPlayers) {
          playerMap.set(p.id, p.name);
        }

        const formattedSolves: TaskAttempt[] = (solves || [])
          .filter((s: any) => {
            if (!playerMap.has(s.player_id)) return false;
            const compT = s.completed_at ? new Date(s.completed_at).getTime() : 0;
            return !compT || compT >= minValidEpoch;
          })
          .map((s: any) => ({
            id: s.id,
            player_id: s.player_id,
            player_name: playerMap.get(s.player_id)!,
            node_key: s.node_key,
            started_at: s.started_at,
            completed_at: s.completed_at,
            duration_seconds: s.duration_seconds,
            awarded_points: s.awarded_points,
            is_completed: s.is_completed,
          }));

        for (const ms of memBoard.recent_solves) {
          const exists = formattedSolves.some(
            (fs) =>
              fs.player_id === ms.player_id &&
              fs.node_key.toUpperCase() === ms.node_key.toUpperCase()
          );
          if (!exists) {
            formattedSolves.push(ms);
          }
        }

        return {
          players: mergedPlayers,
          recent_solves: formattedSolves,
          reset_at: minValidEpoch,
        } as LeaderboardData;
      }
    } catch {
      // Fallback
    }
  }

  return memBoard;
}

export async function getPlayerAttempts(playerId: string): Promise<TaskAttempt[]> {
  const minValidEpoch = Math.max(INITIAL_LOCK_EPOCH, inMemoryDb.resetAt || 0);
  const sb = getSupabaseServerClient();
  if (sb) {
    try {
      const { data } = await sb
        .from('task_attempts')
        .select('*')
        .eq('player_id', playerId);
      if (data && data.length > 0) {
        return data.filter((a: any) => {
          const t = a.started_at ? new Date(a.started_at).getTime() : 0;
          return !t || t >= minValidEpoch;
        });
      }
    } catch {
      // Fallback
    }
  }
  return inMemoryDb.getPlayerAttempts(playerId);
}

export async function handleResetGame(adminPin: string): Promise<{ success: boolean; resetAt?: number; error?: string }> {
  if (!verifyAdminPin(adminPin)) {
    return { success: false, error: 'Virheellinen Admin PIN-koodi. Pääsy evätty.' };
  }

  const sb = getSupabaseServerClient();
  if (sb) {
    try {
      await sb.from('task_attempts').delete().neq('node_key', '');
      await sb.from('players').delete().neq('name', '');
      await sb
        .from('game_nodes')
        .update({ is_active: false, unlocked_at: null })
        .neq('node_key', '');
    } catch {
      // Fallback
    }
  }

  const nowReset = Date.now();
  inMemoryDb.resetAll(nowReset);
  return { success: true, resetAt: nowReset };
}
