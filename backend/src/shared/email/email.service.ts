import { Injectable } from '@nestjs/common';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import envConfig from '../config/config';
import { otpTemplate } from './templates/otp.template';
import { notificationTemplate } from './templates/notification.template';

@Injectable()
export class EmailService {
  private readonly sesClient: SESClient;

  constructor() {
    this.sesClient = new SESClient({
      region: envConfig.AWS_REGION,
      credentials: {
        accessKeyId: envConfig.AWS_ACCESS_KEY_ID,
        secretAccessKey: envConfig.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  private async send({
    to,
    subject,
    html,
  }: {
    to: string;
    subject: string;
    html: string;
  }) {
    const command = new SendEmailCommand({
      Source: envConfig.SES_FROM_ADDRESS,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: { Html: { Data: html, Charset: 'UTF-8' } },
      },
    });
    return this.sesClient.send(command);
  }

  sendOTP(to: string, code: string) {
    return this.send({
      to,
      subject: 'HCMUS Physics - Verification Code',
      html: otpTemplate({ code, expiresIn: envConfig.OTP_EXPIRES_IN }),
    });
  }

  sendNotification({
    to,
    title,
    message,
    link,
  }: {
    to: string;
    title: string;
    message: string;
    link?: string;
  }) {
    return this.send({
      to,
      subject: `HCMUS Physics - ${title}`,
      html: notificationTemplate({ title, message, link }),
    });
  }
}
