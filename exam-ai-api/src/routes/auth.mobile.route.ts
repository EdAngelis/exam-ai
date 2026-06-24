import express from "express";
import checkMobileApiKey from "../middlewares/mobile-api-key";
import authenticateToken from "../middlewares/token";
import { validateUser } from "../middlewares/validators/user.validator";
import {
  validateSignIn,
  validatePasswordReset,
} from "../middlewares/validators/auth.validator";
import { createUserController } from "../controller/user.controller";
import {
  validateEmail,
  sendResetPasswordToken,
  resetPassword,
} from "../controller/auth.controller";
import {
  signInMobileController,
  refreshMobileController,
  meMobileController,
  googleMobileController,
} from "../controller/auth.mobile.controller";

const router = express.Router();

router.post("/signup", checkMobileApiKey, validateUser, createUserController);
router.post(
  "/signin",
  checkMobileApiKey,
  validateSignIn,
  signInMobileController
);
router.post("/refresh", checkMobileApiKey, refreshMobileController);
router.post("/google", checkMobileApiKey, googleMobileController);
router.get("/me", checkMobileApiKey, authenticateToken, meMobileController);
router.get(
  "/validate-email/:validationToken",
  checkMobileApiKey,
  validateEmail
);
router.get(
  "/send-reset-password-token/:email",
  checkMobileApiKey,
  sendResetPasswordToken
);
router.post(
  "/reset-password/:token",
  checkMobileApiKey,
  validatePasswordReset,
  resetPassword
);

export default router;
