export const getForgotPasswordTemplate = (data: {
  resetUrl: string;
}) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Reset Your Admin Password</h2>
      <p>We received a request to reset your admin password.</p>
      
      <p>Click the button below to reset your password. This link will expire in 15 minutes.</p>
      
      <div style="margin: 30px 0;">
        <a href="${data.resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
      </div>
      
      <p>Alternatively, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #666; font-size: 14px;">${data.resetUrl}</p>

      <p style="color: #d9534f; font-size: 14px; margin-top: 20px;">
        <strong>Security Warning:</strong> If you did not request a password reset, please ignore this email. You will need your Admin Registration Code to complete the reset process.
      </p>
      
      <p style="margin-top: 30px;">Best regards,<br>Blog System</p>
    </div>
  `;
};
