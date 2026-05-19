import nodemailer from 'nodemailer';
import { config } from '@/config';
import logger from './pino';

const transporter = nodemailer.createTransport({
  service: config.emailHost,
  port: 587,
  auth: {
    user: config.emailUser, 
    pass: config.emailPass, 
  },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const mailOptions = {
      from:` "Url Shortener" ${config.emailUser}`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info({ messageId: info.messageId, to }, 'Email sent successfully');
    return info;
  } catch (error) {
    logger.error({ err: error, to }, 'Failed to send email');
    throw error;
  }
};