import express from "express";
import checkAppKey from "../middlewares/app-key";
import {
  fetchCategories,
  fetchSubCategories,
  fetchQuestions,
  generateQuestions,
  regenerateQuestions,
} from "../controller/questions.controller";

const router = express.Router();

router.post("/generate", checkAppKey, generateQuestions);
router.post("/regenerate-questions", checkAppKey, regenerateQuestions);
router.get("/categories/:userEmail", checkAppKey, fetchCategories);
router.get("/subcategories", checkAppKey, fetchSubCategories);
router.get("/", checkAppKey, fetchQuestions);

export default router;
