import { type Request, type Response, type NextFunction } from "express";
import { verifyToken } from "../tools/jwt";
import { response } from "../controller/response";

const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    response(res, { status: 401, message: "Unauthorized", data: null });
    return;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    response(res, { status: 401, message: "Invalid or expired token", data: null });
    return;
  }

  next();
};

export default authenticateToken;
