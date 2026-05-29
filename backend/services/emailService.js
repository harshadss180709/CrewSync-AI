import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST || "smtp.gmail.com",
  port:   Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const FROM = `"CrewSync AI" <${process.env.EMAIL_USER}>`;
const CLIENT = process.env.CLIENT_URL || "https://crewsync-ai.netlify.app";

export async function sendVerificationEmail(user, token) {
  const link = `${CLIENT}/verify-email/${token}`;
  await transporter.sendMail({
    from:    FROM,
    to:      user.email,
    subject: "Verify your CrewSync AI account",
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#0f0f13;color:#e5e7eb;border-radius:12px;">
        <h2 style="color:#6366f1;margin-bottom:8px;">Welcome to CrewSync AI, ${user.name}!</h2>
        <p>Click the button below to verify your email address.</p>
        <a href="${link}" style="display:inline-block;margin:20px 0;padding:12px 28px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
          Verify Email
        </a>
        <p style="font-size:13px;color:#6b7280;">Or paste this link in your browser:<br/>${link}</p>
        <p style="font-size:12px;color:#4b5563;margin-top:24px;">This link expires in 24 hours. If you didn't create an account, ignore this email.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(user, token) {
  const link = `${CLIENT}/reset-password/${token}`;
  await transporter.sendMail({
    from:    FROM,
    to:      user.email,
    subject: "Reset your CrewSync AI password",
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#0f0f13;color:#e5e7eb;border-radius:12px;">
        <h2 style="color:#6366f1;">Password Reset</h2>
        <p>Click below to reset your password. This link expires in 1 hour.</p>
        <a href="${link}" style="display:inline-block;margin:20px 0;padding:12px 28px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
          Reset Password
        </a>
        <p style="font-size:13px;color:#6b7280;">Or paste this link in your browser:<br/>${link}</p>
        <p style="font-size:12px;color:#4b5563;margin-top:24px;">If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
}
