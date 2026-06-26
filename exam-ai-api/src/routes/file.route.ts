import express from "express";
import checkAppKey from "../middlewares/app-key";
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
router.get("/:id", checkAppKey, fetchFileController);
router.put("/:id", checkAppKey, validateFile, updateFileController);
router.delete("/:id", checkAppKey, deleteFileController);
router.get("/", checkAppKey, getAllFilesController);

export default router;
