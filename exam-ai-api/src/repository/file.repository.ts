import { ObjectId } from "mongodb";
import { type FileT } from "../models/file.model";
import { File } from "../models/index";
import initializeDb from "../db/db";

const createFile = async (file: FileT) => {
  file.created_at = new Date();
  return await File.insertOne(file);
};

const fetchFile = async (id: string) => {
  const file = await File.findOne({ _id: new ObjectId(id) });
  return file;
};

const getAllFiles = async () => {
  return await File.find({}).toArray();
};

const updateFile = async (id: string, updateData: Partial<FileT>) => {
  const updatedFile = await File.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: updateData },
    { returnDocument: "after" }
  );
  return updatedFile;
};

const deleteFile = async (id: string) => {
  const result = await File.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { active: false } }
  );
  return result;
};

export { createFile, fetchFile, getAllFiles, updateFile, deleteFile };
