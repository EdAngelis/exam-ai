import jwt from "jsonwebtoken";
import config from "../config/config";

const secretKey = config.secret || "default-secret-key";

type Payload = {
  email: string;
};

type RefreshPayload = {
  email: string;
  type: "refresh";
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

const generateRefreshToken = (payload: { email: string }) => {
  return jwt.sign({ ...payload, type: "refresh" }, secretKey, {
    expiresIn: "30d",
  });
};

const verifyRefreshToken = (token: string) => {
  try {
    const decoded = jwt.verify(token, secretKey) as RefreshPayload;
    if (decoded.type !== "refresh") {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
};

export { generateToken, verifyToken, generateRefreshToken, verifyRefreshToken };
