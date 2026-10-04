import Mailjet from "node-mailjet";
import { config } from "../../config.js";

const mailjet = Mailjet.apiConnect(
  config.mailjet.apiKey,
  config.mailjet.secretKey
);

// Envia un correo por la API HTTPS de Mailjet (Render bloquea SMTP).
// Lanza un error si falla, para que el controlador responda 500.
export const sendEmail = async (to, subject, html, text) => {
  try {
    const result = await mailjet
      .post("send", { version: "v3.1" })
      .request({
        Messages: [
          {
            From: {
              Email: config.mailjet.fromEmail,
              Name: config.mailjet.fromName,
            },
            To: [{ Email: to }],
            Subject: subject,
            HTMLPart: html,
            ...(text && { TextPart: text }),
          },
        ],
      });

    console.log(`Correo enviado a ${to}`);
    return result.body;
  } catch (error) {
    console.log("Error enviando correo con Mailjet:", error.response?.data || error.message);
    throw error;
  }
};
