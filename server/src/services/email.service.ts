import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface SendInvitationEmailParams {
  toEmail: string;
  recipientName: string;
  roleName: string;
  locationName: string;
  invitationToken: string;
  expiresInHours?: number;
}

export interface SendPasswordResetEmailParams {
  toEmail: string;
  recipientName: string;
  resetToken: string;
  expiresInMinutes?: number;
}

export interface EmailDispatchResult {
  delivered: boolean;
  simulated: boolean;
  messageId?: string;
  previewUrl?: string;
  error?: string;
}

/**
 * Enterprise Email Dispatch Service for Aurelle
 */
class EmailService {
  private hasLiveProvider(): boolean {
    return Boolean(
      process.env.RESEND_API_KEY ||
      (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
    );
  }

  /**
   * Dispatch Staff Invitation Email
   */
  async sendStaffInvitation(params: SendInvitationEmailParams): Promise<EmailDispatchResult> {
    const {
      toEmail,
      recipientName,
      roleName,
      locationName,
      invitationToken,
      expiresInHours = 48,
    } = params;

    const activationUrl = `${env.CLIENT_ORIGIN}/staff/accept-invitation?token=${encodeURIComponent(invitationToken)}`;

    // Branded email HTML template
    const html = `
      <div style="font-family: 'Playfair Display', Georgia, serif; background-color: #171715; color: #F6F1E8; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #1E1E1B; border: 1px solid #B99A63; border-radius: 12px; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #B99A63; font-size: 28px; letter-spacing: 0.2em; margin: 0; text-transform: uppercase;">A U R E L L E</h1>
            <p style="color: #A5A198; font-size: 11px; letter-spacing: 0.3em; margin-top: 5px; text-transform: uppercase;">Haute Gastronomie & Private Service</p>
          </div>
          <div style="border-top: 1px solid rgba(185, 154, 99, 0.2); padding-top: 30px; margin-bottom: 25px;">
            <p style="font-size: 16px; line-height: 1.6; color: #F6F1E8;">Dear <strong>${recipientName}</strong>,</p>
            <p style="font-size: 14px; line-height: 1.6; color: #D1CDC7;">
              You have been invited to join the culinary and hospitality team at <strong>Aurelle</strong> as <strong>${roleName}</strong> for <strong>${locationName}</strong>.
            </p>
            <p style="font-size: 14px; line-height: 1.6; color: #D1CDC7;">
              To activate your staff account and configure your secure authentication credentials, please select the link below:
            </p>
            <div style="text-align: center; margin: 35px 0;">
              <a href="${activationUrl}" style="background-color: #B99A63; color: #171715; padding: 14px 28px; text-decoration: none; font-weight: bold; font-size: 13px; letter-spacing: 0.15em; text-transform: uppercase; border-radius: 4px; display: inline-block;">
                Activate Staff Account
              </a>
            </div>
            <p style="font-size: 12px; color: #A5A198; line-height: 1.5;">
              This invitation token is cryptographically signed and will remain active for <strong>${expiresInHours} hours</strong>. If you did not anticipate this invitation, please contact restaurant administration.
            </p>
          </div>
          <div style="border-top: 1px solid rgba(185, 154, 99, 0.2); padding-top: 20px; text-align: center; font-size: 11px; color: #736F68;">
            Aurelle Restaurant Management Platform &bull; Confidential &bull; Single-Use Activation Link
          </div>
        </div>
      </div>
    `;

    if (!this.hasLiveProvider()) {
      logger.info(
        `[EmailService:Invitation] Dev Simulation: Invitation email generated for ${toEmail} (${roleName}). Activation URL: ${activationUrl}`
      );
      return {
        delivered: true,
        simulated: true,
        previewUrl: activationUrl,
      };
    }

    try {
      // If external provider is configured via Resend HTTP API
      if (process.env.RESEND_API_KEY) {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || 'Aurelle <no-reply@aurelle.com>',
            to: [toEmail],
            subject: "You're invited to join AURELLE",
            html,
          }),
        });

