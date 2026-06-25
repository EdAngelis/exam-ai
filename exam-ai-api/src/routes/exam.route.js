import express from "express";
import checkAppKey from "../middlewares/app-key";
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

router.post("/", checkAppKey, createExam);
router.post("/students-exams", checkAppKey, createStudentsExams);
router.get("/:id", checkAppKey, fetchExam);
router.get("/", checkAppKey, fetchExams);
router.put("/:id", checkAppKey, updateResults);
router.delete("/:id", checkAppKey, deleteExamController);
router.get("/:userEmail/by-user-email", checkAppKey, fetchExamsByUserEmail);

export default router;
