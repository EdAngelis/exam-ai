import { type Request, type Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { response } from "./response";
import {
  signIn,
  fetchUser,
  fetchUserByEmail,
  createUser,
  updateUser,
  ensureGameInviteCode,
} from "../repository/user.repository";
import { comparePasswords } from "../tools/crypto";
import {
  generateToken,
  verifyToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../tools/jwt";
import { type UserT } from "../models/user.model";
import config from "../config/config";

const googleClient = new OAuth2Client(config.google_client_id);

const signInMobileController = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await signIn(email);
    // Return the same generic 401 whether the email is unknown or the password
    // is wrong: avoids leaking which emails have accounts (user enumeration) and
    // gives the app one consistent "bad login" case to handle instead of a 404.
    if (!user || !(await comparePasswords(password, user.password))) {
      response(res, {
        message: "Invalid email or password",
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

    const accessToken = generateToken({ email });
    const refreshToken = generateRefreshToken({ email });
    await updateUser(user._id, { refreshToken } as UserT);

    const userWithInviteCode = await ensureGameInviteCode(user._id);
    if (!userWithInviteCode) {
      response(res, {
        message: "User not found",
        data: null,
        status: 404,
      });
      return;
    }

    userWithInviteCode.password = undefined;
    response(res, {
      message: "Sign-in successful",
      data: { user: userWithInviteCode, accessToken, refreshToken },
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

const refreshMobileController = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      response(res, {
        message: "Refresh token is required",
        data: null,
        status: 400,
      });
      return;
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      response(res, {
        message: "Invalid or expired refresh token",
        data: null,
        status: 403,
      });
      return;
    }

    const user = await fetchUserByEmail(decoded.email);
    if (!user || user.refreshToken !== refreshToken) {
      response(res, {
        message: "Invalid or expired refresh token",
        data: null,
        status: 403,
      });
      return;
    }

    const accessToken = generateToken({ email: decoded.email });
    const newRefreshToken = generateRefreshToken({ email: decoded.email });
    await updateUser(user._id, { refreshToken: newRefreshToken } as UserT);

    response(res, {
      message: "Token refreshed successfully",
      data: { accessToken, refreshToken: newRefreshToken },
      status: 200,
    });
    return;
  } catch (error) {
    response(res, {
      message: `Error refreshing token: ${error}`,
      data: null,
      status: 500,
    });
    return;
  }
};

const meMobileController = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const decoded = token ? verifyToken(token) : null;
    if (!decoded) {
      response(res, { message: "Unauthorized", data: null, status: 401 });
      return;
    }

    const user = await fetchUserByEmail(decoded.email);
    if (!user) {
      response(res, { message: "User not found", data: null, status: 404 });
      return;
    }

    const userWithInviteCode = await ensureGameInviteCode(user._id);

    response(res, {
      message: "User fetched successfully",
      data: userWithInviteCode,
      status: 200,
    });
    return;
  } catch (error) {
    response(res, {
      message: `Error fetching current user: ${error}`,
      data: null,
      status: 500,
    });
    return;
  }
};

const googleMobileController = async (req: Request, res: Response) => {
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
      audience: config.google_client_id,
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

    const userWithInviteCode = await ensureGameInviteCode(user._id);
    if (!userWithInviteCode) {
      response(res, {
        message: "User not found",
        data: null,
        status: 404,
      });
      return;
    }

    const accessToken = generateToken({ email: payload.email });
    const refreshToken = generateRefreshToken({ email: payload.email });
    await updateUser(userWithInviteCode._id, { refreshToken } as UserT);

    response(res, {
      message: "Google sign-in successful",
      data: { user: userWithInviteCode, accessToken, refreshToken },
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

export {
  signInMobileController,
  refreshMobileController,
  meMobileController,
  googleMobileController,
};
