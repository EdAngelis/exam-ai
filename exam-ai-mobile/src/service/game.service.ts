import { apiClient, type ApiEnvelope } from '@/lib/api-client';
import type {
  CreateGameInput,
  GameResult,
  GameSummary,
  PlayableGame,
  SubmissionResponse,
  SubmittedAnswer,
} from '@/types/game';

const createGame = async (input: CreateGameInput): Promise<GameSummary> => {
  const res = await apiClient.post<ApiEnvelope<GameSummary>>('games', input);
  return res.data;
};

const listGames = async (): Promise<GameSummary[]> => {
  const res = await apiClient.get<ApiEnvelope<GameSummary[]>>('games');
  return res.data ?? [];
};

const getGame = async (id: string): Promise<GameSummary> => {
  const res = await apiClient.get<ApiEnvelope<GameSummary>>(`games/${id}`);
  return res.data;
};

const acceptGame = async (id: string): Promise<GameSummary> => {
  const res = await apiClient.post<ApiEnvelope<GameSummary>>(
    `games/${id}/accept`,
  );
  return res.data;
};

const startGame = async (id: string): Promise<GameSummary> => {
  const res = await apiClient.post<ApiEnvelope<GameSummary>>(
    `games/${id}/start`,
  );
  return res.data;
};

const updateGameTimeLimit = async (
  id: string,
  timeLimitSeconds: number,
): Promise<GameSummary> => {
  const res = await apiClient.put<ApiEnvelope<GameSummary>>(
    `games/${id}/time-limit`,
    { timeLimitSeconds },
  );
  return res.data;
};

const getPlayableGame = async (id: string): Promise<PlayableGame> => {
  const res = await apiClient.get<ApiEnvelope<PlayableGame>>(
    `games/${id}/play`,
  );
  return res.data;
};

const submitGameAnswers = async (
  id: string,
  answers: SubmittedAnswer[],
): Promise<SubmissionResponse> => {
  const res = await apiClient.post<ApiEnvelope<SubmissionResponse>>(
    `games/${id}/submission`,
    { answers },
  );
  return res.data;
};

const getGameResult = async (id: string): Promise<GameResult> => {
  const res = await apiClient.get<ApiEnvelope<GameResult>>(
    `games/${id}/result`,
  );
  return res.data;
};

export {
  createGame,
  listGames,
  getGame,
  acceptGame,
  startGame,
  updateGameTimeLimit,
  getPlayableGame,
  submitGameAnswers,
  getGameResult,
};
