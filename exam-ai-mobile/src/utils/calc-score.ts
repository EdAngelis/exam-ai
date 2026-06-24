import type { Exam } from '@/models';

/**
 * Computes the percentage score for each attempt in an exam by comparing the
 * chosen option index against each question's correct answer. Mirrors the web
 * app's calcScore.
 */
export function calcScore(exam: Exam): number[] {
  if (!exam.answers || !exam.questions) return [];
  const scores: number[] = [];
  for (const result of exam.answers) {
    let score = 0;
    for (let i = 0; i < result.length; i++) {
      if (result[i] === exam.questions[i].answer) {
        score++;
      }
    }
    scores.push((score / result.length) * 100);
  }
  return scores;
}
