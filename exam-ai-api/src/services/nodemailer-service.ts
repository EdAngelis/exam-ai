import nodemailer from "nodemailer";

async function nodemailerService(to, subject, text) {
  let transporter = nodemailer.createTransport({
    service: "hostinger",
    host: "smtp.hostinger.com",
    port: 465, // Use 587 if not using SSL
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  let mailOptions = {
    from: process.env.EMAIL_USER,
    to: to,
    subject: subject,
    text: text,
  };

  try {
    let info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
  } catch (error) {
    console.error("Error sending email: " + error);
  }
}

export default nodemailerService;
