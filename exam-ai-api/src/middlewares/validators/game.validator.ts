import Joi from "joi";
import { type Request, type Response, type NextFunction } from "express";
import { response } from "../../controller/response";

const createGameSchema = Joi.object({
  examId: Joi.string().required(),
  inviteeEmail: Joi.string().email(),
  inviteeCode: Joi.string().pattern(/^\d{6}$/),
  timeLimitSeconds: Joi.number().integer().min(1),
}).xor("inviteeEmail", "inviteeCode");

const updateTimeLimitSchema = Joi.object({
  timeLimitSeconds: Joi.number().integer().min(60).required(),
});

const submissionSchema = Joi.object({
  answers: Joi.array()
    .items(
      Joi.alternatives().try(
        Joi.number().integer().min(0),
        Joi.object({
          questionId: Joi.string().required(),
          answer: Joi.number().integer().min(0).required(),
        })
      )
    )
    .required(),
});

const validate =
  (schema: Joi.ObjectSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);

    if (error) {
      response(res, {
        status: 400,
        message: error.details[0].message,
        data: null,
      });
      return;
    }

    next();
  };

export const validateCreateGame = validate(createGameSchema);
export const validateGameSubmission = validate(submissionSchema);
export const validateUpdateTimeLimit = validate(updateTimeLimitSchema);
