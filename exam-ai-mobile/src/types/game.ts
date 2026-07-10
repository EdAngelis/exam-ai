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

export type PlayableOption = {
  index: number;
  label: string;
};

export type PlayableQuestion = {
  _id: string;
  question?: string;
  options?: PlayableOption[];
  category?: string;
  subCategory?: string;
  subject?: string;
  subJect?: string;
  type?: string;
  title?: string;
};

export type PlayableGame = {
  game: GameSummary;
  exam: {
    _id: string;
    category?: string;
    subCategory?: string;
    subject?: string;
    duration?: number;
    timeLimitSeconds: number;
    questions: PlayableQuestion[];
  };
};

export type SubmittedAnswer = {
  questionId: string;
  answer: number;
};

export type GameParticipantResult = {
  userId: string;
  email: string;
  score: number;
};

export type GameResult = {
  gameId: string;
  status: GameStatus;
  completionReason?: GameCompletionReason;
  completedAt?: string;
  winnerUserId: string | null;
  isDraw: boolean;
  host: GameParticipantResult;
  opponent: GameParticipantResult;
};

export type SubmissionResponse = {
  game: GameSummary;
  submission: {
    userId: string;
    userEmail: string;
    answers: SubmittedAnswer[];
    score: number;
    submittedAt: string;
  };
  result: GameResult | null;
};
