import { type Request, type Response } from "express";
import { verifyToken } from "../tools/jwt";
import { response } from "./response";
import {
  acceptGame,
  createGame,
  GameRepositoryError,
  getGame,
  getPlayableGame,
  getResult,
  hydrateCurrentUser,
  listGames,
  startGame,
  submitAnswers,
  updateTimeLimit,
} from "../repository/game.repository";

const getCurrentUser = async (req: Request) => {
  const token = req.headers.authorization?.split(" ")[1];
  const decoded = token ? verifyToken(token) : null;
  if (!decoded?.email) {
    throw new GameRepositoryError(401, "Unauthorized");
  }

  const user = await hydrateCurrentUser(decoded.email);
  if (!user?._id || !user.email) {
    throw new GameRepositoryError(401, "Authenticated user not found");
  }

  return {
    _id: user._id,
    email: user.email,
  };
};

const handleGameError = (res: Response, error: unknown) => {
  if (error instanceof GameRepositoryError) {
    response(res, {
      status: error.status,
      message: error.message,
      data: null,
    });
    return;
  }

  console.dir(error, { depth: null });
  response(res, {
    status: 500,
    message: "Internal Server Error",
    data: null,
  });
};

const createGameController = async (req: Request, res: Response) => {
  try {
    const user = await getCurrentUser(req);
    const game = await createGame(user, req.body);
    response(res, {
      status: 201,
      message: "Game created successfully",
      data: game,
    });
  } catch (error) {
    handleGameError(res, error);
  }
};

const listGamesController = async (req: Request, res: Response) => {
  try {
    const user = await getCurrentUser(req);
    const games = await listGames(user);
    response(res, {
      status: 200,
      message: "Games fetched successfully",
      data: games,
    });
  } catch (error) {
    handleGameError(res, error);
  }
};

const getGameController = async (req: Request, res: Response) => {
  try {
    const user = await getCurrentUser(req);
    const game = await getGame(req.params.id, user);
    response(res, {
      status: 200,
      message: "Game fetched successfully",
      data: game,
    });
  } catch (error) {
    handleGameError(res, error);
  }
};

const acceptGameController = async (req: Request, res: Response) => {
  try {
    const user = await getCurrentUser(req);
    const game = await acceptGame(req.params.id, user);
    response(res, {
      status: 200,
      message: "Game accepted successfully",
      data: game,
    });
  } catch (error) {
    handleGameError(res, error);
  }
};

const startGameController = async (req: Request, res: Response) => {
  try {
    const user = await getCurrentUser(req);
    const game = await startGame(req.params.id, user);
    response(res, {
      status: 200,
      message: "Game started successfully",
      data: game,
    });
  } catch (error) {
    handleGameError(res, error);
  }
};

const updateTimeLimitController = async (req: Request, res: Response) => {
  try {
    const user = await getCurrentUser(req);
    const game = await updateTimeLimit(
      req.params.id,
      user,
      req.body.timeLimitSeconds
    );
    response(res, {
      status: 200,
      message: "Time limit updated successfully",
      data: game,
    });
  } catch (error) {
    handleGameError(res, error);
  }
};

const getPlayableGameController = async (req: Request, res: Response) => {
  try {
    const user = await getCurrentUser(req);
    const playData = await getPlayableGame(req.params.id, user);
    response(res, {
      status: 200,
      message: "Playable game fetched successfully",
      data: playData,
    });
  } catch (error) {
    handleGameError(res, error);
  }
};

const submitAnswersController = async (req: Request, res: Response) => {
  try {
    const user = await getCurrentUser(req);
    const result = await submitAnswers(req.params.id, user, req.body.answers);
    response(res, {
      status: 200,
      message: "Game submission saved successfully",
      data: result,
    });
  } catch (error) {
    handleGameError(res, error);
  }
};

const getGameResultController = async (req: Request, res: Response) => {
  try {
    const user = await getCurrentUser(req);
    const result = await getResult(req.params.id, user);
    response(res, {
      status: 200,
      message: "Game result fetched successfully",
      data: result,
    });
  } catch (error) {
    handleGameError(res, error);
  }
};

export {
  createGameController,
  listGamesController,
  getGameController,
  acceptGameController,
  startGameController,
  updateTimeLimitController,
  getPlayableGameController,
  submitAnswersController,
  getGameResultController,
};
