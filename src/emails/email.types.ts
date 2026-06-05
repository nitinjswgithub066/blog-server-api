export interface SendEmailOptions {
  to: string;
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
