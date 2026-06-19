import initializeDb from "../db/db";
import { Collection } from "mongodb";
import { collectionExists, type Prop } from "./index";

export interface UserT {
  name?: string;
  email?: string;
  password?: string;
  active?: boolean;
  validationToken?: string;
  resetPasswordToken?: string;
  level?: number;
  students?: string[];
  created_at?: Date;
  updated_at?: Date;
}

const VALIDATOR = {
  $jsonSchema: {
    bsonType: "object",
    required: ["email", "level"],
    properties: {
      name: {
        bsonType: "string",
      },
      email: {
        bsonType: "string",
      },
      password: {
        bsonType: "string",
      },
      active: {
        bsonType: "bool",
      },
      validationToken: {
        bsonType: "string",
      },
      resetPasswordToken: {
        bsonType: "string",
      },
      level: {
        bsonType: "int",
      },
      students: {
        bsonType: "array",
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
      console.log(`User collection ${collection.name} created`);
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
    console.error(`Error creating user collection ${collection.name}:`, error);
    throw error;
  }
};
