import { type Response } from "express";

type body = {
  message: string;
  data: any;
  status: number;
  token?: string;
};

const response = (res: Response, { message, data, status, token }: body) => {
  res.status(status).json({ message, data, token, status });
};

export { response, type body };
