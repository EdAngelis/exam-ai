import initializeDb from "../db/db";
import userModel from "./user.model";
import fileModel from "./file.model";
import questionModel from "./questions.model";
import examModel from "./exam.model";

let User;
let File;
let Question;
let Exam;

export type Prop = {
  name: string;
  revalidate: boolean;
};

export type AllCollections = {
  USERS: Prop;
  FILES: Prop;
  QUESTIONS: Prop;
  EXAMS: Prop;
};

export const collectionNames: AllCollections = {
  USERS: {
    name: "users",
    revalidate: false,
  },
  FILES: {
    name: "files",
    revalidate: false,
  },
  QUESTIONS: {
    name: "questions",
    revalidate: false,
  },
  EXAMS: {
    name: "exams",
    revalidate: false,
  },
};

export const collectionExists = async (
  collectionName: string
): Promise<boolean> => {
  const db = await initializeDb();
  const collections: { name: string }[] = await db.listCollections().toArray();
  const names = collections.map((collection) => collection.name);

  return names.includes(collectionName);
};

const loadCollections = async () => {
  User = await userModel(collectionNames.USERS);
  File = await fileModel(collectionNames.FILES);
  Question = await questionModel(collectionNames.QUESTIONS);
  Exam = await examModel(collectionNames.EXAMS);
};

loadCollections().catch((error) => {
  console.error("Failed to initialize database collections:", error);
  process.exit(1);
});

export { User, File, Question, Exam };
