import express from "express";
import {
  Signup,
  Login,
  VerifyChromeLoginOtp,
  RequestForgotPassword,
  ResetPassword,
  RequestLanguageSwitchOtp,
  VerifyLanguageSwitchOtp,
  TransferPoints,
  AddFriend,
  RemoveFriend,
  getallusers,
  getUserById,
  updateprofile,
} from "../controller/auth.js";

const router = express.Router();

router.post("/signup", Signup);
router.post("/login", Login);
router.post("/verify-chrome-otp", VerifyChromeLoginOtp);

// Forgot password routes
router.post("/forgot-password/request", RequestForgotPassword);
router.post("/forgot-password/reset", ResetPassword);

// Language switch OTP verification routes
router.post("/language-switch/request-otp", RequestLanguageSwitchOtp);
router.post("/language-switch/verify-otp", VerifyLanguageSwitchOtp);

// Points Transfer route
router.post("/transfer-points", TransferPoints);

// Friends routes
router.post("/friends/add", AddFriend);
router.post("/friends/remove", RemoveFriend);

// User profile & directory routes
router.get("/getalluser", getallusers);
router.get("/:id", getUserById);
router.patch("/update/:id", updateprofile);

export default router;
