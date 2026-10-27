import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  identifier: { type: String, required: true }, // email or phone number
  otp: { type: String, required: true },
  purpose: { type: String, required: true }, // 'login_chrome', 'language_switch', 'forgot_password'
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 }, // 10 minutes TTL
});

export default mongoose.model("otp", otpSchema);
