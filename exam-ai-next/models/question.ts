interface Option {
  index: number;
  label: string;
}

interface Question {
    _id: string;
    title?: string;
    type: string;
    subject?: string;
    subJect?: string;
    category: string;
    subCategory?: string;
    question: string;
    answer: number;
    whenWrong?: string;
    options: Option[];
  }

  export default Question;