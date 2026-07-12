import { ObjectId } from "mongodb";
import { Question } from "../models/index";

const insertMany = async (questions) => {
  const now = new Date();
  const timestampedQuestions = questions.map((question) => ({
    ...question,
    created_at: now,
    updated_at: now,
  }));
  return await Question.insertMany(timestampedQuestions, { ordered: false });
};

const getCategories = async (userEmail) => {
  const categories = await Question.distinct("category", {
    userEmail: userEmail,
  });
  return categories;
};

const getSubCategory = async (userEmail, category) => {
  const subCategories = await Question.distinct("subCategory", {
    userEmail: userEmail,
    category: category,
  });
  return subCategories;
};

const getQuestions = async (query) => {
  const questions = await Question.find(query).toArray();
  return questions;
};

const updateManyQuestions = async (questions) => {
  try {
    const bulkOps = questions.map((question) => {
      const { _id, created_at, ...updateFields } = question;
      return {
        updateOne: {
          filter: { _id: new ObjectId(_id) },
          update: {
            $set: { ...updateFields, updated_at: new Date() },
          },
        },
      };
    });
    return await Question.bulkWrite(bulkOps, { ordered: false });
  } catch (error) {
    console.dir(error, { depth: null });
    throw new Error(error);
  }
};

export {
  insertMany,
  getCategories,
  getSubCategory,
  getQuestions,
  updateManyQuestions,
};
