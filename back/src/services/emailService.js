/**
 * Service d'envoi d'emails
 * Utilise Nodemailer pour envoyer des emails transactionnels
 */

import nodemailer from "nodemailer";

/**
 * Crée un transporteur email selon l'environnement
 */
const createTransporter = () => {
  // En développement, utiliser Mailtrap ou un service de test
  if (process.env.NODE_ENV !== "production") {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.mailtrap.io",
      port: process.env.SMTP_PORT || 2525,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // En production, utiliser un service réel (Gmail, SendGrid, etc.)
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Envoie un email d'invitation à un événement
 * @param {Object} params
 * @param {string} params.to - Email du destinataire
 * @param {string} params.eventTitle - Titre de l'événement
 * @param {string} params.inviterName - Nom de la personne qui invite
 * @param {string} params.token - Token d'invitation
 * @param {boolean} params.isNewUser - Si l'utilisateur doit créer un compte
 */
export const sendInvitationEmail = async ({
  to,
  eventTitle,
  inviterName,
  token,
  isNewUser,
}) => {
  try {
    const transporter = createTransporter();

    const appUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const encodedEmail = encodeURIComponent(to);
    const encodedEventTitle = encodeURIComponent(eventTitle);
    const inviteLink = isNewUser
      ? `${appUrl}/register?inviteToken=${token}&email=${encodedEmail}&eventTitle=${encodedEventTitle}`
      : `${appUrl}/invite/${token}`;

    const subject = `Invitation à l'événement : ${eventTitle}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: #ffffff;
              border-radius: 8px;
              padding: 30px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #1976d2;
              margin: 0;
              font-size: 24px;
            }
            .content {
              margin-bottom: 30px;
            }
            .event-title {
              font-size: 20px;
              font-weight: bold;
              color: #1976d2;
              margin: 20px 0;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: #1976d2;
              color: #ffffff;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 500;
              margin: 20px 0;
            }
            .button:hover {
              background: #1565c0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              font-size: 12px;
              color: #666;
              text-align: center;
            }
            .link {
              color: #1976d2;
              word-break: break-all;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Invitation à un événement</h1>
            </div>
            
            <div class="content">
              <p>Bonjour,</p>
              
              <p><strong>${inviterName}</strong> vous invite à rejoindre l'événement :</p>
              
              <div class="event-title">${eventTitle}</div>
              
              ${
                isNewUser
                  ? `
                <p>Pour accepter cette invitation, vous devez d'abord créer un compte sur notre plateforme.</p>
                <p>Cliquez sur le bouton ci-dessous pour vous inscrire et rejoindre l'événement :</p>
              `
                  : `
                <p>Cliquez sur le bouton ci-dessous pour accepter l'invitation :</p>
              `
              }
              
              <div style="text-align: center;">
                <a href="${inviteLink}" class="button">
                  ${
                    isNewUser
                      ? "S'inscrire et rejoindre"
                      : "Accepter l'invitation"
                  }
                </a>
              </div>
              
              <p style="margin-top: 20px;">
                Ou copiez ce lien dans votre navigateur :<br>
                <a href="${inviteLink}" class="link">${inviteLink}</a>
              </p>
              
              <p style="margin-top: 30px; font-size: 14px; color: #666;">
                Cette invitation expire dans 30 jours.
              </p>
            </div>
            
            <div class="footer">
              <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
              <p>Si vous n'êtes pas concerné par cette invitation, vous pouvez ignorer cet email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
${inviterName} vous invite à rejoindre l'événement : ${eventTitle}

${
  isNewUser
    ? "Pour accepter cette invitation, vous devez d'abord créer un compte."
    : "Cliquez sur le lien ci-dessous pour accepter l'invitation."
}

Lien d'invitation : ${inviteLink}

Cette invitation expire dans 30 jours.
    `;

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Planifier" <noreply@planifier.app>',
      to,
      subject,
      text,
      html,
    });

    console.log("Email envoyé:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Erreur envoi email:", error);
    throw error;
  }
};
