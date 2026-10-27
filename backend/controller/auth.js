import mongoose from "mongoose";
import user from "../models/auth.js";
import otpModel from "../models/otp.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UAParser } from "ua-parser-js";
import { isMobileLoginTime, getISTInfo } from "../utils/timeCheck.js";
import { sendOtpEmail } from "../utils/mailer.js";

// Helper to generate password containing ONLY uppercase and lowercase letters
export const generateAlphaOnlyPassword = (length = 12) => {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return result;
};

// Helper to generate a 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const Signup = async (req, res) => {
  const { name, email, password, phone } = req.body;
  try {
    const existingUser = await user.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    const hashPassword = await bcrypt.hash(password, 12);
    const newUser = await user.create({
      name,
      email,
      phone: phone || "",
      password: hashPassword,
      points: 15, // Starter points (giving > 10 so users can test transfer feature!)
      pointsHistory: [
        {
          amount: 15,
          type: "welcome_bonus",
          description: "Welcome starter bonus points",
          date: new Date(),
        },
      ],
      subscription: {
        plan: "Free",
        startDate: new Date(),
      },
    });

    const token = jwt.sign(
      { email: newUser.email, id: newUser._id },
      process.env.JWT_SECRET || "default_jwt_secret",
      { expiresIn: "7d" }
    );

    res.status(200).json({ data: newUser, token });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Something went wrong during signup." });
  }
};

