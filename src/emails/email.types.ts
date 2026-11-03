export interface SendEmailOptions {
  to: string;
  toName?: string;
  replyTo?: string;
  subject: string;
  html: string;
  text?: string;
  type?: string;
}

export interface EmailTemplateResult {
  subject: string;
  html: string;
  text: string;
}
