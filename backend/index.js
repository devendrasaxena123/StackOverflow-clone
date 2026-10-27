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

app.get("/db-status", (req, res) => {
  const states = ["disconnected", "connected", "connecting", "disconnecting"];
  res.json({
    status: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    dbState: states[mongoose.connection.readyState] || mongoose.connection.readyState,
    hasMongoUrlEnv: !!process.env.MONGODB_URL,
    mongoHost: mongoose.connection.host || "none",
    lastMongoError: lastMongoError || "none",
    istTime: getISTInfo().timeString,
  });
});

app.use("/user", userroutes);
app.use("/question", questionroute);
app.use("/answer", answerroutes);
app.use("/post", postroutes);
app.use("/subscription", subscriptionroutes);

const PORT = process.env.PORT || 5000;
const databaseurl =
  process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/stackoverflow";

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🕒 Server IST Time: ${getISTInfo().timeString}`);
});

mongoose
  .connect(databaseurl)
  .then(() => {
    lastMongoError = null;
    console.log("✅ Connected to MongoDB");
  })
  .catch((err) => {
    lastMongoError = err.message;
    console.error("❌ MongoDB connection error:", err.message);
    if (!process.env.MONGODB_URL) {
      console.warn(
        "⚠️ Warning: MONGODB_URL environment variable is not set on Render. Please configure MONGODB_URL in your Render Web Service Environment settings (e.g., from MongoDB Atlas)."
      );
    }
  });
