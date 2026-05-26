import nodemailer from 'nodemailer';
import { config } from '@/config';
import logger from './pino';

const transporter = nodemailer.createTransport({
  host: config.emailHost || 'smtp.gmail.com',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: config.emailUser,
    pass: config.emailPass,
  },
});

// Verify transporter config at startup so misconfigurations are
// immediately visible in logs rather than silently failing later.
transporter.verify((error, success) => {
  if (error) {
    console.error('[Mailer] Transporter verification failed:', error);
    logger.error({ err: error }, 'Mailer transporter verification failed');
  } else {
    console.log('[Mailer] Transporter is ready to send emails');
    logger.info('Mailer transporter verified and ready');
  }
});

export const sendEmail = async (
  to: string,
  subject: string,
  html: string,
): Promise<nodemailer.SentMessageInfo> => {
  const mailOptions = {
    from: `"Url Shortener" <${config.emailUser}>`,
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info({ messageId: info.messageId, to }, 'Email sent successfully');
    return info;
  } catch (error) {
    console.error('[Mailer] Failed to send email to', to, error);
    logger.error({ err: error, to }, 'Failed to send email');
    throw error;
  }
};