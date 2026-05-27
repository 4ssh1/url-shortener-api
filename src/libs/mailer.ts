import nodemailer, {TransportOptions} from 'nodemailer';
import { config } from '@/config';
import logger from './pino';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // port 465 requires secure: true
  family: 4,    // force IPv4 — Render free tier does not support IPv6
  auth: {
    user: config.emailUser,
    pass: config.emailPass,
  },
} as TransportOptions);

// Verify transporter config at startup so misconfigurations surface
// immediately in Render logs rather than silently failing later.
transporter.verify((error) => {
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