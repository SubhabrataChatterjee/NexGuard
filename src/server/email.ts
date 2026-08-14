import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(
  email: string,
  code: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'NexGuard <onboarding@resend.dev>',
      to: [email],
      subject: 'Your NexGuard Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <h2>NexGuard Email Verification</h2>

          <p>Your verification code is:</p>

          <div style="
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            margin: 25px 0;
          ">
            ${code}
          </div>

          <p>This code will expire in 15 minutes.</p>

          <p>If you did not create a NexGuard account, you can ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      console.error('❌ Resend error:', error);
      throw new Error(error.message);
    }

    console.log('✅ Verification email sent:', data?.id);

    return data;
  } catch (error) {
    console.error('❌ Failed to send verification email:', error);
    throw error;
  }
}