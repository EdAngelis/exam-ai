import crypto from "crypto";
import util from "util";

const scrypt = util.promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function comparePasswords(password, hashedPassword) {
  const [salt, key] = hashedPassword.split(":");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return key === derivedKey.toString("hex");
}

export { hashPassword, comparePasswords };
