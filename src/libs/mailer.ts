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

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const mailOptions = {
      from: `"Url Shortener" <${config.emailUser}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info({ messageId: info.messageId, to }, 'Email sent successfully via Port 587');
    return info;
  } catch (error) {
    logger.error({ err: error, to }, 'Failed to send email through cloud transport');
    throw error;
  }
};