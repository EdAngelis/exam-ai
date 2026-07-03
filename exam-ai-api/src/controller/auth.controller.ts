import { type Request, type Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { response } from "./response";
import {
  signIn,
  findByValidationToken,
  updateUser,
  fetchUser,
  fetchUserByEmail,
  createUser,
} from "../repository/user.repository";
import { comparePasswords, hashPassword } from "../tools/crypto";
import { generateToken, verifyToken } from "../tools/jwt";
import { generateValidationEmailToken } from "../tools/email-token";
import { sendEmailToken, sendChangePasswordToken } from "../emails/index";
import { type UserT } from "../models/user.model";
import config from "../config/config";

const googleClient = new OAuth2Client();

const signInController = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await signIn(email);
    if (!user) {
      response(res, {
        message: "User not found",
        data: null,
        status: 404,
      });
      return;
    }
    const passwordMatch = await comparePasswords(password, user!.password);
    if (!passwordMatch) {
      response(res, {
        message: "Invalid credentials",
        data: null,
        status: 401,
      });
      return;
    }

    if (!user.active) {
      response(res, {
        message: "User email not verified",
        data: null,
        status: 403,
      });
      return;
    }

    user.password = undefined;
    const token = generateToken({ email });
    response(res, {
      message: "Sign-in successful",
      data: user,
      token,
      status: 200,
    });
    return;
  } catch (error) {
    response(res, {
      message: `Error during sign-in: ${error}`,
      data: null,
      status: 500,
    });
    return;
  }
};

// Mints a backend JWT for a web (NextAuth) Google sign-in. The web app's
// signIn callback already upserts the user via POST /users before this runs,
// so this mostly fetches the existing user; it also creates one defensively
// in case that upsert hasn't landed yet.
const googleWebController = async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      response(res, {
        message: "Google ID token is required",
        data: null,
        status: 400,
      });
      return;
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: config.google_client_id_web,
    });
    const payload = ticket.getPayload();
    if (!payload?.email) {
      response(res, {
        message: "Invalid Google ID token",
        data: null,
        status: 401,
      });
      return;
    }

    let user = await fetchUserByEmail(payload.email);
    if (!user) {
      const newUser: UserT = {
        email: payload.email,
        name: payload.name,
        active: true,
        level: 1,
        created_at: new Date(),
        updated_at: new Date(),
      };
      const result = await createUser(newUser);
      user = await fetchUser(result.insertedId.toString());
    }

    if (!user) {
      response(res, {
        message: "Error creating user",
        data: null,
        status: 500,
      });
      return;
    }

    const token = generateToken({ email: payload.email });
    user.password = undefined;
    response(res, {
      message: "Google sign-in successful",
      data: user,
      token,
      status: 200,
    });
    return;
  } catch (error) {
    response(res, {
      message: `Error during Google sign-in: ${error}`,
      data: null,
      status: 500,
    });
    return;
  }
};

const validateEmail = async (req: Request, res: Response) => {
  try {
    const { validationToken } = req.params;
    const user = await findByValidationToken(validationToken);
    if (!user) {
      response(res, {
        message: "Code verification Invalid",
        data: null,
        status: 404,
      });
      return;
    }

    const updatedUser = await updateUser(user._id, {
      validationToken: "",
      active: true,
    });

    response(res, {
      message: "Email validated successfully",
      data: updatedUser,
      status: 200,
    });
    return;
  } catch (error) {
    response(res, {
      message: `Error validating email: ${error}`,
      data: null,
      status: 500,
    });
    return;
  }
};

const resendValidationToken = async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    const user = await fetchUserByEmail(email);
    if (!user) {
      response(res, {
        message: "User not found",
        data: null,
        status: 404,
      });
      return;
    }

    if (user.active) {
      response(res, {
        message: "User is already active",
        data: null,
        status: 400,
      });
      return;
    }

    const validationToken: string = generateValidationEmailToken();
    const tokenUpdated = await updateUser(user._id, {
      validationToken,
    } as UserT);

    if (!tokenUpdated) {
      response(res, {
        message: "Error updating user",
        data: null,
        status: 500,
      });
      return;
    }

    await sendEmailToken(email, validationToken);

    response(res, {
      message: "Validation token re-sent successfully",
      data: null,
      status: 200,
    });
    return;
  } catch (error) {
    response(res, {
      message: `Error re-sending validation token: ${error}`,
      data: null,
      status: 500,
    });
    return;
  }
};

const sendResetPasswordToken = async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    const user = await fetchUserByEmail(email);
    if (!user) {
      response(res, {
        message: "User not found",
        data: null,
        status: 404,
      });
      return;
    }

    const token = generateToken({ email });

    const userUpdated = await updateUser(user._id, {
      resetPasswordToken: token,
    } as UserT);

    if (!userUpdated) {
      response(res, {
        message: "Error updating user",
        data: null,
        status: 500,
      });
      return;
    }

    await sendChangePasswordToken(email, token);

    response(res, {
      message: "Password change token sent successfully",
      data: null,
      status: 200,
    });
    return;
  } catch (error) {
    response(res, {
      message: `Error sending password change token: ${error}`,
      data: null,
      status: 500,
    });
    return;
  }
};

const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const decoded = verifyToken(token);
    console.log(decoded);
    if (!decoded || !decoded.email) {
      response(res, {
        message: "Invalid or expired token",
        data: null,
        status: 400,
      });
      return;
    }

    const user = await fetchUserByEmail(decoded.email);
    console.log(user);
    if (!user || user.resetPasswordToken !== token) {
      response(res, {
        message: "Invalid token or user not found",
        data: null,
        status: 404,
      });
      return;
    }

    const hashedPassword = await hashPassword(password);
    const updatedUser = await updateUser(user._id, {
      password: hashedPassword,
      resetPasswordToken: "",
    } as UserT);

    if (!updatedUser) {
      response(res, {
        message: "Error updating password",
        data: null,
        status: 500,
      });
      return;
    }

    response(res, {
      message: "Password changed successfully",
      data: null,
      status: 200,
    });
    return;
  } catch (error) {
    response(res, {
      message: `Error changing password: ${error}`,
      data: null,
      status: 500,
    });
    return;
  }
};

export {
  signInController,
  googleWebController,
  validateEmail,
  resendValidationToken,
  sendResetPasswordToken,
  resetPassword,
};
