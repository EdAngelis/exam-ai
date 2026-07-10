import { ObjectId } from "mongodb";
import { ensureCollection } from "../models/index";
import { getCollection, type UserT } from "../models/user.model";

const generateGameInviteCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const createUser = async (user: UserT) => {
  const User = await getCollection();
  ensureCollection<UserT>(User);
  user.created_at = new Date();
  user.gameInviteCode = user.gameInviteCode || generateGameInviteCode();
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

const fetchUserByGameInviteCode = async (gameInviteCode: string) => {
  const User = await getCollection();
  ensureCollection<UserT>(User);
  const user = await User.findOne(
    { gameInviteCode },
    { projection: { password: 0 } }
  );
  return user;
};

const ensureGameInviteCode = async (id: ObjectId) => {
  const User = await getCollection();
  ensureCollection<UserT>(User);

  const existingUser = await User.findOne(
    { _id: id },
    { projection: { password: 0 } }
  );

  if (!existingUser || existingUser.gameInviteCode) {
    return existingUser;
  }

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const gameInviteCode = generateGameInviteCode();
    const result = await User.findOneAndUpdate(
      { _id: id, gameInviteCode: { $exists: false } },
      { $set: { gameInviteCode, updated_at: new Date() } },
      { returnDocument: "after", projection: { password: 0 } }
    );

    if (result) {
      return result;
    }
  }

  throw new Error("Unable to generate a unique game invite code.");
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
  fetchUserByGameInviteCode,
  ensureGameInviteCode,
  insertStudent,
  removeStudent,
};
