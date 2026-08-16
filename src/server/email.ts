import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com",
  port: Number(process.env.BREVO_SMTP_PORT || 587),
  secure: false,
  requireTLS: true,

  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS,
  },

  tls: {
    rejectUnauthorized: false,
  },
});

export async function sendVerificationEmail(
  email: string,
  code: string
) {
  try {
    console.log("📧 SMTP CONFIG CHECK:", {
  host: process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com",
  port: Number(process.env.BREVO_SMTP_PORT || 587),
  userPresent: !!process.env.BREVO_SMTP_USER,
  passPresent: !!process.env.BREVO_SMTP_PASS,
  fromEmail: process.env.BREVO_FROM_EMAIL,
});
    const info = await transporter.sendMail({
      from: `"${process.env.BREVO_FROM_NAME || "NexGuard"}" <${process.env.BREVO_FROM_EMAIL}>`,
      to: email,
      subject: "Your NexGuard Verification Code",
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

          <p>
            If you did not create a NexGuard account,
            you can ignore this email.
          </p>
        </div>
      `,
    });

    console.log("✅ Verification email sent:", info.messageId);

    return info;
  } catch (error) {
    console.error("❌ Brevo email error:", error);
    throw error;
  }
}