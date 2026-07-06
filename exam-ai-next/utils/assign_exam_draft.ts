import { Exam } from "../models";

const STORAGE_KEY = "examAI:assignExamDraft";

function saveAssignExamDraft(exam: Exam): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(exam));
}

function loadAssignExamDraft(): Exam | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Exam;
  } catch {
    return null;
  }
}

function clearAssignExamDraft(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

export { saveAssignExamDraft, loadAssignExamDraft, clearAssignExamDraft };
