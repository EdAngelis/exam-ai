import express from "express";
import checkApiKey from "../middlewares/api-key";
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
router.get("/:id", checkApiKey, fetchFileController);
router.put("/:id", checkApiKey, validateFile, updateFileController);
router.delete("/:id", checkApiKey, deleteFileController);
router.get("/", checkApiKey, getAllFilesController);

export default router;
