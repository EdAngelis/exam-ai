import { MongoClient, Db } from "mongodb";
import config from "../config/config";

let dbInstance: Db | null = null;

const initializeDb = async (): Promise<Db> => {
  if (dbInstance) {
    return dbInstance;
  }

  const uri = config.db.uri || "";
  if (!uri) {
    throw new Error("DB_URI is not configured. Set the DB_URI environment variable.");
  }

  try {
    const client = new MongoClient(uri);
    await client.connect();
    console.log("Connected to database");
    dbInstance = client.db(config.db.name);
    return dbInstance;
  } catch (error) {
    console.error("Failed to connect to the database:", error);
    throw error;
  }
};

export default initializeDb;
