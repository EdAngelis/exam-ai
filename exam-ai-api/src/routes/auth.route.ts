import express from "express";
import checkApiKey from "../middlewares/api-key";
import {
  validateSignIn,
  validateEmailToken,
  validatePasswordReset,
} from "../middlewares/validators/auth.validator";
import {
  signInController,
  googleWebController,
  validateEmail,
  resendValidationToken,
  sendResetPasswordToken,
  resetPassword,
} from "../controller/auth.controller";
import authenticateToken from "../middlewares/token";

const router = express.Router();

router.post("/signin", checkApiKey, validateSignIn, signInController);
router.post("/google", checkApiKey, googleWebController);
router.get("/validate-email/:validationToken", checkApiKey, validateEmail);
router.get(
  "/resend-validation-token/:email",
  checkApiKey,
  resendValidationToken
);
router.get(
  "/send-reset-password-token/:email",
  checkApiKey,
  sendResetPasswordToken
);
router.post(
  "/reset-password/:token",
  checkApiKey,
  validatePasswordReset,
  resetPassword
);

export default router;
