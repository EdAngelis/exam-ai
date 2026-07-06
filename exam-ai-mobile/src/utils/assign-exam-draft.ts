import type { Exam } from '@/models';

let draft: Exam | null = null;

function saveAssignExamDraft(exam: Exam): void {
  draft = exam;
}

function loadAssignExamDraft(): Exam | null {
  return draft;
}

function clearAssignExamDraft(): void {
  draft = null;
}

export { saveAssignExamDraft, loadAssignExamDraft, clearAssignExamDraft };
