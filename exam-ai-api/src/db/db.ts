import { MongoClient, Db } from "mongodb";
import config from "../config/config";

let dbInstance: Db | null = null;

const initializeDb = async (): Promise<Db> => {
  if (dbInstance) {
    return dbInstance;
  }

  const client = new MongoClient(config.db.uri || "");
  await client.connect();
  console.log("Connected to database");
  dbInstance = client.db(config.db.name);
  return dbInstance;
};

export default initializeDb;