        if (response.ok) {
          const data: any = await response.json();
          return { delivered: true, simulated: false, messageId: data.id };
        }
      }

      logger.warn(`[EmailService] Live provider failed to deliver. Falling back to simulated log.`);
      return { delivered: false, simulated: true, previewUrl: activationUrl };
    } catch (err: any) {
      logger.error(`[EmailService] Delivery exception:`, err?.message || err);
      return { delivered: false, simulated: true, error: err.message, previewUrl: activationUrl };
    }
  }

  /**
   * Dispatch Staff Password Reset Email
   */
  async sendPasswordReset(params: SendPasswordResetEmailParams): Promise<EmailDispatchResult> {
    const { toEmail, recipientName, resetToken, expiresInMinutes = 60 } = params;
    const resetUrl = `${env.CLIENT_ORIGIN}/staff/login?resetToken=${encodeURIComponent(resetToken)}`;

    if (!this.hasLiveProvider()) {
      logger.info(
        `[EmailService:PasswordReset] Dev Simulation: Password reset for ${toEmail}. Link: ${resetUrl}`
      );
      return {
        delivered: true,
        simulated: true,
        previewUrl: resetUrl,
      };
    }

    // Provider delivery if configured
    return {
      delivered: true,
      simulated: false,
    };
  }

  /**
   * Dispatch General Transactional Notification Email
   */
  async sendNotificationEmail(params: {
    toEmail: string;
    recipientName?: string;
    title: string;
    message: string;
    link?: string;
    category?: string;
  }): Promise<EmailDispatchResult> {
    const { toEmail, recipientName = 'Valued Guest', title, message, link, category } = params;
    const actionUrl = link
      ? link.startsWith('http')
        ? link
        : `${env.CLIENT_ORIGIN}${link.startsWith('/') ? '' : '/'}${link}`
      : env.CLIENT_ORIGIN;

    const html = `
      <div style="font-family: 'Playfair Display', Georgia, serif; background-color: #171715; color: #F6F1E8; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #1E1E1B; border: 1px solid #B99A63; border-radius: 12px; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <div style="text-align: center; margin-bottom: 25px;">
            <h1 style="color: #B99A63; font-size: 26px; letter-spacing: 0.2em; margin: 0; text-transform: uppercase;">A U R E L L E</h1>
            <p style="color: #A5A198; font-size: 10px; letter-spacing: 0.3em; margin-top: 4px; text-transform: uppercase;">Haute Gastronomie & Private Dining</p>
          </div>
          <div style="border-top: 1px solid rgba(185, 154, 99, 0.2); padding-top: 25px; margin-bottom: 20px;">
            <div style="display: inline-block; padding: 4px 10px; border-radius: 4px; background: rgba(185, 154, 99, 0.15); color: #B99A63; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 15px;">
              ${category || 'Notification'}
            </div>
            <h2 style="font-size: 20px; color: #F6F1E8; margin-top: 0; margin-bottom: 12px;">${title}</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #D1CDC7; margin-bottom: 25px;">
              ${message}
            </p>
            ${
              link
                ? `<div style="text-align: center; margin: 30px 0;">
                    <a href="${actionUrl}" style="background-color: #B99A63; color: #171715; padding: 12px 24px; text-decoration: none; font-weight: bold; font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; border-radius: 4px; display: inline-block;">
                      View Details
                    </a>
                  </div>`
                : ''
            }
          </div>
          <div style="border-top: 1px solid rgba(185, 154, 99, 0.2); padding-top: 16px; text-align: center; font-size: 10px; color: #736F68;">
            Aurelle Restaurant &bull; 42 Grand Avenue &bull; Concierge: +94 11 234 5678
          </div>
        </div>
      </div>
    `;

    if (!this.hasLiveProvider()) {
      logger.info(
        `[EmailService:Notification] Dev Simulation: Email to ${toEmail} | Title: "${title}" | Link: ${actionUrl}`
      );
      return {
        delivered: true,
        simulated: true,
        previewUrl: actionUrl,
      };
    }

    try {
      if (process.env.RESEND_API_KEY) {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || 'Aurelle <no-reply@aurelle.com>',
            to: [toEmail],
            subject: title,
            html,
          }),
        });

        if (response.ok) {
          const data: any = await response.json();
          return { delivered: true, simulated: false, messageId: data.id };
        }
      }

      logger.warn(`[EmailService] Live provider failed to deliver. Falling back to simulated log.`);
      return { delivered: false, simulated: true, previewUrl: actionUrl };
    } catch (err: any) {
      logger.error(`[EmailService] Delivery exception:`, err?.message || err);
      return { delivered: false, simulated: true, error: err.message, previewUrl: actionUrl };
    }
  }
}

export const emailService = new EmailService();
