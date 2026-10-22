import { logger } from '../utils/logger';

export interface SendSmsParams {
  toPhone: string;
  message: string;
  recipientName?: string;
}

export interface SmsDispatchResult {
  delivered: boolean;
  simulated: boolean;
  messageId?: string;
  error?: string;
}

class SmsService {
  private isEnabled(): boolean {
    return Boolean(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER
    );
  }

  async sendSms(params: SendSmsParams): Promise<SmsDispatchResult> {
    const { toPhone, message } = params;

    if (!this.isEnabled()) {
      logger.info(
        `[SmsService:Simulation] SMS simulation for ${toPhone}: "${message.slice(0, 100)}..."`
      );
      return {
        delivered: true,
        simulated: true,
        messageId: `sim_sms_${Date.now()}`,
      };
    }

    try {
      // In production with Twilio credentials configured
      const auth = Buffer.from(
        `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
      ).toString('base64');

      const body = new URLSearchParams({
        To: toPhone,
        From: process.env.TWILIO_PHONE_NUMBER!,
        Body: `[Aurelle] ${message}`,
      });

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${auth}`,
          },
          body: body.toString(),
        }
      );

      if (response.ok) {
        const data: any = await response.json();
        return {
          delivered: true,
          simulated: false,
          messageId: data.sid,
        };
      }

      logger.warn(`[SmsService] Twilio provider dispatch returned non-ok status: ${response.status}`);
      return {
        delivered: false,
        simulated: true,
        error: `Provider status ${response.status}`,
      };
    } catch (err: any) {
      logger.error(`[SmsService] Dispatch exception:`, err?.message || err);
      return {
        delivered: false,
        simulated: true,
        error: err?.message,
      };
    }
  }
}

export const smsService = new SmsService();
