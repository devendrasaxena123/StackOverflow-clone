import mongoose from "mongoose";
import userModel from "../models/auth.js";
import questionModel from "../models/question.js";
import { isPaymentTime, getISTInfo } from "../utils/timeCheck.js";
import { sendInvoiceEmail } from "../utils/mailer.js";

const PLAN_PRICES = {
  Free: 0,
  Bronze: 100,
  Silver: 300,
  Gold: 1000,
};

const PLAN_LIMITS = {
  Free: 1,
  Bronze: 5,
  Silver: 10,
  Gold: Infinity,
};

// Check time status of payments
export const getPaymentWindowStatus = async (req, res) => {
  const istInfo = getISTInfo();
  res.status(200).json({
    isPaymentAllowed: istInfo.isPaymentAllowed,
    timeString: istInfo.timeString,
    currentHour: istInfo.hours,
    message: istInfo.isPaymentAllowed
      ? "Payment window is currently OPEN (10:00 AM - 11:00 AM IST)."
      : "Payment window is currently CLOSED. Payments are accepted only between 10:00 AM and 11:00 AM IST.",
  });
};

// Process Subscription Checkout
export const processCheckout = async (req, res) => {
  const { userId, plan, gateway = "Razorpay" } = req.body;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Valid user ID is required." });
  }

  if (!["Bronze", "Silver", "Gold"].includes(plan)) {
    return res.status(400).json({ message: "Invalid subscription plan." });
  }

  // REQUIREMENT: To maintain controlled payment operations, the payment system should be time-restricted,
  // allowing payments only between 10:00 AM and 11:00 AM IST, and preventing users from completing payments outside this window.
  const istInfo = getISTInfo();
  if (!istInfo.isPaymentAllowed) {
    return res.status(403).json({
      message: `Payments are strictly allowed only between 10:00 AM and 11:00 AM IST. Current time is ${istInfo.timeString}.`,
      error: "PAYMENT_TIME_RESTRICTED",
      currentTime: istInfo.timeString,
    });
  }

  try {
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const amount = PLAN_PRICES[plan];
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
    const paymentId = `${gateway.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30); // 30-day subscription

    // Update user subscription
    user.subscription = {
      plan,
      startDate: new Date(),
      expiresDate: expiryDate,
      paymentId,
    };

    const newInvoice = {
      invoiceNumber,
      plan,
      amount,
      currency: "INR",
      date: new Date(),
      status: "PAID",
      paymentId,
    };

    user.invoices.unshift(newInvoice);
    await user.save();

    // REQUIREMENT: Upon successful payment, the system must automatically send an email to the user
    // containing the invoice and subscription plan details.
    await sendInvoiceEmail({
      email: user.email,
      name: user.name,
      plan,
      amount,
      invoiceNumber,
      paymentId,
      date: new Date(),
    });

    res.status(200).json({
      success: true,
      message: `Payment successful! You are now subscribed to the ${plan} Plan. An invoice has been automatically emailed to ${user.email}.`,
      subscription: user.subscription,
      invoice: newInvoice,
    });
  } catch (error) {
    console.error("processCheckout error:", error);
    res.status(500).json({ message: "Payment processing failed." });
  }
};

// Get User Subscription Status & Question Posting Quota
export const getSubscriptionStatus = async (req, res) => {
  const { userId } = req.params;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  try {
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const plan = user.subscription?.plan || "Free";
    const dailyLimit = PLAN_LIMITS[plan] ?? 1;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const questionsToday = await questionModel.countDocuments({
      userid: String(userId),
      askedon: { $gte: startOfToday },
    });

    const istInfo = getISTInfo();

    res.status(200).json({
      plan,
      dailyLimit,
      questionsToday,
      remainingQuestions:
        dailyLimit === Infinity ? "Unlimited" : Math.max(0, dailyLimit - questionsToday),
      subscription: user.subscription,
      invoices: user.invoices || [],
      isPaymentAllowed: istInfo.isPaymentAllowed,
      istTime: istInfo.timeString,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch subscription status." });
  }
};
