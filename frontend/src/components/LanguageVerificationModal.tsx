import React, { useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { Mail, Phone, ShieldCheck, X } from "lucide-react";

const LanguageVerificationModal = () => {
  const {
    isModalOpen,
    setIsModalOpen,
    pendingLanguage,
    verificationType,
    targetIdentifier,
    verifyAndApplyLanguage,
    devOtp,
    isVerifying,
  } = useLanguage();

  const [otp, setOtp] = useState("");

  if (!isModalOpen || !pendingLanguage) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await verifyAndApplyLanguage(otp);
    if (success) {
      setOtp("");
    }
  };

  const handleUseDevOtp = () => {
    if (devOtp) {
      setOtp(devOtp);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="font-semibold text-lg">Language Switch Verification</h3>
          </div>
          <button
            onClick={() => setIsModalOpen(false)}
            className="text-white/80 hover:text-white rounded-lg p-1 hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-50 text-3xl mb-3 shadow-inner">
              {pendingLanguage.flag}
            </div>
            <h4 className="text-lg font-bold text-gray-900">
              Switching to {pendingLanguage.name} ({pendingLanguage.nativeName})
            </h4>
            <p className="text-xs text-gray-500 mt-1">
              {verificationType === "email" ? (
                <span className="flex items-center justify-center gap-1 text-orange-700 font-medium">
                  <Mail className="w-3.5 h-3.5 inline" /> Email Authentication Required for French
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1 text-blue-700 font-medium">
                  <Phone className="w-3.5 h-3.5 inline" /> Mobile OTP Authentication Required
                </span>
              )}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 mb-5 border border-gray-200 text-center">
            A 6-digit verification code was sent to:{" "}
            <span className="font-semibold text-gray-800 block mt-0.5">
              {targetIdentifier || (verificationType === "email" ? "your registered email" : "your mobile number")}
            </span>
          </div>

          {devOtp && (
            <div className="mb-4 p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs text-amber-900">
              <span>
                Demo Test OTP: <strong>{devOtp}</strong>
              </span>
              <button
                type="button"
                onClick={handleUseDevOtp}
                className="text-[11px] underline font-semibold text-amber-700 hover:text-amber-800"
              >
                Auto-fill
              </button>
            </div>
          )}

          <div className="mb-5">
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Enter 6-Digit OTP Code
            </label>
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="w-full text-center text-2xl font-mono tracking-widest px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              autoFocus
              required
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isVerifying || otp.length < 6}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow transition"
            >
              {isVerifying ? "Verifying..." : "Verify & Switch"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LanguageVerificationModal;
