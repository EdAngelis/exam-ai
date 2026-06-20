import { ObjectId } from "mongodb";
import { ensureCollection } from "../models/index";
import { getCollection, type UserT } from "../models/user.model";

const createUser = async (user: UserT) => {
  const User = await getCollection();
  ensureCollection<UserT>(User);
  user.created_at = new Date();
  return await User.insertOne(user);
};

const fetchUser = async (id: string) => {
  const User = await getCollection();
  ensureCollection<UserT>(User);
  const user = await User.findOne(
    { _id: new ObjectId(id) },
    { projection: { password: 0 } },
  );
  return user;
};

const fetchUserByEmail = async (email: string) => {
  const User = await getCollection();
  ensureCollection<UserT>(User);
  const user = await User.findOne({ email }, { projection: { password: 0 } });
  return user;
};

const signIn = async (email: string) => {
  const User = await getCollection();
  ensureCollection<UserT>(User);
  const user = await User.findOne({ email });
  return user;
};

const updateUser = async (id: ObjectId, updateData: UserT) => {
  const User = await getCollection();
  ensureCollection<UserT>(User);
  const updatedUser = await User.findOneAndUpdate(
    { _id: id },
    { $set: updateData },
  );
  return updatedUser;
};

const deleteUser = async (id: string) => {
  const User = await getCollection();
  ensureCollection<UserT>(User);
  const result = await User.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { active: false } },
  );
  return result;
};

const getAllUsers = async () => {
  const User = await getCollection();
  ensureCollection<UserT>(User);
  return await User.find({}, { projection: { password: 0 } })?.toArray();
};

const findByValidationToken = async (validationToken: string) => {
  const User = await getCollection();
  ensureCollection<UserT>(User);
  const user = await User.findOne({
    validationToken,
  });
  return user;
};

const insertStudent = async (userEmail: string, studentEmail: string) => {
  const User = await getCollection();
  ensureCollection<UserT>(User);
  const updatedUser = await User.findOneAndUpdate(
    { email: userEmail },
    { $addToSet: { students: studentEmail } },
    { returnDocument: "after" },
  );
  return updatedUser;
};

const removeStudent = async (userEmail: string, studentEmail: string) => {
  const User = await getCollection();
  ensureCollection<UserT>(User);
  const updatedUser = await User.findOneAndUpdate(
    { email: userEmail },
    { $pull: { students: studentEmail } },
    { returnDocument: "after" },
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
