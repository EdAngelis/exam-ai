import { Double, ObjectId } from "mongodb";
import { getCollection } from "../models/user.model";
import { ensureCollection } from "../models";
import { type UserT } from "../types";
import {
  type MatchesStats,
  LeaderboardFields,
} from "../types/models/user.type";

let User;

export const createUser = async (user: UserT, session: any = null) => {
  User = await getCollection();
  ensureCollection(User);
  user.created_at = new Date();
  const resp = await User.insertOne(user, { session });
  return resp;
};

export const fetchUser = async (
  id: string,
  projection: Partial<Record<keyof UserT, 1 | 0>> = { password: 0 }
) => {
  User = await getCollection();
  ensureCollection(User);
  const user = await User.findOne(
    { _id: new ObjectId(id), deleted: false },
    { projection }
  );
  return user;
};

export const fetchUserByEmail = async (
  email: string,
  projection: Partial<Record<keyof UserT, 1 | 0>> = { password: 0 }
) => {
  User = await getCollection();
  ensureCollection(User);
  const user = await User.findOne({ email, deleted: false }, { projection });
  return user;
};

export const signIn = async (
  email: string,
  projection: Partial<Record<keyof UserT, 1 | 0>>
) => {
  User = await getCollection();
  ensureCollection(User);

  const user = await User.findOne({ email, deleted: false }, { projection });

  return user;
};

export const updateUser = async (
  id: ObjectId,
  updateData: Partial<UserT>,
  projection: Partial<Record<keyof UserT, 1 | 0>>
) => {
  User = await getCollection();
  ensureCollection(User);
  const updatedUser = await User.findOneAndUpdate(
    { _id: id },
    { $set: updateData },
    { projection, returnDocument: "after" }
  );
  return updatedUser;
};

export const deleteUser = async (id: string) => {
  User = await getCollection();
  ensureCollection(User);
  const randomNumber = Math.floor(100000 + Math.random() * 900000);
  // Fetch current email to modify it and free the unique index for future accounts
  const current = await User.findOne(
    { _id: new ObjectId(id) },
    { projection: { email: 1 } }
  );

  let newEmail = current.email as string;
  const atIndex = newEmail!.indexOf("@");
  const local = newEmail!.slice(0, atIndex);
  const domain = newEmail!.slice(atIndex + 1);
  newEmail = `${local}+${randomNumber}@${domain}`;

  const result = await User.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { deleted: true, ...(newEmail ? { email: newEmail } : {}) } }
  );
  return result;
};

export const getAllUsers = async (
  query: any = {},
  limit: number,
  projection: Partial<Record<keyof UserT, 1 | 0>> = { password: 0 }
) => {
  const User = await getCollection();
  if (!User) {
    throw new Error("User collection is not initialized");
  }
  ensureCollection(User);
  const users = await User.find({ ...query, deleted: false }, { projection })
    .sort({ _id: 1 })
    .limit(limit)
    .toArray();

  return users;
};

export const findByValidationToken = async (validationToken: string) => {
  User = await getCollection();
  ensureCollection(User);
  const user = await User.findOne({
    validationToken,
    deleted: false,
  });
  return user;
};

export const insertManyUsers = async (users: UserT[]) => {
  User = await getCollection();
  ensureCollection(User);
  users.forEach((user) => {
    user.created_at = new Date();
    user.active = true;
  });
  return await User.insertMany(users);
};

export const fetchUsersByName = async (
  userName: string,
  projection: Partial<Record<keyof UserT, 1 | 0>> = { password: 0 }
) => {
  User = await getCollection();
  ensureCollection(User);
  const users: UserT[] = await User.find(
    { name: { $regex: userName, $options: "i" }, deleted: false },
    { projection }
  ).toArray();

  return users;
};

export const fetchUsersByIds = async (
  ids: string[],
  projection: Partial<Record<keyof UserT, 1 | 0>> = { password: 0 }
) => {
  User = await getCollection();
  ensureCollection(User);
  const objectIds = ids.map((id) => new ObjectId(id));
  return await User.find(
    { _id: { $in: objectIds }, deleted: false },
    { projection }
  ).toArray();
};

export const addFriend = async (userId: string, friendId: string) => {
  User = await getCollection();
  ensureCollection(User);
  const result = await User.updateOne(
    { _id: new ObjectId(userId) },
    { $addToSet: { friends: friendId } }
  );
  return result;
};

export const removeFriend = async (userId: string, friendId: string) => {
  User = await getCollection();
  ensureCollection(User);
  const result = await User.updateOne(
    { _id: new ObjectId(userId) },
    { $pull: { friends: friendId } }
  );
  return result;
};

export const addMatchStatsToUser = async (
  userId: string,
  matchStats: MatchesStats
) => {
  User = await getCollection();
  ensureCollection(User);

  const points = new Double(matchStats.points);
  const result = await User.updateOne(
    { _id: new ObjectId(userId) },
    { $push: { matchesStats: { ...matchStats, points } } }
  );
  return result;
};

export const fetchUserByPin = async (
  pin: string,
  projection: Partial<Record<keyof UserT, 1 | 0>> = { password: 0 }
) => {
  User = await getCollection();
  ensureCollection(User);
  const user = await User.findOne({ pin, deleted: false }, { projection });
  return user;
};

export const fetchUserByField = async (
  field: keyof UserT,
  value: any,
  projection: Partial<Record<keyof UserT, 1 | 0>> = { password: 0 }
) => {
  User = await getCollection();
  ensureCollection(User);
  const query = { [field]: value, deleted: false } as any;
  const user = await User.findOne(query, { projection });
  return user;
};

export const fetchUserByAppleId = async (
  appleId: string,
  projection: Partial<Record<keyof UserT, 1 | 0>> = { password: 0 }
) => {
  return fetchUserByField("appleId", appleId, projection);
};

export const fetchUsersByLeaderboard = async (
  sortField: LeaderboardFields,
  sortOrder: 1 | -1 = -1, // -1 for descending (highest first), 1 for ascending
  limit?: number,
  query: any = {},
  projection: Partial<Record<keyof UserT, 1 | 0>> = { password: 0 }
) => {
  User = await getCollection();
  ensureCollection(User);

  const sortQuery = { [sortField]: sortOrder };

  // Add condition to filter out null, undefined, and 0 values for the leaderboard field
  const baseQuery = {
    ...query,
    deleted: false,
    [sortField]: { $exists: true, $ne: null, $gt: 0 },
  };

  let findQuery = User.find(baseQuery, { projection }).sort(sortQuery);

  if (limit) {
    findQuery = findQuery.limit(limit);
  }

  const users = await findQuery.toArray();
  return users;
};

export default {
  createUser,
  fetchUser,
  updateUser,
  deleteUser,
  getAllUsers,
  signIn,
  findByValidationToken,
  fetchUserByEmail,
  insertManyUsers,
  fetchUsersByName,
  fetchUsersByIds,
  addFriend,
  removeFriend,
  addMatchStatsToUser,
  fetchUserByPin,
  fetchUserByField,
  fetchUserByAppleId,
  fetchUsersByLeaderboard,
};
