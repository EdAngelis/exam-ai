import express from "express";
import checkApiKey from "../middlewares/api-key";
import authenticateToken from "../middlewares/token";
import { validateUser } from "../middlewares/validators/user.validator";
import {
  createUserController,
  fetchUserController,
  updateUserController,
  deleteUserController,
  getAllUsersController,
  fetchUserByEmailController,
} from "../controller/user.controller";

const router = express.Router();

router.post("/", checkApiKey, validateUser, createUserController);
router.get("/:id", checkApiKey, fetchUserController);
router.get("/email/:email", checkApiKey, fetchUserByEmailController);
router.put("/:id", checkApiKey, updateUserController);
router.delete("/:id", checkApiKey, deleteUserController);
router.get("/", checkApiKey, getAllUsersController);

export default router;
