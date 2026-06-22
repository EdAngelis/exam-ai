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
  resend_api_key: string | undefined;
  resend_from_email: string | undefined;
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
    resend_api_key: process.env.RESEND_API_KEY,
    resend_from_email: process.env.RESEND_FROM_EMAIL,
    db: {
      uri: process.env.DB_URI,
      name: process.env.DB_NAME,
    },
  },
  development: {
    api_key: process.env.API_KEY || "my-api-key",
    port: process.env.PORT || "3001",
    secret: process.env.SECRET || "default-secret-key",
    client_url: process.env.CLIENT_URL || "http://localhost:3000",
    serverless: process.env.SERVERLESS || "false",
    open_ai_key: process.env.OPEN_AI_API_KEY || "",
    resend_api_key: process.env.RESEND_API_KEY,
    resend_from_email:
      process.env.RESEND_FROM_EMAIL || "Exam AI <onboarding@resend.dev>",
    db: {
      uri: process.env.DB_URI || "mongodb://127.0.0.1:27017/",
      name: process.env.DB_NAME || "exercise-AI",
    },
  },
};

const secret = process.env.API_KEY || "default-secret-key";

export default config[env] as Properties;
export { secret };
