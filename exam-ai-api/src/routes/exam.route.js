import express from "express";
import checkApiKey from "../middlewares/api-key";
import {
  createExam,
  fetchExam,
  fetchExams,
  updateResults,
  deleteExamController,
  fetchExamsByUserEmail,
  createStudentsExams,
} from "../controller/exam.controller";

const router = express.Router();

router.post("/", checkApiKey, createExam);
router.post("/students-exams", checkApiKey, createStudentsExams);
router.get("/:id", checkApiKey, fetchExam);
router.get("/", checkApiKey, fetchExams);
router.put("/:id", checkApiKey, updateResults);
router.delete("/:id", checkApiKey, deleteExamController);
router.get("/:userEmail/by-user-email", checkApiKey, fetchExamsByUserEmail);

export default router;
