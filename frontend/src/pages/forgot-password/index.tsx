import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import axiosInstance from "@/lib/axiosinstance";
import { toast } from "react-toastify";
import {
  KeyRound,
  ShieldAlert,
  ArrowLeft,
  Sparkles,
  Copy,
  Check,
  Mail,
  Phone,
} from "lucide-react";

// Client-side helper to generate random password containing ONLY uppercase and lowercase letters
const generateLettersOnlyPassword = (length = 12) => {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let pass = "";
  for (let i = 0; i < length; i++) {
    pass += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return pass;
};

const ForgotPasswordPage = () => {
  const router = useRouter();

  // Form states
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState<1 | 2>(1); // 1 = Request, 2 = Verify & Reset
  const [loading, setLoading] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Generated password state
  const [generatedPass, setGeneratedPass] = useState("");
  const [copied, setCopied] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const handleGeneratePassword = () => {
    const pass = generateLettersOnlyPassword(12);
    setGeneratedPass(pass);
    setNewPassword(pass);
    toast.info("Secure letters-only password generated!");
  };

  const handleCopyPassword = () => {
    if (generatedPass) {
      navigator.clipboard.writeText(generatedPass);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Password copied to clipboard!");
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      toast.error("Please enter your registered email address or phone number.");
      return;
    }

    setLoading(true);
    setWarningMessage(null);

    try {
      const res = await axiosInstance.post("/user/forgot-password/request", {
        identifier: identifier.trim(),
      });

      if (res.data.generatedPassword) {
        setGeneratedPass(res.data.generatedPassword);
        setNewPassword(res.data.generatedPassword);
      }
      if (res.data.devOtp) {
        setDevOtp(res.data.devOtp);
      }

      toast.success(res.data.message || "Reset code sent.");
      setStep(2);
    } catch (error: any) {
      if (error.response?.status === 429 || error.response?.data?.error === "LIMIT_REACHED") {
        const msg = error.response?.data?.message || "You can use this option only one time per day.";
        setWarningMessage(msg);
        toast.warning(msg);
      } else {
        const msg = error.response?.data?.message || "Failed to process request.";
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || !newPassword.trim()) {
      toast.error("Please enter the OTP and your new password.");
      return;
    }

    setLoading(true);
    try {
      const res = await axiosInstance.post("/user/forgot-password/reset", {
        identifier: identifier.trim(),
        otp: otp.trim(),
        newPassword: newPassword.trim(),
      });

      toast.success(res.data.message || "Password reset successfully!");
      router.push("/auth");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="mb-6 text-center">
        <Link href="/" className="inline-flex items-center gap-2">
          <span className="text-3xl">🥞</span>
          <span className="text-2xl font-bold tracking-tight text-gray-900">
            stack<span className="text-[#ef8236]">overflow</span>
          </span>
        </Link>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 bg-orange-100 text-orange-600 rounded-xl">
            <KeyRound className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            {step === 1 ? "Reset Your Password" : "Set New Password"}
          </h2>
        </div>

        <p className="text-xs text-gray-500 mb-6">
          {step === 1
            ? "Enter your registered email address or phone number to receive a verification code. This option can be used once per day."
            : "Enter the verification code and set your new password."}
        </p>

        {/* Warning Message if limit reached */}
        {warningMessage && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 animate-in fade-in">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">Notice</h4>
              <p className="text-xs mt-0.5">{warningMessage}</p>
            </div>
          </div>
        )}

        {/* Password Generator Feature Box */}
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-orange-900">
              <Sparkles className="w-4 h-4 text-orange-600" />
              <span>Alphabetical Password Generator</span>
            </div>
            <button
              type="button"
              onClick={handleGeneratePassword}
              className="text-[11px] font-semibold text-orange-700 bg-white hover:bg-orange-100 border border-orange-300 px-2 py-0.5 rounded shadow-2xs transition"
            >
              Generate
            </button>
          </div>

          <p className="text-[11px] text-gray-600 mb-2">
            Generates a clean password containing <strong>only uppercase and lowercase letters</strong> (no numbers, no special characters).
          </p>

          {generatedPass && (
            <div className="flex items-center justify-between bg-white border border-orange-200 rounded-lg px-3 py-2 text-xs">
              <span className="font-mono text-sm tracking-wide font-semibold text-gray-900 select-all">
                {generatedPass}
              </span>
              <button
                type="button"
                onClick={handleCopyPassword}
                className="text-gray-500 hover:text-orange-600 transition p-1"
                title="Copy password"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          )}
        </div>

        {step === 1 ? (
          /* Step 1: Identifier Input */
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Registered Email or Phone Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="name@example.com or 9876543210"
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              <span className="text-[11px] text-gray-400 mt-1 block">
                Allowed only once per day to prevent misuse.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl text-sm shadow-md transition disabled:opacity-50"
            >
              {loading ? "Sending Code..." : "Send Verification Code"}
            </button>
          </form>
        ) : (
          /* Step 2: OTP & New Password */
          <form onSubmit={handleResetPassword} className="space-y-4">
            {devOtp && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex justify-between items-center">
                <span>Demo Test Code: <strong>{devOtp}</strong></span>
                <button
                  type="button"
                  onClick={() => setOtp(devOtp)}
                  className="underline font-bold text-[11px]"
                >
                  Auto-fill
                </button>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                6-Digit Verification Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="w-full text-center tracking-widest font-mono text-xl py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-gray-700">
                  New Password
                </label>
                {generatedPass && (
                  <button
                    type="button"
                    onClick={() => setNewPassword(generatedPass)}
                    className="text-[11px] font-semibold text-orange-600 hover:underline"
                  >
                    Use Generated
                  </button>
                )}
              </div>
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                required
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl text-xs transition"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl text-sm shadow-md transition disabled:opacity-50"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <Link
            href="/auth"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-orange-600 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Log in</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
