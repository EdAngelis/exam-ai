import { ObjectId } from "mongodb";
import {
  insertExam,
  getExam,
  getExams,
  addResult,
  deleteExam,
  getExamsByUserEmail,
  insertMany, // added import
} from "../repository/exam.repository";

export const createStudentsExams = async (req, res) => {
  try {
    const { students, exam } = req.body;
    const exams = students.map((email) => ({
      ...exam,
      student: email,
      questionsId: exam.questionsId.map((id) => new ObjectId(id)),
    }));
    const result = await insertMany(exams);
    console.log(result);
    res.status(201).json({
      message: "Exams created successfully",
      data: result,
    });
    return;
  } catch (error) {
    console.dir(error, { depth: null });
    res.status(500).json({ error: "Internal Server Error" });
    return;
  }
};

export const createExam = async (req, res) => {
  try {
    const exam = req.body;
    exam.questionsId = exam.questionsId.map((id) => new ObjectId(id));
    const result = await insertExam(exam);
    res.status(201).json({
      message: "Exam created successfully",
      exam: result,
    });
    return;
  } catch (error) {
    console.dir(error, { depth: null });
    res.status(500).json({ error: "Internal Server Error" });
    return;
  }
};

export const fetchExam = async (req, res) => {
  try {
    const id = req.params.id;
    const exam = await getExam(id);

    if (!exam) {
      return res.status(404).json({
        message: "Exam not found",
      });
    }

    res.status(200).json({
      message: "Exam fetched successfully",
      exam: exam,
    });
    return;
  } catch (error) {
    console.dir(error, { depth: null });
    res.status(500).json({ error: "Internal Server Error" });
    return;
  }
};

export const fetchExams = async (req, res) => {
  try {
    const query = req.query;
    const exams = await getExams(query);

    if (!exams || exams.length === 0) {
      return res.status(404).json({
        message: "Exams not found",
      });
    }

    res.status(200).json({
      message: "Exams fetched successfully",
      exams: exams,
    });
    return;
  } catch (error) {
    console.dir(error, { depth: null });
    res.status(500).json({ error: "Internal Server Error" });
    return;
  }
};

export const updateResults = async (req, res) => {
  try {
    const id = req.params.id;
    const update = req.body;

    const exam = await addResult(id, update);
    if (exam.matchedCount === 0) {
      return res.status(404).json({
        message: "Exam not found",
      });
    }

    res.status(200).json({
      message: "Exam updated successfully",
      exam,
    });
    return;
  } catch (error) {
    console.dir(error, { depth: null });
    res.status(500).json({ error: "Internal Server Error" });
    return;
  }
};

export const deleteExamController = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await deleteExam(id);

    if (result.deletedCount === 0) {
      return res.status(404).json({
        message: "Exam not found",
      });
    }

    res.status(200).json({
      message: "Exam deleted successfully",
    });
    return;
  } catch (error) {
    console.dir(error, { depth: null });
    res.status(500).json({ error: "Internal Server Error" });
    return;
  }
};

export const fetchExamsByUserEmail = async (req, res) => {
  try {
    const userEmail = req.params.userEmail;
    const exams = await getExamsByUserEmail(userEmail);

    if (!exams) {
      return res.status(404).json({
        message: "Exam not found",
      });
    }

    res.status(200).json({
      message: "Exams fetched successfully",
      exams: exams,
    });
    return;
  } catch (error) {
    console.dir(error, { depth: null });
    res.status(500).json({ error: "Internal Server Error" });
    return;
  }
};
