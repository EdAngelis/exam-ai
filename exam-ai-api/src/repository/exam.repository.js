import { ObjectId } from "mongodb";
import { Question } from "../models/index";
import { Exam } from "../models/index";

const insertExam = async (exam) => {
  return await Exam.insertOne(exam);
};

const getExam = async (id) => {
  const objectId = new ObjectId(id);
  const exam = await Exam.findOne({ _id: objectId });
  const questionsId = exam.questionsId.map((id) => new ObjectId(id));
  const questions = await Question.find({
    _id: { $in: questionsId },
  }).toArray();
  exam.questions = questions;
  return exam;
};

const getExamsByUserEmail = async (userEmail) => {
  const exams = await Exam.find({
    $or: [{ userEmail }, { student: userEmail }],
  }).toArray();

  for (const exam of exams) {
    const questionsId = exam.questionsId.map((id) => new ObjectId(id));
    const questions = await Question.find({
      _id: { $in: questionsId },
    }).toArray();
    exam.questions = questions;
  }
  return exams;
};

const getExams = async (query = {}) => {
  const exams = await Exam.find(query).toArray();
  for (const exam of exams) {
    const questionsId = exam.questionsId.map((id) => new ObjectId(id));
    const questions = await Question.find({
      _id: { $in: questionsId },
    }).toArray();
    exam.questions = questions;
  }
  return exams;
};

const addResult = async (id, result) => {
  const update = { $push: { answers: result } };
  const updatedExam = await Exam.findOneAndUpdate(
    { _id: new ObjectId(id) },
    update,
    {
      returnDocument: "after",
    }
  );
  const questionsId = updatedExam.questionsId.map((id) => new ObjectId(id));
  const questions = await Question.find({
    _id: { $in: questionsId },
  }).toArray();
  updatedExam.questions = questions;
  return updatedExam;
};

const deleteExam = async (id) => {
  const result = await Exam.deleteOne({ _id: new ObjectId(id) });
  return result;
};

const insertMany = async (exams) => {
  return await Exam.insertMany(exams, { ordered: false });
};

export {
  insertExam,
  getExam,
  getExams,
  addResult,
  deleteExam,
  getExamsByUserEmail,
  insertMany,
};
