import { apiClient } from '@/lib/api-client';
import type { Question } from '@/models';

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
  difficulty?: 'easy' | 'medium' | 'hard';
};

const getQuestions = async (
  userEmail: string,
  category: string,
  subCategory: string,
  limit?: number,
): Promise<Question[]> => {
  const res = await apiClient.get<{ questions: Question[]; message: string }>(
    'questions',
    { category, subCategory, limit, userEmail },
  );
  return res.questions;
};

const getCategory = async (userEmail: string): Promise<string[]> => {
  const res = await apiClient.get<{ categories: string[]; message: string }>(
    `questions/categories/${userEmail}`,
  );
  return res.categories;
};

const getSubcategory = async (
  category: string,
  userEmail: string,
): Promise<string[]> => {
  const res = await apiClient.get<{
    subCategories: string[];
    message: string;
  }>('questions/subcategories', { category, userEmail });
  return res.subCategories;
};

const generateQuestions = async (
  params: GenerateQuestionsParams,
): Promise<string> => {
  const res = await apiClient.post<{ id: string; message: string }>(
    'questions/generate',
    params,
  );
  return res.id;
};

const regenerateQuestions = async (
  prompt: string,
  questions: Question[],
): Promise<{ message: string }> => {
  return apiClient.post<{ message: string }>(
    'questions/regenerate-questions',
    { prompt, questions },
  );
};

export {
  getQuestions,
  getCategory,
  getSubcategory,
  generateQuestions,
  regenerateQuestions,
};
