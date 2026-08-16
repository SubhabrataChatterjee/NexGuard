export async function sendVerificationEmail(
  email: string,
  code: string
) {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    const fromEmail = process.env.BREVO_FROM_EMAIL;
    const fromName = process.env.BREVO_FROM_NAME || "NexGuard";

    if (!apiKey) {
      throw new Error("BREVO_API_KEY is not configured");
    }

    if (!fromEmail) {
      throw new Error("BREVO_FROM_EMAIL is not configured");
    }

    console.log("📧 Brevo API CONFIG CHECK:", {
      apiKeyPresent: !!apiKey,
      fromEmail,
      fromName,
    });

    const response = await fetch(
      "https://api.brevo.com/v3/smtp/email",
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "api-key": apiKey,
        },
        body: JSON.stringify({
          sender: {
            name: fromName,
            email: fromEmail,
          },
          to: [
            {
              email,
            },
          ],
          subject: "Your NexGuard Verification Code",
          htmlContent: `
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
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();

      console.error("❌ Brevo API error:", {
        status: response.status,
        body: errorBody,
      });

      throw new Error(
        `Brevo API returned ${response.status}: ${errorBody}`
      );
    }

    const result = await response.json();

    console.log(
      "✅ Verification email sent:",
      result.messageId
    );

    return result;
  } catch (error) {
    console.error("❌ Verification email error:", error);
    throw error;
  }
}