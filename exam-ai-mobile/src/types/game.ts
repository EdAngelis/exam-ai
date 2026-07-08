export type GameStatus = 'pending' | 'accepted' | 'in_progress' | 'completed';
export type GameCompletionReason = 'both_submitted' | 'time_expired';

export type GameSummary = {
  _id: string;
  hostUserId: string;
  hostEmail: string;
  opponentUserId: string;
  opponentEmail: string;
  examId: string;
  status: GameStatus;
  timeLimitSeconds: number;
  winnerUserId?: string | null;
  completionReason?: GameCompletionReason;
  acceptedAt?: string;
  startedAt?: string;
  completedAt?: string;
  created_at?: string;
  updated_at?: string;
  scores: {
    host: number;
    opponent: number;
  };
};

export type CreateGameInput = {
  examId: string;
  inviteeEmail?: string;
  inviteeCode?: string;
  timeLimitSeconds?: number;
};
