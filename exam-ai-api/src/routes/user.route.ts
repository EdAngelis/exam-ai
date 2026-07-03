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

// These two are invoked by the web `auth.ts` signIn/session callbacks before a
// backend JWT exists yet (they run during/just after login), so they stay on
// the checkAppKey gate only — adding authenticateToken here would break login.
router.post("/", checkAppKey, validateUser, createUserController);
router.get("/email/:email", checkAppKey, fetchUserByEmailController);

router.get("/:id", checkAppKey, authenticateToken, fetchUserController);
router.get(
  "/students/:userEmail/:studentEmail",
  checkAppKey,
  authenticateToken,
  addStudentController
);
router.delete(
  "/students/:userEmail/:studentEmail",
  checkAppKey,
  authenticateToken,
  removeStudentController
);
router.put("/:id", checkAppKey, authenticateToken, updateUserController);
router.delete("/:id", checkAppKey, authenticateToken, deleteUserController);
router.get("/", checkAppKey, authenticateToken, getAllUsersController);

export default router;
