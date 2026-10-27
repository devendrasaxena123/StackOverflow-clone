import mongoose from "mongoose";

const userschema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, default: "" },
  password: { type: String, required: true },
  about: { type: String, default: "" },
  tags: { type: [String], default: [] },
  joinDate: { type: Date, default: Date.now },
  points: { type: Number, default: 15 },
  pointsHistory: [
    {
      amount: { type: Number, required: true },
      type: { type: String, required: true },
      description: { type: String },
      date: { type: Date, default: Date.now },
    },
  ],
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
  friendRequestsReceived: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
  friendRequestsSent: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
  subscription: {
    plan: {
      type: String,
      enum: ["Free", "Bronze", "Silver", "Gold"],
      default: "Free",
    },
    startDate: { type: Date, default: Date.now },
    expiresDate: { type: Date },
    paymentId: { type: String },
  },
  invoices: [
    {
      invoiceNumber: { type: String },
      plan: { type: String },
      amount: { type: Number },
      currency: { type: String, default: "INR" },
      date: { type: Date, default: Date.now },
      status: { type: String, default: "PAID" },
      paymentId: { type: String },
    },
  ],
  loginHistory: [
    {
      browser: { type: String },
      os: { type: String },
      deviceType: { type: String },
      ip: { type: String },
      loginAt: { type: Date, default: Date.now },
    },
  ],
  lastForgotPasswordRequest: { type: Date },
  preferredLanguage: { type: String, default: "en" },
});

export default mongoose.model("user", userschema);
