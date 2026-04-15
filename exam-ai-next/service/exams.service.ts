import Exam from '../models/exam';

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
    const response = await fetch(`/api/proxy?path=exams/${id}`);
    const data = await response.json();
    return data.exam;
};

const getExams = async (userEmail: string): Promise<Exam[]> => {
    const response = await fetch(`/api/proxy?path=exams/${userEmail}/by-user-email`);
    const data = await response.json();
    return data.exams;
};

const updateResult = async (id: string, result: number[]): Promise<UpdateResultResponse> => {
    const response = await fetch(`/api/proxy?path=exams/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(result),
    });
    const data = await response.json();
    return data;
};

const insertExam = async (exam: Exam): Promise<InsertExamResponse> => {
    const response = await fetch('/api/proxy?path=exams', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(exam),
    });
    const data = await response.json();
    return data;
};

const insertStudentsExams = async (students: string[], exam: Exam): Promise<InsertStudentsExamsResponse> => {
    const response = await fetch('/api/proxy?path=exams/students-exams', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ students, exam }),
    });
    const data = await response.json();
    return data;
};

export { getExam, getExams, updateResult, insertExam, insertStudentsExams };