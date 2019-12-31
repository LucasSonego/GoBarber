import nodemailer from "nodemailer";
import mailConfig from "../config/mail";

class Mail {
  constructor() {
    const { host, port, secure, auth } = mailConfig;
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: auth.user ? auth : null
    });

    this.transporter.verify((error, success) => {
      if (error) {
        console.log(error);
      } else {
        console.log("Server is ready to take our messages");
      }
    });
  }

  sendMail(message) {
    return this.transporter.sendMail({
      ...mailConfig.default,
      ...message
    });
  }
}

export default new Mail();
