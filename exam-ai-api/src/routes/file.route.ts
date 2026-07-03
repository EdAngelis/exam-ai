import express from "express";
import checkAppKey from "../middlewares/app-key";
import authenticateToken from "../middlewares/token";
import { validateFile } from "../middlewares/validators/file.validator";
import {
  createFileController,
  fetchFileController,
  updateFileController,
  deleteFileController,
  getAllFilesController,
} from "../controller/file.controller";
//import upload from "../services/multer";

const router = express.Router();

//router.post("/", upload.single("image"), createFileController);
router.get("/:id", checkAppKey, authenticateToken, fetchFileController);
router.put(
  "/:id",
  checkAppKey,
  authenticateToken,
  validateFile,
  updateFileController
);
router.delete("/:id", checkAppKey, authenticateToken, deleteFileController);
router.get("/", checkAppKey, authenticateToken, getAllFilesController);

export default router;
