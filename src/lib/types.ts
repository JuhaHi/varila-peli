export interface Player {
  id: string;
  name: string;
  pin_code?: string;
  total_score: number;
  created_at?: string;
}

export interface GameNode {
  node_key: string;
  title: string;
  target_person: string;
  secret_code?: string;
  video_url: string;
  is_active: boolean;
  unlocked_at?: string | null;
  story_text?: string;
  role_hint?: string;
}

export interface TaskAttempt {
  id: string;
  player_id: string;
  player_name?: string;
  node_key: string;
  started_at: string;
  completed_at?: string | null;
  duration_seconds?: number | null;
  awarded_points: number;
  is_completed: boolean;
}

export interface AuthLoginResponse {
  success: boolean;
  player?: Player;
  message?: string;
  error?: string;
}

export interface StartTaskResponse {
  success: boolean;
  node_key: string;
  started_at: string;
  startedAt?: string;
  already_started?: boolean;
  is_completed?: boolean;
  isCompleted?: boolean;
  awarded_points?: number;
  error?: string;
}

export interface CheckCodeResponse {
  success: boolean;
  points?: number;
  durationSeconds?: number;
  message: string;
  alreadySolved?: boolean;
  error?: string;
}

export interface LeaderboardData {
  players: Player[];
  recent_solves: TaskAttempt[];
}
