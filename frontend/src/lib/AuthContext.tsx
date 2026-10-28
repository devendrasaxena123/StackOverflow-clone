import React, { useState, createContext, useContext } from "react";
import axiosInstance from "./axiosinstance";
import { toast } from "react-toastify";

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to detect client browser and device
  const getClientEnvironment = () => {
    if (typeof window === "undefined") {
      return { browser: "Unknown", device: "desktop", isMobile: false };
    }

    const ua = navigator.userAgent;
    let browser = "Other Browser";

    if (/edg/i.test(ua)) {
      browser = "Microsoft Edge";
    } else if (/chrome|crios/i.test(ua) && !/opr|brave/i.test(ua)) {
      browser = "Google Chrome";
    } else if (/firefox|fxios/i.test(ua)) {
      browser = "Mozilla Firefox";
    } else if (/safari/i.test(ua) && !/chrome/i.test(ua)) {
      browser = "Apple Safari";
    }

    const isMobile = /android|iphone|ipad|ipod|mobile/i.test(ua);
    const device = isMobile ? "mobile" : "desktop";

    return { browser, device, isMobile };
  };

  const Signup = async ({ name, email, password, phone }: any) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.post("/user/signup", {
        name,
        email,
        password,
        phone,
      });
      const { data, token } = res.data;
      localStorage.setItem("user", JSON.stringify({ ...data, token }));
      setUser(data);
      toast.success("Signup Successful! Welcome to Stack Overflow.");
      return { success: true };
    } catch (err: any) {
      const msg = err.response?.data?.message || "Signup failed.";
      setError(msg);
      toast.error(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const Login = async ({ email, password }: any) => {
    setLoading(true);
    setError(null);

    const { browser, device } = getClientEnvironment();

    try {
      const res = await axiosInstance.post("/user/login", {
        email,
        password,
        clientBrowser: browser,
        clientDevice: device,
      });

      // Check if Chrome OTP verification is required
      if (res.data.requiresOtp) {
        toast.info(res.data.message || "OTP verification required for Google Chrome.");
        return {
          requiresOtp: true,
          email: res.data.email,
          browser: res.data.browser,
          devOtp: res.data.devOtp,
        };
      }

      // Direct login granted (Microsoft Edge or direct access)
      const { data, token } = res.data;
      localStorage.setItem("user", JSON.stringify({ ...data, token }));
      setUser(data);
      toast.success(res.data.message || "Login Successful");
      return { success: true };
    } catch (err: any) {
      const msg = err.response?.data?.message || "Login failed.";
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const VerifyChromeOtp = async ({ email, otp }: any) => {
    setLoading(true);
    setError(null);
    const { browser, device } = getClientEnvironment();

    try {
      const res = await axiosInstance.post("/user/verify-chrome-otp", {
        email,
        otp,
        browser,
        deviceType: device,
      });

      const { data, token } = res.data;
      localStorage.setItem("user", JSON.stringify({ ...data, token }));
      setUser(data);
      toast.success("Chrome OTP verified! Access granted.");
      return { success: true };
    } catch (err: any) {
      const msg = err.response?.data?.message || "OTP verification failed.";
      setError(msg);
      toast.error(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const Logout = () => {
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
    }
    toast.info("Logged out successfully");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        Signup,
        Login,
        VerifyChromeOtp,
        Logout,
        loading,
        error,
        getClientEnvironment,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
