import nodemailerService from "../services/nodemailer-service";
import config from "../config/config";

const template = (clientUrl: string, token: string) => {
  const url = `${clientUrl}/reset-password?token=${token}`;

  return `Olá, clique no link para redefinir sua senha: ${url}`;
};

const sendChangePasswordToken = async (email: string, token: string) => {
  const client = config.client_url || "http://localhost:3000";

  const subject = "Reset Password Request";
  const text = template(client, token);
  await nodemailerService(email, subject, text);
};

export default sendChangePasswordToken;
