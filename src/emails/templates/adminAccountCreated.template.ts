export const getAdminAccountCreatedTemplate = (data: {
  name: string;
  email: string;
  username: string;
  adminRegistrationCode: string;
  loginUrl: string;
}) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Your Admin Account Has Been Created</h2>
      <p>Hello ${data.name},</p>
      <p>Your admin account for the blog dashboard has been successfully created.</p>
      
      <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Username:</strong> ${data.username}</p>
        <p><strong>Admin Registration Code:</strong> ${data.adminRegistrationCode}</p>
      </div>

      <p style="color: #d9534f; font-weight: bold;">
        SECURITY NOTE: Save this Admin Registration Code securely. It is required when resetting your password. This code will not be shown again.
      </p>

      <p>You can log in to your dashboard here:</p>
      <a href="${data.loginUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 5px;">Login to Dashboard</a>
      
      <p>Best regards,<br>Blog System</p>
    </div>
  `;
};
