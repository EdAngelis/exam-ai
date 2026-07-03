import express from "express";
import checkAppKey from "../middlewares/app-key";
import authenticateToken from "../middlewares/token";
import {
  fetchCategories,
  fetchSubCategories,
  fetchQuestions,
  generateQuestions,
  regenerateQuestions,
} from "../controller/questions.controller";

const router = express.Router();

router.post(
  "/generate",
  checkAppKey,
  authenticateToken,
  generateQuestions
);
router.post(
  "/regenerate-questions",
  checkAppKey,
  authenticateToken,
  regenerateQuestions
);
router.get(
  "/categories/:userEmail",
  checkAppKey,
  authenticateToken,
  fetchCategories
);
router.get(
  "/subcategories",
  checkAppKey,
  authenticateToken,
  fetchSubCategories
);
router.get("/", checkAppKey, authenticateToken, fetchQuestions);

export default router;
