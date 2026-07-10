import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

export interface MailDeliveryInfo {
  isDevCapture: boolean;
  captureUrl?: string;
  smtpHost: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter;
  private readonly smtpHost: string;
  private readonly smtpPort: number;

  constructor(private config: ConfigService) {
    this.smtpHost = this.config.get<string>('smtp.host') || 'localhost';
    this.smtpPort = this.config.get<number>('smtp.port') || 1025;
    const user = this.config.get<string>('smtp.user');
    const pass = this.config.get<string>('smtp.password');

    this.transporter = nodemailer.createTransport({
      host: this.smtpHost,
      port: this.smtpPort,
      secure: this.config.get<boolean>('smtp.secure') ?? false,
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  getDeliveryInfo(): MailDeliveryInfo {
    const isDevCapture =
      this.smtpHost === 'localhost' ||
      this.smtpHost === '127.0.0.1' ||
      this.smtpPort === 1025;

    return {
      isDevCapture,
      captureUrl: isDevCapture ? 'http://localhost:8025' : undefined,
      smtpHost: this.smtpHost,
    };
  }

  async sendMail(options: SendMailOptions): Promise<void> {
    const from = this.config.get<string>('smtp.from');
    const info = this.getDeliveryInfo();
    try {
      await this.transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      if (info.isDevCapture) {
        this.logger.log(
          `Email captured by Mailhog for ${options.to} — view at ${info.captureUrl}`,
        );
      } else {
        this.logger.log(`Email sent to ${options.to} via ${info.smtpHost}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}`, error);
      throw error;
    }
  }

  renderTemplate(template: string, variables: Record<string, string>): string {
    return Object.entries(variables).reduce(
      (body, [key, value]) => body.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), value),
      template,
    );
  }
}
