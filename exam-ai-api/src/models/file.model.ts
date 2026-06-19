import initializeDb from "../db/db";
import { collectionExists, type Prop } from "./index";

export interface FileT {
  url: string;
  created_at?: Date;
  updated_at?: Date;
  type?: string;
  size?: number;
  name?: string;
}

const VALIDATOR = {
  $jsonSchema: {
    bsonType: "object",
    required: ["url"],
    properties: {
      url: {
        bsonType: "string",
      },
      created_at: {
        bsonType: "date",
      },
      updated_at: {
        bsonType: "date",
      },
      type: {
        bsonType: "string",
      },
      size: {
        bsonType: "int",
      },
      name: {
        bsonType: "string",
      },
    },
  },
};

export default async (collection: Prop) => {
  const db = await initializeDb();
  const exist = await collectionExists(collection.name);
  try {
    if (!exist) {
      await db.createCollection(collection.name, {
        validator: VALIDATOR,
      });
      console.log(`File collection ${collection.name} created`);
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
    console.error(`Error creating file collection ${collection.name}:`, error);
    throw error;
  }
};
