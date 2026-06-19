import {
  createUser,
  fetchUser,
  updateUser,
  deleteUser,
  getAllUsers,
  fetchUserByEmail,
} from "../repository/user.repository";
import { ObjectId } from "mongodb";
import { response } from "./response";
import { hashPassword } from "../tools/crypto";
import sendEmailToken from "../emails/validation-token";
import { generateValidationEmailToken } from "../tools/email-token";
import { type Request, type Response } from "express";
import { type UserT } from "../models/user.model";

export const createUserController = async (req: Request, res: Response) => {
  try {
    const user = req.body;

    const existingUser = await fetchUserByEmail(user.email);

    if (existingUser) {
      response(res, {
        status: 400,
        message: "User already exists",
        data: null,
      });
      return;
    }

    user.active = true;

    if (!user.id) {
      user.password = await hashPassword(user.password);
      user.active = false;

      const token = generateValidationEmailToken();
      user.validationToken = token;
    }

    user.level = 1;
    user.created_at = new Date();
    user.updated_at = new Date();

    const result = await createUser(user);

    if (result && result.insertedId) {
      await sendEmailToken(user.email, user.validationToken);
      const createdUser = await fetchUser(result.insertedId.toString());
      response(res, {
        status: 201,
        message: "User created successfully",
        data: createdUser,
      });
      return;
    } else {
      console.error("User not created: insertOne returned", result, "for user", user.email);
      response(res, {
        status: 500,
        message: "User not created",
        data: null,
      });
      return;
    }
  } catch (error) {
    console.dir(error, { depth: null });
    response(res, {
      status: 500,
      message: "Internal Server Error",
      data: null,
    });
    return;
  }
};

export const fetchUserController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await fetchUser(id);

    if (!user) {
      response(res, {
        status: 404,
        message: "User not found",
        data: null,
      });
      return;
    }

    response(res, {
      status: 200,
      message: "User fetched successfully",
      data: user,
    });
    return;
  } catch (error) {
    console.dir(error, { depth: null });
    response(res, {
      status: 500,
      message: "Internal Server Error",
      data: null,
    });
    return;
  }
};

export const updateUserController = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const updateData = req.body;
    const updatedUser = await updateUser(new ObjectId(id), updateData);
    if (!updatedUser) {
      response(res, {
        status: 404,
        message: "User not found",
        data: null,
      });
      return;
    }

    response(res, {
      status: 200,
      message: "User updated successfully",
      data: updatedUser,
    });
    return;
  } catch (error) {
    console.dir(error, { depth: null });
    response(res, {
      status: 500,
      message: "Internal Server Error",
      data: null,
    });
    return;
  }
};

export const deleteUserController = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const result = await deleteUser(id);

    if (result && result.deletedCount === 0) {
      response(res, {
        status: 404,
        message: "User not found",
        data: null,
      });
      return;
    }

    response(res, {
      status: 200,
      message: "User deleted successfully",
      data: null,
    });
    return;
  } catch (error) {
    console.dir(error, { depth: null });
    response(res, {
      status: 500,
      message: "Internal Server Error",
      data: null,
    });
    return;
  }
};

export const getAllUsersController = async (req: Request, res: Response) => {
  try {
    const users = await getAllUsers();
    response(res, {
      status: 200,
      message: "Users fetched successfully",
      data: users,
    });
    return;
  } catch (error) {
    console.dir(error, { depth: null });
    response(res, {
      status: 500,
      message: "Internal Server Error",
      data: null,
    });
    return;
  }
};

export const fetchUserByEmailController = async (
  req: Request,
  res: Response
) => {
  try {
    const { email } = req.params;
    const user = await fetchUserByEmail(email);

    if (!user) {
      response(res, {
        status: 404,
        message: "User not found",
        data: null,
      });
      return;
    }

    response(res, {
      status: 200,
      message: "User fetched successfully",
      data: user,
    });
    return;
  } catch (error) {
    console.dir(error, { depth: null });
    response(res, {
      status: 500,
      message: "Internal Server Error",
      data: null,
    });
    return;
  }
};
