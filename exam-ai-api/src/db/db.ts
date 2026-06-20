import { MongoClient, Db } from "mongodb";
import config from "../config/config";

let dbInstance: Db | null = null;

const redactUri = (uri: string): string =>
  uri.replace(/\/\/([^:/?#]+):([^@/?#]+)@/, "//***:***@");

const initializeDb = async (): Promise<Db> => {
  if (dbInstance) {
    return dbInstance;
  }

  const uri = config.db.uri;
  if (!uri) {
    throw new Error(
      "DB_URI is not configured. Set the DB_URI environment variable.",
    );
  }

  const safeUri = redactUri(uri);

  try {
    const client = new MongoClient(uri);

    // Add event listeners to monitor MongoDB process
    client.on("serverHeartbeatFailed", (event) => {
      console.error("MongoDB server heartbeat failed:", event);
    });

    client.on("serverClosed", (event) => {
      console.warn("MongoDB server closed:", event);
    });

    client.on("connectionCreated", (event) => {
      console.log("MongoDB connection created:", event);
    });

    client.on("connectionClosed", (event) => {
      console.warn("MongoDB connection closed:", event);
    });

    await client.connect();
    console.log(`Connected to database "${config.db.name}" at ${safeUri}`);
    dbInstance = client.db(config.db.name);
    return dbInstance;
  } catch (error) {
    console.error(
      `Failed to connect to database "${config.db.name}" at ${safeUri}:`,
    );
    console.dir(error, { depth: null });
    throw error;
  }
};

export default initializeDb;
