import { apiClient, type ApiEnvelope } from '@/lib/api-client';
import type { CreateGameInput, GameSummary } from '@/types/game';

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

export { createGame, listGames, getGame, acceptGame, startGame };
