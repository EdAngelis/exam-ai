import { Exam } from '../models';

export default function calcScore(exam: Exam): number[] {
    if ( !exam.answers || !exam.questions ) return [];
    let score = 0;
    const scores = [];
    for ( const result of exam.answers! ) {
        score = 0; // Reset score for each result
        for ( let i = 0 ; i < result.length; i++) {
            if ( result[i] === exam.questions![i].answer ) {
                score++;
            }
        }
        const percent = (score / result.length) * 100;
        scores.push(percent);
    }
    return scores;
};