export const Login = async (req, res) => {
  const { email, password, clientBrowser, clientDevice } = req.body;
  try {
    const existingUser = await user.findOne({ email });
    if (!existingUser) {
      return res.status(404).json({ message: "User does not exist" });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      existingUser.password
    );
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // 1. Detect Device & Browser Information
    const userAgent = req.headers["user-agent"] || "";
    const parser = new UAParser(userAgent);
    const uaResult = parser.getResult();

    const browserName = clientBrowser || uaResult.browser.name || "Unknown Browser";
    const osName = uaResult.os.name || "Unknown OS";
    
    // Determine device category
    let deviceCategory = "desktop";
    if (
      clientDevice === "mobile" ||
      uaResult.device.type === "mobile" ||
      uaResult.device.type === "tablet" ||
      /android|iphone|ipad|ipod|mobile/i.test(userAgent)
    ) {
      deviceCategory = "mobile";
    } else if (/laptop/i.test(userAgent) || osName.includes("Mac") || osName.includes("Windows")) {
      deviceCategory = "desktop/laptop";
    }

    // Get client IP address
    const clientIp =
      req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
      req.socket?.remoteAddress ||
      "127.0.0.1";

    // 2. Mobile Device Restriction: ONLY allowed between 10:00 AM and 1:00 PM IST
    if (deviceCategory === "mobile") {
      const allowed = isMobileLoginTime();
      if (!allowed) {
        const ist = getISTInfo();
        return res.status(403).json({
          message:
            "Mobile logins are only allowed between 10:00 AM and 1:00 PM IST. Current time: " +
            ist.timeString,
          error: "MOBILE_LOGIN_TIME_RESTRICTED",
          istTime: ist.timeString,
        });
      }
    }

    // 3. Browser-specific Authentication:
    // If Google Chrome => require OTP verification sent to email
    const isChrome =
      browserName.toLowerCase().includes("chrome") &&
      !browserName.toLowerCase().includes("edg") &&
      !browserName.toLowerCase().includes("opr");

    // If Microsoft browser (Edge, IE) => direct login without additional authentication
    const isMicrosoft =
      browserName.toLowerCase().includes("edge") ||
      browserName.toLowerCase().includes("edg") ||
      browserName.toLowerCase().includes("internet explorer") ||
      browserName.toLowerCase().includes("ie");

    if (isChrome) {
      // Generate OTP and store in DB
      const otp = generateOTP();
      await otpModel.deleteMany({ identifier: email, purpose: "login_chrome" });
      await otpModel.create({
        identifier: email,
        otp,
        purpose: "login_chrome",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
      });

      // Send OTP via email
      await sendOtpEmail(email, otp, "Google Chrome Login Verification");

      return res.status(200).json({
        requiresOtp: true,
        email: existingUser.email,
        browser: browserName,
        os: osName,
        deviceType: deviceCategory,
        ip: clientIp,
        message:
          "Google Chrome detected: Access is granted only after OTP verification sent to your email.",
        devOtp: process.env.NODE_ENV !== "production" ? otp : undefined, // For ease of testing
      });
    }

    // For Microsoft browsers or other direct access browsers:
    // Record login in user's login history
    existingUser.loginHistory.unshift({
      browser: browserName,
      os: osName,
      deviceType: deviceCategory,
      ip: clientIp,
      loginAt: new Date(),
    });
    // Keep max 50 entries
    if (existingUser.loginHistory.length > 50) {
      existingUser.loginHistory = existingUser.loginHistory.slice(0, 50);
    }
    await existingUser.save();

    const token = jwt.sign(
      { email: existingUser.email, id: existingUser._id },
      process.env.JWT_SECRET || "default_jwt_secret",
      { expiresIn: "7d" }
    );

    res.status(200).json({
      data: existingUser,
      token,
      message: isMicrosoft
        ? "Microsoft browser detected: Access granted without additional authentication."
        : "Login successful.",
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Something went wrong during login." });
  }
};

// Complete Chrome OTP verification
export const VerifyChromeLoginOtp = async (req, res) => {
  const { email, otp, browser, os, deviceType } = req.body;
  try {
    const validOtp = await otpModel.findOne({
      identifier: email,
      otp,
      purpose: "login_chrome",
    });

    if (!validOtp) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    const existingUser = await user.findOne({ email });
    if (!existingUser) {
      return res.status(404).json({ message: "User not found." });
    }

    // Clean up OTP
    await otpModel.deleteMany({ identifier: email, purpose: "login_chrome" });

    const clientIp =
      req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
      req.socket?.remoteAddress ||
      "127.0.0.1";

    existingUser.loginHistory.unshift({
      browser: browser || "Google Chrome",
      os: os || "Windows",
      deviceType: deviceType || "desktop/laptop",
      ip: clientIp,
      loginAt: new Date(),
    });
    if (existingUser.loginHistory.length > 50) {
      existingUser.loginHistory = existingUser.loginHistory.slice(0, 50);
    }
    await existingUser.save();

    const token = jwt.sign(
      { email: existingUser.email, id: existingUser._id },
      process.env.JWT_SECRET || "default_jwt_secret",
      { expiresIn: "7d" }
    );

    res.status(200).json({
      data: existingUser,
      token,
      message: "Chrome OTP verification successful! Access granted.",
    });
  } catch (error) {
    console.error("VerifyChromeLoginOtp error:", error);
    res.status(500).json({ message: "Something went wrong during verification." });
  }
};

// Forgot Password Feature: Request OTP & Generate Secure Alpha-Only Password
export const RequestForgotPassword = async (req, res) => {
  const { identifier } = req.body; // Can be email or phone
  if (!identifier) {
    return res.status(400).json({ message: "Email or phone number is required." });
  }

  try {
    const targetUser = await user.findOne({
      $or: [{ email: identifier.trim() }, { phone: identifier.trim() }],
    });

    if (!targetUser) {
      return res.status(404).json({ message: "No account found with this email or phone number." });
    }

    // Check: Allowed only ONCE PER DAY
    if (targetUser.lastForgotPasswordRequest) {
      const lastDate = new Date(targetUser.lastForgotPasswordRequest);
      const now = new Date();
      const isSameDay =
        lastDate.getFullYear() === now.getFullYear() &&
        lastDate.getMonth() === now.getMonth() &&
        lastDate.getDate() === now.getDate();

      if (isSameDay) {
        return res.status(429).json({
          message: "You can use this option only one time per day.",
          error: "LIMIT_REACHED",
        });
      }
    }

    // Generate random password containing ONLY uppercase and lowercase letters (NO numbers, NO special chars)
    const generatedPassword = generateAlphaOnlyPassword(12);

    // Generate OTP for verification
    const otp = generateOTP();
    await otpModel.deleteMany({ identifier: targetUser.email, purpose: "forgot_password" });
    await otpModel.create({
      identifier: targetUser.email,
      otp,
      purpose: "forgot_password",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    // Send OTP email
    await sendOtpEmail(targetUser.email, otp, "Password Reset");

    // Update last request timestamp
    targetUser.lastForgotPasswordRequest = new Date();
    await targetUser.save();

    res.status(200).json({
      message: "Reset code generated and sent.",
      generatedPassword, // User can choose to accept this generated password!
      email: targetUser.email,
      phone: targetUser.phone,
      devOtp: process.env.NODE_ENV !== "production" ? otp : undefined,
    });
  } catch (error) {
    console.error("RequestForgotPassword error:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
};

// Reset Password with OTP and New Password
export const ResetPassword = async (req, res) => {
  const { identifier, otp, newPassword } = req.body;
  if (!identifier || !otp || !newPassword) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const targetUser = await user.findOne({
      $or: [{ email: identifier.trim() }, { phone: identifier.trim() }],
    });

    if (!targetUser) {
      return res.status(404).json({ message: "User not found." });
    }

    const validOtp = await otpModel.findOne({
      identifier: targetUser.email,
      otp,
      purpose: "forgot_password",
    });

    if (!validOtp) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    // Hash new password and save
    targetUser.password = await bcrypt.hash(newPassword, 12);
    await targetUser.save();

    await otpModel.deleteMany({ identifier: targetUser.email, purpose: "forgot_password" });

    res.status(200).json({ message: "Password reset successfully! You can now log in." });
  } catch (error) {
    console.error("ResetPassword error:", error);
    res.status(500).json({ message: "Something went wrong during password reset." });
  }
};

// Language Switch OTP Request
export const RequestLanguageSwitchOtp = async (req, res) => {
  const { targetLanguage, email, phone, userId } = req.body;
  try {
    let targetEmail = email;
    let targetPhone = phone;

    if (userId) {
      const u = await user.findById(userId);
      if (u) {
        targetEmail = targetEmail || u.email;
        targetPhone = targetPhone || u.phone;
      }
    }

    const otp = generateOTP();

    if (targetLanguage === "fr") {
      // Switching to French: Verify via Email
      if (!targetEmail) {
        return res.status(400).json({ message: "Email is required for French language verification." });
      }
      await otpModel.deleteMany({ identifier: targetEmail, purpose: "lang_switch_fr" });
      await otpModel.create({
        identifier: targetEmail,
        otp,
        purpose: "lang_switch_fr",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });

      await sendOtpEmail(targetEmail, otp, "French Language Switch Verification");

      return res.status(200).json({
        message: "OTP sent to your registered email for French verification.",
        verificationType: "email",
        identifier: targetEmail,
        devOtp: process.env.NODE_ENV !== "production" ? otp : undefined,
      });
    } else {
      // All other languages: Authenticate via Mobile Number
      const phoneToUse = targetPhone || "9999999999"; // Fallback demo phone
      await otpModel.deleteMany({ identifier: phoneToUse, purpose: "lang_switch_mobile" });
      await otpModel.create({
        identifier: phoneToUse,
        otp,
        purpose: "lang_switch_mobile",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });

      console.log(`📱 [SMS OTP DISPATCHED] To: ${phoneToUse} | OTP: ${otp} | Reason: Language switch to ${targetLanguage}`);

      return res.status(200).json({
        message: `OTP sent to your registered mobile number (${phoneToUse}) to switch language.`,
        verificationType: "mobile",
        identifier: phoneToUse,
        devOtp: process.env.NODE_ENV !== "production" ? otp : undefined,
      });
    }
  } catch (error) {
    console.error("RequestLanguageSwitchOtp error:", error);
    res.status(500).json({ message: "Failed to send verification code." });
  }
};

// Verify Language Switch OTP
export const VerifyLanguageSwitchOtp = async (req, res) => {
  const { identifier, otp, targetLanguage, userId } = req.body;
  try {
    const validOtp = await otpModel.findOne({
      identifier,
      otp,
      purpose: targetLanguage === "fr" ? "lang_switch_fr" : "lang_switch_mobile",
    });

    if (!validOtp) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    await otpModel.deleteMany({ identifier });

    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      await user.findByIdAndUpdate(userId, { preferredLanguage: targetLanguage });
    }

    res.status(200).json({
      success: true,
      targetLanguage,
      message: `Language successfully switched to ${targetLanguage}!`,
    });
  } catch (error) {
    console.error("VerifyLanguageSwitchOtp error:", error);
    res.status(500).json({ message: "Failed to verify language switch." });
  }
};

// Points Transfer
export const TransferPoints = async (req, res) => {
  const { senderId, recipientEmailOrId, amount } = req.body;
  const transferAmount = Number(amount);

  if (!senderId || !recipientEmailOrId || !transferAmount || transferAmount <= 0) {
    return res.status(400).json({ message: "Valid recipient and positive amount required." });
  }

  try {
    const sender = await user.findById(senderId);
    if (!sender) {
      return res.status(404).json({ message: "Sender not found." });
    }

    // REQUIREMENT: Point transfers will ONLY be allowed if the user has MORE THAN 10 points!
    // Users with 10 points or fewer will NOT be able to transfer points.
    if ((sender.points || 0) <= 10) {
      return res.status(400).json({
        message:
          "Point transfers are only allowed if you have more than 10 points. Your balance is " +
          (sender.points || 0) +
          " points.",
      });
    }

    if (sender.points < transferAmount) {
      return res.status(400).json({
        message: `Insufficient points balance. You have ${sender.points} points.`,
      });
    }

    // Find recipient
    let recipient;
    if (mongoose.Types.ObjectId.isValid(recipientEmailOrId)) {
      recipient = await user.findById(recipientEmailOrId);
    }
    if (!recipient) {
      recipient = await user.findOne({ email: recipientEmailOrId });
    }

    if (!recipient) {
      return res.status(404).json({ message: "Recipient user not found." });
    }

    if (sender._id.toString() === recipient._id.toString()) {
      return res.status(400).json({ message: "You cannot transfer points to yourself." });
    }

    // Deduct from sender
    sender.points -= transferAmount;
    sender.pointsHistory.unshift({
      amount: -transferAmount,
      type: "transfer_sent",
      description: `Transferred ${transferAmount} points to ${recipient.name} (${recipient.email})`,
      date: new Date(),
    });
    await sender.save();

    // Add to recipient
    recipient.points = (recipient.points || 0) + transferAmount;
    recipient.pointsHistory.unshift({
      amount: transferAmount,
      type: "transfer_received",
      description: `Received ${transferAmount} points from ${sender.name} (${sender.email})`,
      date: new Date(),
    });
    await recipient.save();

    res.status(200).json({
      message: `Successfully transferred ${transferAmount} points to ${recipient.name}!`,
      remainingPoints: sender.points,
      recipientName: recipient.name,
    });
  } catch (error) {
    console.error("TransferPoints error:", error);
    res.status(500).json({ message: "Something went wrong during point transfer." });
  }
};

// Friends Management
export const AddFriend = async (req, res) => {
  const { userId, friendId } = req.body;
  if (!userId || !friendId || userId === friendId) {
    return res.status(400).json({ message: "Invalid user or friend ID." });
  }

  try {
    const currentUser = await user.findById(userId);
    const friendUser = await user.findById(friendId);

    if (!currentUser || !friendUser) {
      return res.status(404).json({ message: "User not found." });
    }

    // Bidirectional friendship for community connection
    if (!currentUser.friends.includes(friendId)) {
      currentUser.friends.push(friendId);
      await currentUser.save();
    }
    if (!friendUser.friends.includes(userId)) {
      friendUser.friends.push(userId);
      await friendUser.save();
    }

    res.status(200).json({
      message: `You and ${friendUser.name} are now connected as friends!`,
      friendsCount: currentUser.friends.length,
    });
  } catch (error) {
    console.error("AddFriend error:", error);
    res.status(500).json({ message: "Failed to connect friend." });
  }
};

export const RemoveFriend = async (req, res) => {
  const { userId, friendId } = req.body;
  try {
    await user.findByIdAndUpdate(userId, { $pull: { friends: friendId } });
    await user.findByIdAndUpdate(friendId, { $pull: { friends: userId } });
    res.status(200).json({ message: "Friend removed." });
  } catch (error) {
    res.status(500).json({ message: "Failed to remove friend." });
  }
};

export const getallusers = async (req, res) => {
  try {
    const alluser = await user.find().select("-password");
    res.status(200).json({ data: alluser });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong fetching users." });
  }
};

export const getUserById = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }
  try {
    const foundUser = await user.findById(id).select("-password").populate("friends", "name email");
    if (!foundUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ data: foundUser });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong." });
  }
};

export const updateprofile = async (req, res) => {
  const { id: _id } = req.params;
  const { name, about, tags, phone } = req.body.editForm || req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "User unavailable" });
  }
  try {
    const updateObj = {};
    if (name) updateObj.name = name;
    if (about !== undefined) updateObj.about = about;
    if (tags) updateObj.tags = tags;
    if (phone !== undefined) updateObj.phone = phone;

    const updatedProfile = await user.findByIdAndUpdate(
      _id,
      { $set: updateObj },
      { new: true }
    ).select("-password");
    res.status(200).json({ data: updatedProfile });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update profile." });
  }
};
