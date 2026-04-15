import express from "express";
import checkApiKey from "../middlewares/api-key";
import {
  fetchCategories,
  fetchSubCategories,
  fetchQuestions,
  generateQuestions,
  regenerateQuestions,
} from "../controller/questions.controller";

const router = express.Router();

router.post("/generate", checkApiKey, generateQuestions);
router.post("/regenerate-questions", checkApiKey, regenerateQuestions);
router.get("/categories/:userEmail", checkApiKey, fetchCategories);
router.get("/subcategories", checkApiKey, fetchSubCategories);
router.get("/", checkApiKey, fetchQuestions);

export default router;
