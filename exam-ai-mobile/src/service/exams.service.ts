import { apiClient } from '@/lib/api-client';
import type { Exam } from '@/models';

type InsertExamResponse = {
  exam: {
    acknowledged: boolean;
    insertedId: string;
  };
  message: string;
};

type UpdateResultResponse = {
  exam: Exam;
  message: string;
};

type InsertStudentsExamsResponse = {
  acknowledged: boolean;
  insertedCount: number;
  message: string;
};

const getExam = async (id: string): Promise<Exam> => {
  const res = await apiClient.get<{ exam: Exam; message: string }>(
    `exams/${id}`,
  );
  return res.exam;
};

const getExams = async (userEmail: string): Promise<Exam[]> => {
  const res = await apiClient.get<{ exams: Exam[]; message: string }>(
    `exams/${userEmail}/by-user-email`,
  );
  return res.exams;
};

const updateResult = async (
  id: string,
  result: number[],
): Promise<UpdateResultResponse> => {
  return apiClient.put<UpdateResultResponse>(`exams/${id}`, result);
};

const insertExam = async (exam: Exam): Promise<InsertExamResponse> => {
  return apiClient.post<InsertExamResponse>('exams', exam);
};

const insertStudentsExams = async (
  students: string[],
  exam: Exam,
): Promise<InsertStudentsExamsResponse> => {
  // Backend wraps the insertMany result under `data`, e.g.
  // { message, data: { acknowledged, insertedCount, insertedIds } }.
  const res = await apiClient.post<{
    message: string;
    data: { acknowledged: boolean; insertedCount: number };
  }>('exams/students-exams', { students, exam });
  return {
    acknowledged: res.data?.acknowledged,
    insertedCount: res.data?.insertedCount,
    message: res.message,
  };
};

export { getExam, getExams, updateResult, insertExam, insertStudentsExams };
