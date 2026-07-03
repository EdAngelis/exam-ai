import express from "express";
import checkAppKey from "../middlewares/app-key";
import authenticateToken from "../middlewares/token";
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

router.post("/", checkAppKey, authenticateToken, createExam);
router.post(
  "/students-exams",
  checkAppKey,
  authenticateToken,
  createStudentsExams
);
router.get("/:id", checkAppKey, authenticateToken, fetchExam);
router.get("/", checkAppKey, authenticateToken, fetchExams);
router.put("/:id", checkAppKey, authenticateToken, updateResults);
router.delete("/:id", checkAppKey, authenticateToken, deleteExamController);
router.get(
  "/:userEmail/by-user-email",
  checkAppKey,
  authenticateToken,
  fetchExamsByUserEmail
);

export default router;
