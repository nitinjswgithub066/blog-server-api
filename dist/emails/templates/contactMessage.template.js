"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildContactMessageTemplate = void 0;
const baseEmail_template_1 = require("./baseEmail.template");
const buildContactMessageTemplate = (data) => {
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
        html: (0, baseEmail_template_1.baseEmailTemplate)(content),
        text: `New Contact Message\
Name: ${data.name}\
Email: ${data.email}\
Subject: ${data.subject}\
Message: ${data.message}`,
    };
};
exports.buildContactMessageTemplate = buildContactMessageTemplate;
//# sourceMappingURL=contactMessage.template.js.map