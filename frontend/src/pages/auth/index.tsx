import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { toast } from "react-toastify";
import {
  Globe,
  ShieldCheck,
  Smartphone,
  Laptop,
  AlertTriangle,
  ArrowLeft,
  KeyRound,
  CheckCircle,
} from "lucide-react";

const AuthLoginPage = () => {
  const router = useRouter();
  const { Login, VerifyChromeOtp, loading, getClientEnvironment } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [environment, setEnvironment] = useState({
    browser: "Google Chrome",
    device: "desktop",
    isMobile: false,
  });

  // Chrome OTP step state
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otp, setOtp] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);

  // Mobile restriction state
  const [isMobileRestricted, setIsMobileRestricted] = useState(false);
  const [istTimeText, setIstTimeText] = useState("");

  useEffect(() => {
    const env = getClientEnvironment();
    setEnvironment(env);

    // Fetch server IST time to check mobile restriction
    const checkMobileAccess = async () => {
      try {
        const res = await axiosInstance.get("/time-info");
        setIstTimeText(res.data.timeString);
        if (env.isMobile && !res.data.isMobileLoginAllowed) {
          setIsMobileRestricted(true);
        }
      } catch (err) {
        console.error("Time check error:", err);
      }
    };
    checkMobileAccess();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.id]: e.target.value });
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error("All fields are required.");
      return;
    }

    if (environment.isMobile && isMobileRestricted) {
      toast.error(
        "Mobile logins are only allowed between 10:00 AM and 1:00 PM IST."
      );
      return;
    }

    try {
      const result = await Login(form);
      if (result?.requiresOtp) {
        setPendingEmail(result.email);
        setIsOtpStep(true);
        if (result.devOtp) setDevOtp(result.devOtp);
      } else if (result?.success) {
        router.push("/");
      }
    } catch (error: any) {
      if (error.response?.data?.error === "MOBILE_LOGIN_TIME_RESTRICTED") {
        setIsMobileRestricted(true);
      }
    }
  };

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      toast.error("Please enter the 6-digit OTP code.");
      return;
    }

    try {
      const result = await VerifyChromeOtp({
        email: pendingEmail,
        otp: otp.trim(),
      });
      if (result?.success) {
        router.push("/");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const isEdge = environment.browser.includes("Edge");
  const isChrome = environment.browser.includes("Chrome");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      {/* Brand Logo */}
      <div className="mb-6 text-center">
        <Link href="/" className="inline-flex items-center gap-2">
          <span className="text-3xl">🥞</span>
          <span className="text-2xl font-bold tracking-tight text-gray-900">
            stack<span className="text-[#ef8236]">overflow</span>
          </span>
        </Link>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          {isOtpStep ? "Verify Chrome Login" : "Log in to your account"}
        </h2>
        <p className="text-xs text-gray-500 mb-6">
          {isOtpStep
            ? `Enter the 6-digit verification code sent to ${pendingEmail}`
            : "Enter your credentials to access Stack Overflow."}
        </p>

        {/* ENVIRONMENT DETECTION BANNER */}
        <div className="mb-6 p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-xs">
          <div className="flex items-center justify-between text-gray-700 font-semibold mb-1">
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              Detected Environment:
            </span>
            <span className="text-[11px] font-mono text-gray-500">
              {environment.device === "mobile" ? "Mobile" : "Desktop/Laptop"}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <span className="font-bold text-gray-900">{environment.browser}</span>
            {isEdge && (
              <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <CheckCircle className="w-2.5 h-2.5" /> Direct Access (No OTP)
              </span>
            )}
            {isChrome && (
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <ShieldCheck className="w-2.5 h-2.5" /> Email OTP Required
              </span>
            )}
          </div>

          <p className="text-[11px] text-gray-500 mt-2">
            {isEdge
              ? "Microsoft browser detected: Access is granted without additional authentication."
              : isChrome
              ? "Google Chrome detected: For enhanced security, access is granted only after email OTP verification."
              : "Standard secure authentication."}
          </p>
        </div>

        {/* MOBILE TIME RESTRICTION WARNING */}
        {environment.isMobile && (
          <div
            className={`mb-6 p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
              isMobileRestricted
                ? "bg-red-50 border-red-200 text-red-900"
                : "bg-blue-50 border-blue-200 text-blue-900"
            }`}
          >
            <Smartphone className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Mobile Device Policy:</strong>
              <p className="mt-0.5 text-[11px]">
                Mobile logins are time-restricted: allowed{" "}
                <strong>ONLY between 10:00 AM and 1:00 PM IST</strong>.
              </p>
              {isMobileRestricted && (
                <div className="mt-2 text-red-700 font-bold bg-white/80 p-2 rounded border border-red-200">
                  ⛔ Access Denied: Outside mobile hours. Server time: {istTimeText}
                </div>
              )}
            </div>
          </div>
        )}

        {!isOtpStep ? (
          /* STEP 1: LOGIN FORM */
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold text-gray-700 mb-1.5"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label
                  htmlFor="password"
                  className="text-xs font-bold text-gray-700"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-orange-600 hover:text-orange-700"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || (environment.isMobile && isMobileRestricted)}
              className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl text-sm shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Authenticating..." : "Log in"}
            </button>
          </form>
        ) : (
          /* STEP 2: CHROME EMAIL OTP FORM */
          <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-xs text-orange-900">
              <ShieldCheck className="w-4 h-4 text-orange-600 inline mr-1" />
              We sent a 6-digit OTP code to <strong>{pendingEmail}</strong>.
            </div>

            {devOtp && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex justify-between items-center">
                <span>Demo Code: <strong>{devOtp}</strong></span>
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
                Enter 6-Digit Email OTP
              </label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="w-full text-center tracking-widest font-mono text-xl py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                autoFocus
                required
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsOtpStep(false)}
                className="w-1/3 py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs transition"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-2/3 py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl text-sm shadow-md transition disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify & Access"}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-gray-100 text-center text-xs text-gray-500">
          Don't have an account?{" "}
          <Link
            href="/signup"
            className="font-bold text-orange-600 hover:underline"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AuthLoginPage;
