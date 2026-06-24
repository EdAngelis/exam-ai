import express from "express";
import checkAppKey from "../middlewares/app-key";
import authenticateToken from "../middlewares/token";
import { validateUser } from "../middlewares/validators/user.validator";
import {
  createUserController,
  fetchUserController,
  updateUserController,
  deleteUserController,
  getAllUsersController,
  fetchUserByEmailController,
  addStudentController,
  removeStudentController,
} from "../controller/user.controller";

const router = express.Router();

router.post("/", checkAppKey, validateUser, createUserController);
router.get("/:id", checkAppKey, fetchUserController);
router.get("/email/:email", checkAppKey, fetchUserByEmailController);
router.get(
  "/students/:userEmail/:studentEmail",
  checkAppKey,
  addStudentController
);
router.delete(
  "/students/:userEmail/:studentEmail",
  checkAppKey,
  removeStudentController
);
router.put("/:id", checkAppKey, updateUserController);
router.delete("/:id", checkAppKey, deleteUserController);
router.get("/", checkAppKey, getAllUsersController);

export default router;
