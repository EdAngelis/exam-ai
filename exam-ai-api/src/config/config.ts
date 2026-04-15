import "dotenv/config";

const env: "production" | "development" =
  (process.env.NODE_ENV as "production" | "development") || "development";

export type Properties = {
  port: string | undefined;
  api_key: string | undefined;
  secret: string | undefined;
  client_url: string | undefined;
  serverless: string | undefined;
  open_ai_key: string | undefined;
  db: {
    uri: string | undefined;
    name: string | undefined;
  };
};

type Config = {
  production: Properties;
  development: Properties;
};

const config: Config = {
  production: {
    api_key: process.env.API_KEY,
    port: process.env.PORT,
    secret: process.env.SECRET,
    client_url: process.env.CLIENT_URL,
    serverless: process.env.SERVERLESS,
    open_ai_key: process.env.OPEN_AI_API_KEY,
    db: {
      uri: process.env.DB_URI || "",
      name: process.env.DB_NAME || "user-auth",
    },
  },
  development: {
    api_key: process.env.API_KEY || "my-api-key",
    port: process.env.PORT || "3001",
    secret: process.env.SECRET || "default-secret-key",
    client_url: process.env.CLIENT_URL || "http://localhost:3000",
    serverless: process.env.SERVERLESS || "false",
    open_ai_key: process.env.OPEN_AI_API_KEY || "",
    db: {
      uri: process.env.DB_URI || "mongodb://127.0.0.1:27017/",
      name: process.env.DB_NAME || "user-auth",
    },
  },
};

const secret = process.env.API_KEY || "default-secret-key";

export default config[env] as Properties;
export { secret };
