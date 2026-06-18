import resendService from "../services/resend-service";

const template = (text) => {
  return `
        Verifique seu E-mail com o código ${text}
    `;
};

const sendEmailToken = async (email: string, token: string) => {
  const subject = "Email Verification";
  const text = template(token);
  await resendService(email, subject, text);
};

export default sendEmailToken;
