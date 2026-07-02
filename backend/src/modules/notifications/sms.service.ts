import { appConfig } from "../../common/config.js";

type SendOtpSmsInput = {
  to: string;
  code: string;
};

function otpMessage(code: string) {
  return `Your OkadaGo verification code is ${code}. It expires in 10 minutes.`;
}

function normalizeTermiiRecipient(phoneE164: string) {
  return phoneE164.replace(/^\+/, "");
}

function termiiBaseUrlForRecipient(phoneE164: string) {
  if (phoneE164.startsWith("+234")) {
    return "https://api.ng.termii.com";
  }

  if (phoneE164.startsWith("+233")) {
    return "https://v3.api.termii.com";
  }

  return appConfig.termiiBaseUrl;
}

export function hasSmsConfig() {
  if (appConfig.smsProvider === "termii") {
    return Boolean(appConfig.termiiApiKey && appConfig.termiiSenderId);
  }

  if (appConfig.smsProvider === "twilio") {
    return Boolean(
      appConfig.twilioAccountSid && appConfig.twilioAuthToken && appConfig.twilioFromNumber
    );
  }

  return false;
}

export class SmsService {
  async sendOtpSms(input: SendOtpSmsInput) {
    if (appConfig.smsProvider === "termii") {
      await this.sendViaTermii(input);
      return;
    }

    if (appConfig.smsProvider === "twilio") {
      await this.sendViaTwilio(input);
      return;
    }

    throw new Error(
      "SMS is not configured. Set SMS_PROVIDER=termii or twilio with the matching credentials."
    );
  }

  private async sendViaTermii(input: SendOtpSmsInput) {
    if (!appConfig.termiiApiKey || !appConfig.termiiSenderId) {
      throw new Error("Termii is not configured. Set TERMII_API_KEY and TERMII_SENDER_ID.");
    }

    const baseUrl = termiiBaseUrlForRecipient(input.to);
    const response = await fetch(`${baseUrl}/api/sms/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        api_key: appConfig.termiiApiKey,
        to: normalizeTermiiRecipient(input.to),
        from: appConfig.termiiSenderId,
        sms: otpMessage(input.code),
        type: "plain",
        channel: "generic"
      })
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Termii SMS failed (${response.status}): ${body || response.statusText}`);
    }
  }

  private async sendViaTwilio(input: SendOtpSmsInput) {
    if (!appConfig.twilioAccountSid || !appConfig.twilioAuthToken || !appConfig.twilioFromNumber) {
      throw new Error(
        "Twilio is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER."
      );
    }

    const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${appConfig.twilioAccountSid}/Messages.json`;
    const auth = Buffer.from(`${appConfig.twilioAccountSid}:${appConfig.twilioAuthToken}`).toString("base64");
    const body = new URLSearchParams({
      To: input.to,
      From: appConfig.twilioFromNumber,
      Body: otpMessage(input.code)
    });

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body
    });

    if (!response.ok) {
      const payload = await response.text();
      throw new Error(`Twilio SMS failed (${response.status}): ${payload || response.statusText}`);
    }
  }
}

export const smsService = new SmsService();
