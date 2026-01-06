import { constants } from '@app/shared';
import * as nodemailer from 'nodemailer';

export const emailTransporterProvider = {
  provide: constants.EMAIL_TRANSPORTER,
  useFactory: () => {
    const port = Number(process.env.EMAIL_PORT);

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  },
};
