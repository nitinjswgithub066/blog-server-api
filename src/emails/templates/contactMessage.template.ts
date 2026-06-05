import { EmailTemplateResult } from "../email.types";
import { baseEmailTemplate } from "./baseEmail.template";

export const buildContactMessageTemplate = (data: { name: string; email: string; subject: string; message: string; }): EmailTemplateResult => {
  const content = `
    <h2>New Contact Message</h2>
    <p><strong>Name:</strong> ${data.name}</p>
    <p><strong>Email:</strong> ${data.email}</p>
    <p><strong>Subject:</strong> ${data.subject}</p>
    <p><strong>Message:</strong><br/>${data.message}</p>
    <br/>
    <a href="#" style="background: #6d5df6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Open Dashboard</a>
  `;

  return {
    subject: `New Contact Form Submission: ${data.subject}`,
    html: baseEmailTemplate(content),
    text: `New Contact Message\
Name: ${data.name}\
Email: ${data.email}\
Subject: ${data.subject}\
Message: ${data.message}`,
  };
};
