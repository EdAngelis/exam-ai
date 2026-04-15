import initializeDb from "../db/db";
import { Collection } from "mongodb";
import { collectionExists, type Prop } from "./index";

export interface ExamT {
  userEmail: string;
  students?: string[];
  userId?: string;
  category: string;
  subCategory: string;
  subject?: string;
  questionsId: string[];
  answers?: number[][];
  duration?: number;
  created_at?: Date;
  updated_at?: Date;
}

const VALIDATOR = {
  $jsonSchema: {
    bsonType: "object",
    required: ["userEmail", "category", "subCategory", "questionsId"],
    properties: {
      userEmail: {
        bsonType: "string",
      },
      students: {
        bsonType: "array",
        items: {
          bsonType: "string",
        },
      },
      userId: {
        bsonType: "string",
      },
      category: {
        bsonType: "string",
      },
      subCategory: {
        bsonType: "string",
      },
      subject: {
        bsonType: "string",
      },
      questionsId: {
        bsonType: "array",
        items: {
          bsonType: "objectId",
        },
      },
      answers: {
        bsonType: "array",
        items: {
          bsonType: "array",
          items: {
            bsonType: "int",
          },
        },
      },
      duration: {
        bsonType: "int",
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
      console.log(`Exam collection ${collection.name} created`);
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
    console.error(`Error creating exam collection ${collection.name}:`, error);
  }
};
