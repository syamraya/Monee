import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { BrevoClient } from '@getbrevo/brevo';

@Injectable()
export class MailService {
  private client: BrevoClient;
  private senderEmail = process.env.MAIL_FROM || process.env.EMAIL_USER || 'moneeapps@gmail.com';
  private senderName = process.env.MAIL_FROM_NAME || 'Monee Admin';

  constructor() {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      throw new Error('BREVO_API_KEY environment variable is required for MailService');
    }

    this.client = new BrevoClient({
      apiKey,
    });
  }

  async sendMail(to: string, subject: string, html: string) {
    try {
      const response = await this.client.transactionalEmails.sendTransacEmail({
        to: [{ email: to }],
        subject,
        htmlContent: html,
        sender: { name: this.senderName, email: this.senderEmail },
      });

      console.log('[MailService] Brevo transaction response:', response);
      return response;
    } catch (error) {
      console.error('[MailService] Brevo sendTransacEmail error:', error);
      throw new InternalServerErrorException('Failed to send email via Brevo');
    }
  }
}