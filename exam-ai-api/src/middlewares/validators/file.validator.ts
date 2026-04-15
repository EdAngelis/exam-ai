import Joi from "joi";
import { response } from "../../controller/response";
import { Request, Response, NextFunction } from "express";

const fileSchema = Joi.object({
  url: Joi.string().required(),
  name: Joi.string().optional(),
  type: Joi.string().optional(),
  size: Joi.number().optional(),
});

const validateFile = (req: Request, res: Response, next: NextFunction) => {
  const { error } = fileSchema.validate(req.body);
  if (error) {
    response(res, {
      status: 400,
      message: error.details[0].message,
      data: null,
    });
  }
  next();
};

export { validateFile };
