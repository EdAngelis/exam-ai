import { Recipient, EmailParams, MailerSend, Sender } from "mailersend";
import config from "../config/config";

const sendNotification = async (message, emailUser) => {
  console.log("Sending email");
  try {
    const mailersend = new MailerSend({
      apiKey:
        "mlsn.ce8ab0307198a0779b6e74313bf21717c630993d90a3a15ccb14694da4429af1",
    });

    const sentFrom = new Sender(
      "MS_Bia2wj@rivertech.com.br",
      "mssp.IwRD28z.z86org8kq10gew13.nhHUI1I"
    );

    const recipient = emailUser;
    const recipients = [new Recipient(recipient, "Recipient")];

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject("Testing MailerSend").setHtml(`<div>
        <h1>E-mail Verification</h1>
        <h2>Clique no link abaixo para verificar seu e-mail</h2>
        <button><a href="http://localhost:3000/verify-email">Verificar e-mail</a></button>
        <p>${message}</p>
        </div>`);

    await mailersend.email
      .send(emailParams)
      .then((response) => console.log("Email sent successfully", response))
      .catch((error) => console.log("Email sent Error", error));
  } catch (error) {
    console.error(error);
    throw new Error((error as any).message);
  }
};

export default sendNotification;
