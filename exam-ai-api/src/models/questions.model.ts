import initializeDb from "../db/db";
import { Collection } from "mongodb";
import { collectionExists, type Prop } from "./index";

export interface QuestionT {
  userEmail: string;
  userId?: string;
  type: string;
  subject?: string;
  category: string;
  subCategory: string;
  question: string;
  answer: number;
  whenWrong?: string;
  options: { label: string; index: number }[];
  created_at?: Date;
  updated_at?: Date;
}

const VALIDATOR = {
  $jsonSchema: {
    bsonType: "object",
    required: [
      "userEmail",
      "question",
      "answer",
      "options",
      "type",
      "category",
      "subCategory",
    ],
    properties: {
      userEmail: {
        bsonType: "string",
      },
      userId: {
        bsonType: "string",
      },
      type: {
        bsonType: "string",
      },
      subject: {
        bsonType: "string",
      },
      category: {
        bsonType: "string",
      },
      subCategory: {
        bsonType: "string",
      },
      question: {
        bsonType: "string",
      },
      answer: {
        bsonType: "number",
      },
      whenWrong: {
        bsonType: "string",
      },
      options: {
        bsonType: "array",
        items: {
          bsonType: "object",
          required: ["label", "index"],
          properties: {
            label: {
              bsonType: "string",
            },
            index: {
              bsonType: "int",
            },
          },
        },
      },
      created_at: {
        bsonType: "date",
      },
      updated_at: {
        bsonType: "date",
      },
    },
  },
};

export default async (collection: Prop): Promise<Collection | undefined> => {
  const db = await initializeDb();
  const exist = await collectionExists(collection.name);
  try {
    if (!exist) {
      await db.createCollection(collection.name, {
        validator: VALIDATOR,
      });
      console.log(`Question collection ${collection.name} created`);
    }

    if (collection.revalidate) {
      await db.command({
        collMod: collection.name,
        validator: VALIDATOR,
      });
      console.log("Validation changed");
    }

    return db.collection(collection.name);
  } catch (error) {
    console.error(
      `Error creating question collection ${collection.name}:`,
      error
    );
  }
};

export const jsonToModel = (
  json: any,
  type: string,
  category: string,
  subCategory: string,
  subject: string,
  userEmail: string
): QuestionT => {
  return {
    userEmail,
    type,
    category,
    subCategory,
    subject,
    question: json.title,
    answer: json.questionItem.question.grading.correctAnswers.answers[0].value,
    whenWrong: json.questionItem.question.grading.whenWrong.text,
    options: json.questionItem.choiceQuestion.options.map(
      (option: any, index: number) => ({
        label: option.value,
        index,
      })
    ),
  };
};
