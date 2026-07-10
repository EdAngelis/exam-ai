import {
  CreateGameInput,
  GameResult,
  GameSummary,
  PlayableGame,
  SubmissionResponse,
  SubmittedAnswer,
} from "../models";

const createGame = async (input: CreateGameInput): Promise<GameSummary> => {
  const response = await fetch("/api/proxy?path=games", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  const result = await response.json();
  if (!result.data) {
    throw new Error(result.message || "Não foi possível criar o jogo.");
  }
  return result.data;
};

const listGames = async (): Promise<GameSummary[]> => {
  const response = await fetch("/api/proxy?path=games", { cache: "no-store" });
  const result = await response.json();
  return result.data ?? [];
};

const getGame = async (id: string): Promise<GameSummary> => {
  const response = await fetch(`/api/proxy?path=games/${id}`, {
    cache: "no-store",
  });
  const result = await response.json();
  if (!result.data) {
    throw new Error(result.message || "Jogo não encontrado.");
  }
  return result.data;
};

const acceptGame = async (id: string): Promise<GameSummary> => {
  const response = await fetch(`/api/proxy?path=games/${id}/accept`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const result = await response.json();
  if (!result.data) {
    throw new Error(result.message || "Não foi possível aceitar o convite.");
  }
  return result.data;
};

const startGame = async (id: string): Promise<GameSummary> => {
  const response = await fetch(`/api/proxy?path=games/${id}/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const result = await response.json();
  if (!result.data) {
    throw new Error(result.message || "Não foi possível iniciar o jogo.");
  }
  return result.data;
};

const getPlayableGame = async (id: string): Promise<PlayableGame> => {
  const response = await fetch(`/api/proxy?path=games/${id}/play`, {
    cache: "no-store",
  });
  const result = await response.json();
  if (!result.data) {
    throw new Error(result.message || "Não foi possível carregar o jogo.");
  }
  return result.data;
};

const submitGameAnswers = async (
  id: string,
  answers: SubmittedAnswer[],
): Promise<SubmissionResponse> => {
  const response = await fetch(`/api/proxy?path=games/${id}/submission`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ answers }),
  });
  const result = await response.json();
  if (!result.data) {
    throw new Error(result.message || "Não foi possível enviar as respostas.");
  }
  return result.data;
};

const getGameResult = async (id: string): Promise<GameResult> => {
  const response = await fetch(`/api/proxy?path=games/${id}/result`, {
    cache: "no-store",
  });
  const result = await response.json();
  if (!result.data) {
    throw new Error(result.message || "Resultado ainda não está pronto.");
  }
  return result.data;
};

export {
  createGame,
  listGames,
  getGame,
  acceptGame,
  startGame,
  getPlayableGame,
  submitGameAnswers,
  getGameResult,
};
