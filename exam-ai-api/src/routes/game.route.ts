import express from "express";
import checkAppKey from "../middlewares/app-key";
import authenticateToken from "../middlewares/token";
import {
  acceptGameController,
  createGameController,
  getGameController,
  getGameResultController,
  getPlayableGameController,
  listGamesController,
  startGameController,
  submitAnswersController,
  updateTimeLimitController,
} from "../controller/game.controller";
import {
  validateCreateGame,
  validateGameSubmission,
  validateUpdateTimeLimit,
} from "../middlewares/validators/game.validator";

const router = express.Router();

router.use(checkAppKey, authenticateToken);

router.post("/", validateCreateGame, createGameController);
router.get("/", listGamesController);
router.get("/:id", getGameController);
router.post("/:id/accept", acceptGameController);
router.post("/:id/start", startGameController);
router.put("/:id/time-limit", validateUpdateTimeLimit, updateTimeLimitController);
router.get("/:id/play", getPlayableGameController);
router.post("/:id/submission", validateGameSubmission, submitAnswersController);
router.get("/:id/result", getGameResultController);

export default router;
