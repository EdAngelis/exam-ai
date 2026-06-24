import Question from './question';
import User from './user';

interface Exam {
  _id?: string;
  user?: User;
  userId?: string;
  userEmail: string;
  students?: string[];
  category: string;
  subCategory: string;
  subject?: string;
  questions?: Question[];
  questionsId: string[];
  answers?: number[][];
  duration?: number;
}

export default Exam;
