import questionsByAi from "../ai/generate_questions";
import regenerate from "../ai/regenerate_questions";
import questionSchema from "../models/choice_schema";
import { questionSchema as joiQuestionSchema } from "../middlewares/validators/question.validator";
import {
  getCategories,
  getSubCategory,
  getQuestions,
  insertMany,
  updateManyQuestions,
} from "../repository/questions.repository";
import { insertExam } from "../repository/exam.repository";

export const fetchCategories = async (req, res) => {
  const userEmail = req.params.userEmail;
  try {
    const categories = await getCategories(userEmail);
    res.status(200).json({
      message: "Categories fetched successfully",
      categories: categories,
    });
    return;
  } catch (error) {
    console.dir(error, { depth: null });
    res.status(500).json({ error: "Internal Server Error" });
    return;
  }
};

export const fetchSubCategories = async (req, res) => {
  try {
    const { userEmail, category } = req.query;
    const subCategories = await getSubCategory(userEmail, category);
    res.status(200).json({
      message: "Sub Categories fetched successfully",
      subCategories: subCategories,
    });
    return;
  } catch (error) {
    console.dir(error, { depth: null });
    res.status(500).json({ error: "Internal Server Error" });
    return;
  }
};

export const fetchQuestions = async (req, res) => {
  try {
    const { category, subCategory, userEmail, limit } = req.query;
    const questions = await getQuestions(
      { category, subCategory, userEmail },
      limit
    );

    if (!questions || questions.length === 0) {
      return res.status(404).json({
        message: "Questions not found",
      });
    }

    res.status(200).json({
      message: "Questions fetched successfully",
      questions: questions,
    });
    return;
  } catch (error) {
    console.dir(error, { depth: null });
    res.status(500).json({ error: "Internal Server Error" });
    return;
  }
};

export const generateQuestions = async (req, res) => {
  const { userId, userEmail, category, subCategory, subject, prompt } =
    req.body;
  const type = req.body.type || "choice";
  const lang = req.body.lang || "Portuguese";
  const numberOfQuestions = req.body.numberOfQuestions || 5;
  try {
    const formItens = await questionsByAi(
      category,
      subCategory,
      subject,
      prompt,
      lang,
      numberOfQuestions,
      questionSchema
    );

    formItens.map((q) => {
      if (userId) q.userId = userId;
      if (userEmail) q.userEmail = userEmail;
      q.type = type || "choice";
      q.category = category;
      q.subCategory = subCategory;
      if (subject) q.subject = subject;
      q.answer = parseInt(q.answer);
    });

    const validFormItems = formItens
      .map((item) => {
        const { error } = joiQuestionSchema.validate(item);
        if (!error) {
          return item;
        }
      })
      .filter(Boolean);

    if (validFormItems.length === 0) {
      return res.status(400).json({
        message: "Validation error: No valid questions found",
      });
    }

    const response = await insertMany(validFormItems);

    const ids = Object.values(response.insertedIds).map((id) => id);

    const exam = {
      userEmail,
      category,
      subCategory,
      subject,
      questionsId: ids,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const resp = await insertExam(exam);

    const respId = resp.insertedId.toString();

    console.log(respId);

    res.status(200).json({
      message: "Questions generated and inserted successfully",
      id: respId,
    });
    return;
  } catch (error) {
    console.dir(error, { depth: null });
    res.status(500).json({ error: "Internal Server Error" });
    return;
  }
};

export const regenerateQuestions = async (req, res) => {
  try {
    const { prompt, questions } = req.body;

    const questionsAsString = JSON.stringify(questions);

    const formItens = await regenerate(questionsAsString, prompt);
    formItens.map((q) => {
      q.answer = parseInt(q.answer);
    });

    const validFormItems = formItens
      .map((item) => {
        const { error } = joiQuestionSchema.validate(item);
        console.log("ERROR", error);
        if (!error) {
          return item;
        }
      })
      .filter(Boolean);

    if (validFormItems.length === 0) {
      return res.status(400).json({
        message: "Was not possible to regenerate questions",
      });
    }

    const response = await updateManyQuestions(validFormItems);

    console.log(response);

    res.status(200).json({
      message: "success",
    });
    return;
  } catch (error) {
    console.dir(error, { depth: null });
    res.status(500).json({
      message: "Error regenerating questions",
    });
    return;
  }
};
