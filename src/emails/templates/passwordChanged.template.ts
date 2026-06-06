export const getPasswordChangedTemplate = (data: {
  name: string;
  time: string;
}) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Your Admin Password Was Changed</h2>
      <p>Hello ${data.name},</p>
      
      <p>This is a confirmation that your admin account password was successfully changed at <strong>${data.time}</strong>.</p>
      
      <div style="background-color: #fff3cd; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #ffeeba;">
        <strong>Security Alert:</strong> If this was not you, please secure your account immediately and contact technical support.
      </div>

      <p>Best regards,<br>Blog System</p>
    </div>
  `;
};
