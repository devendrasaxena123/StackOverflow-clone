import nodemailer from "nodemailer";

let transporter = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Development fallback transporter (or logging transporter)
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: {
        user: "test@ethereal.email",
        pass: "testpass",
      },
    });
  }
  return transporter;
};

export const sendEmail = async ({ to, subject, html, text }) => {
  console.log(`\n========================================`);
  console.log(`📧 [EMAIL DISPATCHED]`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  if (text) console.log(`Text: ${text}`);
  console.log(`========================================\n`);

  try {
    const transport = await getTransporter();
    await transport.sendMail({
      from: `"Stack Overflow Clone" <no-reply@stackoverflow-clone.local>`,
      to,
      subject,
      html,
      text,
    });
  } catch (err) {
    console.log("Notice: Email logged to console (SMTP fallback active):", err.message);
  }
};

export const sendOtpEmail = async (email, otp, reason = "verification") => {
  const subject = `Your Verification Code: ${otp}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #ea580c; margin-bottom: 8px;">Stack Overflow Clone</h2>
      <p style="color: #475569; font-size: 15px;">You requested a verification code for <strong>${reason}</strong>.</p>
      <div style="background-color: #f8fafc; padding: 18px; border-radius: 6px; text-align: center; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0f172a;">${otp}</span>
      </div>
      <p style="color: #64748b; font-size: 13px;">This code is valid for 10 minutes. If you did not request this, please disregard this email.</p>
    </div>
  `;
  await sendEmail({ to: email, subject, html, text: `Your OTP is: ${otp}` });
};

export const sendInvoiceEmail = async ({
  email,
  name,
  plan,
  amount,
  invoiceNumber,
  paymentId,
  date,
}) => {
  const subject = `Subscription Invoice #${invoiceNumber} - ${plan} Plan`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #ea580c; padding-bottom: 15px;">
        <h2 style="color: #ea580c; margin: 0;">Stack Overflow Clone</h2>
        <span style="background: #dcfce7; color: #15803d; padding: 4px 12px; border-radius: 9999px; font-weight: bold; font-size: 12px;">PAID</span>
      </div>

      <div style="margin: 24px 0;">
        <h3 style="color: #1e293b; margin-bottom: 4px;">Thank you for your subscription, ${name}!</h3>
        <p style="color: #64748b; margin-top: 0; font-size: 14px;">Here is the receipt for your recent purchase.</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; color: #64748b;">Invoice Number:</td>
          <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #1e293b;">${invoiceNumber}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; color: #64748b;">Date:</td>
          <td style="padding: 10px 0; text-align: right; color: #1e293b;">${new Date(date).toLocaleString()}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; color: #64748b;">Plan:</td>
          <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #ea580c;">${plan} Plan</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; color: #64748b;">Payment ID:</td>
          <td style="padding: 10px 0; text-align: right; font-family: monospace; color: #1e293b;">${paymentId}</td>
        </tr>
        <tr style="border-top: 2px solid #e2e8f0;">
          <td style="padding: 14px 0; font-size: 16px; font-weight: bold; color: #0f172a;">Total Paid:</td>
          <td style="padding: 14px 0; text-align: right; font-size: 18px; font-weight: bold; color: #0f172a;">₹${amount}</td>
        </tr>
      </table>

      <div style="background-color: #fff7ed; padding: 14px; border-radius: 8px; border-left: 4px solid #ea580c; font-size: 13px; color: #9a3412;">
        <strong>Subscription Active!</strong> Your question posting limit has been updated. Enjoy posting questions and sharing knowledge.
      </div>
    </div>
  `;

  await sendEmail({
    to: email,
    subject,
    html,
    text: `Invoice #${invoiceNumber} for ${plan} Plan (₹${amount}). Payment ID: ${paymentId}. Status: PAID`,
  });
};
