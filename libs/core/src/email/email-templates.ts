export const SimpleEmailTemplate = ({
  title,
  name,
  message,
  actionText,
  actionLink,
  footerNote,
}: {
  title: string;
  name?: string;
  message: string;
  actionText?: string;
  actionLink?: string;
  footerNote?: string;
}) => `
<!DOCTYPE html>
<html>
<body style="background:#f5f5f5;font-family:Arial;padding:20px;">
  <table width="100%" align="center">
    <tr>
      <td align="center">
        <table width="600" style="background:#fff;border-radius:8px;">
          <tr>
            <td style="background:#FF735C;color:#fff;padding:16px;text-align:center;">
              <h2>${title}</h2>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              ${name ? `<p>Hi ${name},</p>` : ''}
              <p>${message}</p>

              ${
                actionText
                  ? `<p style="text-align:center;">
                      <a href="${actionLink}"
                         style="background:#FF735C;color:#fff;
                         padding:10px 24px;text-decoration:none;border-radius:4px;">
                         ${actionText}
                      </a>
                    </p>`
                  : ''
              }
            </td>
          </tr>
          <tr>
            <td style="background:#f0f0f0;padding:12px;text-align:center;font-size:12px;">
              ${footerNote || 'If you didn’t request this email, ignore it.'}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const EmailTemplates = {
  otp: (name: string, otp: string) =>
    SimpleEmailTemplate({
      title: 'Verification Code',
      name,
      message: `<strong style="font-size:22px;">${otp}</strong><br/>Expires in 10 minutes.`,
      footerNote: 'Never share your OTP.',
    }),

  welcome: (name: string) =>
    SimpleEmailTemplate({
      title: 'Welcome to Resuminatore',
      name,
      message: 'Your account is ready. Start building your resume.',
      actionText: 'Get Started',
      actionLink: 'https://resuminatore.vercel.app',
    }),

  passwordReset: (name: string, link: string) =>
    SimpleEmailTemplate({
      title: 'Reset Password',
      name,
      message: 'Click below to reset your password.',
      actionText: 'Reset Password',
      actionLink: link,
    }),
};
