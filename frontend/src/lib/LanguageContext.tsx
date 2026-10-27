import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  LanguageCode,
  SUPPORTED_LANGUAGES,
  LanguageInfo,
  translations,
} from "./translations";
import axiosInstance from "./axiosinstance";
import { toast } from "react-toastify";
import { useAuth } from "./AuthContext";

interface LanguageContextType {
  language: LanguageCode;
  supportedLanguages: LanguageInfo[];
  t: (key: string, fallback?: string) => string;
  initiateLanguageSwitch: (code: LanguageCode) => Promise<void>;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  pendingLanguage: LanguageInfo | null;
  verificationType: "email" | "mobile";
  targetIdentifier: string;
  verifyAndApplyLanguage: (otp: string) => Promise<boolean>;
  devOtp?: string;
  isVerifying: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingLanguage, setPendingLanguage] = useState<LanguageInfo | null>(
    null
  );
  const [verificationType, setVerificationType] = useState<"email" | "mobile">(
    "email"
  );
  const [targetIdentifier, setTargetIdentifier] = useState("");
  const [devOtp, setDevOtp] = useState<string | undefined>(undefined);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem("preferred_lang") as LanguageCode;
      if (
        savedLang &&
        SUPPORTED_LANGUAGES.some((lang) => lang.code === savedLang)
      ) {
        setLanguage(savedLang);
      }
    }
  }, []);

  const t = (key: string, fallback?: string): string => {
    return translations[language]?.[key] || fallback || key;
  };

  const initiateLanguageSwitch = async (targetCode: LanguageCode) => {
    if (targetCode === language) return;

    const targetLang = SUPPORTED_LANGUAGES.find((l) => l.code === targetCode);
    if (!targetLang) return;

    setPendingLanguage(targetLang);

    // REQUIREMENT:
    // If switching to French -> verify via email OTP
    // For all other supported languages -> verify via mobile number OTP
    const isFrench = targetCode === "fr";
    setVerificationType(isFrench ? "email" : "mobile");

    try {
      const res = await axiosInstance.post("/user/language-switch/request-otp", {
        targetLanguage: targetCode,
        email: user?.email,
        phone: user?.phone,
        userId: user?._id,
      });

      setTargetIdentifier(res.data.identifier || (isFrench ? user?.email : user?.phone) || "");
      if (res.data.devOtp) {
        setDevOtp(res.data.devOtp);
      }
      setIsModalOpen(true);
      toast.info(res.data.message || "Verification code sent.");
    } catch (err: any) {
      console.error("Language switch OTP error:", err);
      toast.error(err.response?.data?.message || "Failed to initiate language switch verification.");
    }
  };

  const verifyAndApplyLanguage = async (otp: string): Promise<boolean> => {
    if (!pendingLanguage || !otp.trim()) {
      toast.error("Please enter the verification code.");
      return false;
    }

    setIsVerifying(true);
    try {
      const res = await axiosInstance.post("/user/language-switch/verify-otp", {
        identifier: targetIdentifier,
        otp: otp.trim(),
        targetLanguage: pendingLanguage.code,
        userId: user?._id,
      });

      if (res.data.success) {
        setLanguage(pendingLanguage.code);
        if (typeof window !== "undefined") {
          localStorage.setItem("preferred_lang", pendingLanguage.code);
        }
        setIsModalOpen(false);
        setPendingLanguage(null);
        setDevOtp(undefined);
        toast.success(`Language updated to ${pendingLanguage.name}!`);
        return true;
      }
      return false;
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Invalid or expired OTP code.");
      return false;
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        supportedLanguages: SUPPORTED_LANGUAGES,
        t,
        initiateLanguageSwitch,
        isModalOpen,
        setIsModalOpen,
        pendingLanguage,
        verificationType,
        targetIdentifier,
        verifyAndApplyLanguage,
        devOtp,
        isVerifying,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
