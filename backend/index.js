import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import userroutes from "./routes/auth.js";
import questionroute from "./routes/question.js";
import answerroutes from "./routes/answer.js";
import postroutes from "./routes/post.js";
import subscriptionroutes from "./routes/subscription.js";
import { getISTInfo } from "./utils/timeCheck.js";

const app = express();
dotenv.config();

app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Stack Overflow Clone API is running perfectly",
    istTime: getISTInfo().timeString,
  });
});

app.get("/time-info", (req, res) => {
  res.json(getISTInfo());
});

let lastMongoError = null;

const databaseurl =
  process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/stackoverflow";

app.get("/db-status", (req, res) => {
  const states = ["disconnected", "connected", "connecting", "disconnecting"];
  const maskedUrl = process.env.MONGODB_URL
    ? process.env.MONGODB_URL.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:***@")
    : "not set (using fallback localhost)";
  res.json({
    status: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    dbState: states[mongoose.connection.readyState] || mongoose.connection.readyState,
    hasMongoUrlEnv: !!process.env.MONGODB_URL,
    maskedUrl,
    mongoHost: mongoose.connection.host || "none",
    lastMongoError: lastMongoError || "none",
    istTime: getISTInfo().timeString,
  });
});

app.get("/reconnect-db", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(databaseurl, { serverSelectionTimeoutMS: 8000 });
      lastMongoError = null;
    }
    res.json({
      success: true,
      status: "connected",
      mongoHost: mongoose.connection.host,
      message: "MongoDB connected successfully!",
    });
  } catch (err) {
    lastMongoError = err.message;
    res.status(500).json({
      success: false,
      status: "error",
      error: err.message,
      suggestion:
        "Ensure 0.0.0.0/0 (Allow access from anywhere) is in MongoDB Atlas Network Access whitelist.",
    });
  }
});

app.use("/user", userroutes);
app.use("/question", questionroute);
app.use("/answer", answerroutes);
app.use("/post", postroutes);
app.use("/subscription", subscriptionroutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🕒 Server IST Time: ${getISTInfo().timeString}`);
});

let isConnecting = false;
const connectDB = async () => {
  if (mongoose.connection.readyState === 1 || isConnecting) return;
  isConnecting = true;
  try {
    await mongoose.connect(databaseurl, { serverSelectionTimeoutMS: 7000 });
    lastMongoError = null;
    console.log("✅ Connected to MongoDB successfully:", mongoose.connection.host);
  } catch (err) {
    lastMongoError = err.message;
    console.error("❌ MongoDB connection error:", err.message);
    if (!process.env.MONGODB_URL) {
      console.warn(
        "⚠️ Warning: MONGODB_URL environment variable is not set. Using localhost default."
      );
    }
    // Automatically retry in 10 seconds
    setTimeout(connectDB, 10000);
  } finally {
    isConnecting = false;
  }
};

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ MongoDB disconnected. Attempting reconnect in 5s...");
  setTimeout(connectDB, 5000);
});

connectDB();
