import jwt from "jsonwebtoken";
import config from "../config/config";

const secretKey = config.secret || "default-secret-key";

type Payload = {
  email: string;
};

const generateToken = (payload: { email: string }) => {
  return jwt.sign(payload, secretKey, { expiresIn: "1h" });
};

const verifyToken = (token: string) => {
  try {
    const decoded: Payload = jwt.verify(token, secretKey) as Payload;
    return decoded;
  } catch (error) {
    return null;
  }
};

export { generateToken, verifyToken };
