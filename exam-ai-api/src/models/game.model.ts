import initializeDb from "../db/db";
import { Collection, ObjectId } from "mongodb";
import { collectionExists, type Prop } from "./index";

export type GameStatus = "pending" | "accepted" | "in_progress" | "completed";
export type GameCompletionReason = "both_submitted" | "time_expired";

export type SubmittedAnswer = {
  questionId: string;
  answer: number;
};

export type GameSubmission = {
  userId: string;
  userEmail: string;
  answers: SubmittedAnswer[];
  score: number;
  submittedAt: Date;
};

export interface GameT {
  hostUserId: string;
  hostEmail: string;
  opponentUserId: string;
  opponentEmail: string;
  examId: ObjectId;
  status: GameStatus;
  timeLimitSeconds: number;
  submissions?: GameSubmission[];
  winnerUserId?: string | null;
  completionReason?: GameCompletionReason;
  acceptedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  created_at?: Date;
  updated_at?: Date;
}

const VALIDATOR = {
  $jsonSchema: {
    bsonType: "object",
    required: [
      "hostUserId",
      "hostEmail",
      "opponentUserId",
      "opponentEmail",
      "examId",
      "status",
      "timeLimitSeconds",
    ],
    properties: {
      hostUserId: { bsonType: "string" },
      hostEmail: { bsonType: "string" },
      opponentUserId: { bsonType: "string" },
      opponentEmail: { bsonType: "string" },
      examId: { bsonType: "objectId" },
      status: {
        enum: ["pending", "accepted", "in_progress", "completed"],
      },
      timeLimitSeconds: { bsonType: "int" },
      submissions: {
        bsonType: "array",
        items: {
          bsonType: "object",
          required: ["userId", "userEmail", "answers", "score", "submittedAt"],
          properties: {
            userId: { bsonType: "string" },
            userEmail: { bsonType: "string" },
            answers: {
              bsonType: "array",
              items: {
                bsonType: "object",
                required: ["questionId", "answer"],
                properties: {
                  questionId: { bsonType: "string" },
                  answer: { bsonType: "int" },
                },
              },
            },
            score: { bsonType: "int" },
            submittedAt: { bsonType: "date" },
          },
        },
      },
      winnerUserId: {
        bsonType: ["string", "null"],
      },
      completionReason: {
        enum: ["both_submitted", "time_expired"],
      },
      acceptedAt: { bsonType: "date" },
      startedAt: { bsonType: "date" },
      completedAt: { bsonType: "date" },
      created_at: { bsonType: "date" },
      updated_at: { bsonType: "date" },
    },
  },
};

export default async (collection: Prop): Promise<Collection<GameT> | undefined> => {
  const db = await initializeDb();
  const exist = await collectionExists(collection.name);
  try {
    if (!exist) {
      await db.createCollection(collection.name, {
        validator: VALIDATOR,
      });
      console.log(`Game collection ${collection.name} created`);
    }

    if (collection.revalidate) {
      await db.command({
        collMod: collection.name,
        validator: VALIDATOR,
      });
      console.log("Validation changed");
    }

    const gameCollection = db.collection<GameT>(collection.name);
    await gameCollection.createIndex({ hostEmail: 1 });
    await gameCollection.createIndex({ opponentEmail: 1 });
    await gameCollection.createIndex({ status: 1 });

    return gameCollection;
  } catch (error) {
    console.error(`Error creating game collection ${collection.name}:`, error);
    throw error;
  }
};
