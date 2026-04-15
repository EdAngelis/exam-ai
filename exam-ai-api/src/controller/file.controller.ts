import {
  createFile,
  fetchFile,
  updateFile,
  deleteFile,
  getAllFiles,
} from "../repository/file.repository";
import { response } from "./response";
import "dotenv/config";
import { type Request, type Response } from "express";

export const createFileController = async (req: Request, res: Response) => {
  try {
    const file = req.body;
    // const result = await createFile(file);
    response(res, {
      status: 201,
      message: "File created successfully",
      data: null,
    });
  } catch (error) {
    console.dir(error, { depth: null });
    response(res, {
      status: 500,
      message: "Internal Server Error",
      data: null,
    });
  }
};

export const fetchFileController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const file = await fetchFile(id);
    if (!file) {
      response(res, {
        status: 404,
        message: "File not found",
        data: null,
      });
      return;
    }
    response(res, {
      status: 200,
      message: "File fetched successfully",
      data: file,
    });
  } catch (error) {
    console.dir(error, { depth: null });
    response(res, {
      status: 500,
      message: "Internal Server Error",
      data: null,
    });
  }
};

export const updateFileController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const updatedFile = await updateFile(id, updateData);
    if (!updatedFile) {
      response(res, {
        status: 404,
        message: "File not found",
        data: null,
      });
      return;
    }
    response(res, {
      status: 200,
      message: "File updated successfully",
      data: updatedFile,
    });
  } catch (error) {
    console.dir(error, { depth: null });
    response(res, {
      status: 500,
      message: "Internal Server Error",
      data: null,
    });
  }
};

export const deleteFileController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await deleteFile(id);
    if (!result) {
      response(res, {
        status: 404,
        message: "File not found",
        data: null,
      });
      return;
    }
    response(res, {
      status: 200,
      message: "File deleted successfully",
      data: null,
    });
  } catch (error) {
    console.dir(error, { depth: null });
    response(res, {
      status: 500,
      message: "Internal Server Error",
      data: null,
    });
  }
};

export const getAllFilesController = async (req: Request, res: Response) => {
  try {
    const files = await getAllFiles();
    response(res, {
      status: 200,
      message: "Files fetched successfully",
      data: files,
    });
  } catch (error) {
    console.dir(error, { depth: null });
    response(res, {
      status: 500,
      message: "Internal Server Error",
      data: null,
    });
  }
};
