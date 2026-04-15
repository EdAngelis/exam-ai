import { ObjectId, Collection } from "mongodb";
import { User } from "../models/index";
import { type UserT } from "../models/user.model";

const createUser = async (user: UserT) => {
  user.created_at = new Date();
  return await User?.insertOne(user);
};

const fetchUser = async (id: string) => {
  const user = await User?.findOne(
    { _id: new ObjectId(id) },
    { projection: { password: 0 } }
  );
  return user;
};

const fetchUserByEmail = async (email: string) => {
  const user = await User?.findOne({ email }, { projection: { password: 0 } });
  return user;
};

const signIn = async (email: string) => {
  const user = await User?.findOne({ email });
  return user;
};

const updateUser = async (id: ObjectId, updateData: UserT) => {
  const updatedUser = await User?.findOneAndUpdate(
    { _id: id },
    { $set: updateData }
  );
  return updatedUser;
};

const deleteUser = async (id: string) => {
  const result = await User?.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { active: false } }
  );
  return result;
};

const getAllUsers = async () => {
  return await User?.find({}, { projection: { password: 0 } })?.toArray();
};

const findByValidationToken = async (validationToken: string) => {
  const user = await User?.findOne({
    validationToken,
  });
  return user;
};

const insertStudent = async (userEmail: string, studentEmail: string) => {
  const updatedUser = await User.findOneAndUpdate(
    { email: userEmail },
    { $addToSet: { students: studentEmail } },
    { returnDocument: "after" }
  );
  return updatedUser;
};

const removeStudent = async (userEmail: string, studentEmail: string) => {
  const updatedUser = await User.findOneAndUpdate(
    { email: userEmail },
    { $pull: { students: studentEmail } },
    { returnDocument: "after" }
  );
  return updatedUser;
};

export {
  createUser,
  fetchUser,
  updateUser,
  deleteUser,
  getAllUsers,
  signIn,
  findByValidationToken,
  fetchUserByEmail,
  insertStudent,
  removeStudent,
};
