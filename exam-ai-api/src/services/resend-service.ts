import { Resend } from "resend";
import config from "../config/config";

const resend = new Resend(config.resend_api_key);

async function resendService(
  to: string,
  subject: string,
  text: string,
  html?: string
) {
  try {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Exam AI <onboarding@resend.dev>",
      to: [to],
      subject,
      ...(html ? { html } : { text }),
    });

    if (error) {
      console.error("Error sending email:", error);
    }
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

export default resendService;
