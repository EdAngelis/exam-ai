import { Router } from "express";
import userRoutes from "./user.route";
import authRoutes from "./auth.route";
import authMobileRoutes from "./auth.mobile.route";
import fileRoutes from "./file.route";
import questionRoutes from "./questions.route";
import examRoutes from "./exam.route";
import gameRoutes from "./game.route";

const router = Router();

router.use("/users", userRoutes);
router.use("/auth/mobile", authMobileRoutes);
router.use("/auth", authRoutes);
router.use("/files", fileRoutes);
router.use("/questions", questionRoutes);
router.use("/exams", examRoutes);
router.use("/games", gameRoutes);

export default router;
