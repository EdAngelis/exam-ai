import Question from "../models/question";

export type GenerateQuestionsParams = {
  userId?: string;
  userEmail: string;
  category: string;
  subCategory: string;
  subject?: string;
  prompt?: string;
  type?: string;
  lang?: string;
  numberOfQuestions: number;
  difficulty?: "easy" | "medium" | "hard";
};

const getQuestions = async (
  userEmail: string,
  category: string,
  subCategory: string,
  limit?: number
): Promise<Question[]> => {
  const response = await fetch(
    `/api/proxy?path=questions&category=${category}&subCategory=${subCategory}&limit=${limit}&userEmail=${userEmail}`
  );
  const data = await response.json();
  return data.questions;
};

const getCategory = async (userEmail: string): Promise<string[]> => {
  const response = await fetch(
    `/api/proxy?path=questions/categories/${userEmail}`
  );
  const data = await response.json();
  return data.categories;
};

const getSubcategory = async (
  category: string,
  userEmail: string
): Promise<string[]> => {
  const response = await fetch(
    `/api/proxy?path=questions/subcategories&category=${category}&userEmail=${userEmail}`
  );
  const data = await response.json();
  return data.subCategories;
};

const generateQuestions = async ({
  userId,
  userEmail,
  category,
  subCategory,
  subject,
  prompt,
  type,
  lang,
  numberOfQuestions,
  difficulty,
}: GenerateQuestionsParams): Promise<string> => {
  const response = await fetch("/api/proxy?path=questions/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId,
      userEmail,
      category,
      subCategory,
      subject,
      prompt,
      type,
      lang,
      numberOfQuestions,
      difficulty,
    }),
  });
  const data = await response.json();
  return data.id;
};

const regenerateQuestions = async (
  prompt: string,
  questions: Question[]
): Promise<{ message: string }> => {
  const response = await fetch(
    "/api/proxy?path=questions/regenerate-questions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        questions,
      }),
    }
  );
  const data = await response.json();
  return data;
};

const getExams = async (userEmail: string): Promise<any[]> => {
  const response = await fetch(`/api/proxy?path=exams&userEmail=${userEmail}`);
  if (!response.ok) {
    throw new Error("Failed to fetch exams");
  }
  const data = await response.json();
  return data.exams;
};

export {
  getQuestions,
  getCategory,
  getSubcategory,
  generateQuestions,
  regenerateQuestions,
  getExams,
};
