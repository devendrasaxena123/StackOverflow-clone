import React, { useState, useEffect } from "react";
import Mainlayout from "@/layout/Mainlayout";
import { useAuth } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { toast } from "react-toastify";
import confetti from "canvas-confetti";
import {
  Crown,
  Check,
  Clock,
  AlertTriangle,
  Receipt,
  ShieldCheck,
  Sparkles,
  Zap,
  ArrowRight,
  CreditCard,
  X,
  Printer,
} from "lucide-react";

interface PlanDetail {
  id: "Free" | "Bronze" | "Silver" | "Gold";
  name: string;
  price: number;
  limit: string;
  dailyLimitNumber: number;
  badge?: string;
  features: string[];
  recommended?: boolean;
}

const PLANS: PlanDetail[] = [
  {
    id: "Free",
    name: "Free Plan",
    price: 0,
    limit: "1 Question / Day",
    dailyLimitNumber: 1,
    features: [
      "1 question per day",
      "Standard community answers",
      "Access to public social space",
      "Basic profile and badges",
    ],
  },
  {
    id: "Bronze",
    name: "Bronze Plan",
    price: 100,
    limit: "5 Questions / Day",
    dailyLimitNumber: 5,
    badge: "Essential",
    features: [
      "Up to 5 questions per day",
      "Bronze Contributor profile badge",
      "Faster community exposure",
      "Priority question indexing",
      "Automatic email invoice receipt",
    ],
  },
  {
    id: "Silver",
    name: "Silver Plan",
    price: 300,
    limit: "10 Questions / Day",
    dailyLimitNumber: 10,
    badge: "Most Popular",
    recommended: true,
    features: [
      "Up to 10 questions per day",
      "Silver Pro profile badge",
      "Highlighted questions in feed",
      "Enhanced community visibility",
      "Automatic email invoice receipt",
    ],
  },
  {
    id: "Gold",
    name: "Gold Plan",
    price: 1000,
    limit: "Unlimited Questions",
    dailyLimitNumber: Infinity,
    badge: "VIP Unlimited",
    features: [
      "Unlimited question posting",
      "Gold VIP badge on profile & posts",
      "Top placement in search results",
      "Direct developer connections",
      "Full priority support & receipts",
    ],
  },
];

const SubscriptionPage = () => {
  const { user } = useAuth();

  const [activePlan, setActivePlan] = useState<string>("Free");
  const [questionsToday, setQuestionsToday] = useState<number>(0);
  const [invoices, setInvoices] = useState<any[]>([]);

  // Time Window state
  const [isPaymentAllowed, setIsPaymentAllowed] = useState(false);
  const [istTimeString, setIstTimeString] = useState("");
  const [loadingTime, setLoadingTime] = useState(true);

  // Checkout modal
  const [selectedPlan, setSelectedPlan] = useState<PlanDetail | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [gateway, setGateway] = useState<"Razorpay" | "Stripe">("Razorpay");
  const [isProcessing, setIsProcessing] = useState(false);

  // Success Invoice modal
  const [latestInvoice, setLatestInvoice] = useState<any>(null);

  useEffect(() => {
    fetchTimeInfo();
    const interval = setInterval(fetchTimeInfo, 10000); // Poll time every 10s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user?._id) {
      fetchUserSubscription();
    }
  }, [user?._id]);

  const fetchTimeInfo = async () => {
    try {
      const res = await axiosInstance.get("/time-info");
      setIsPaymentAllowed(res.data.isPaymentAllowed);
      setIstTimeString(res.data.timeString);
    } catch (error) {
      console.error("Error fetching time info:", error);
    } finally {
      setLoadingTime(false);
    }
  };

  const fetchUserSubscription = async () => {
    try {
      const res = await axiosInstance.get(`/subscription/status/${user._id}`);
      setActivePlan(res.data.plan || "Free");
      setQuestionsToday(res.data.questionsToday || 0);
      setInvoices(res.data.invoices || []);
    } catch (error) {
      console.error("Error fetching subscription status:", error);
    }
  };

  const handleOpenCheckout = (plan: PlanDetail) => {
    if (!user) {
      toast.info("Please log in to upgrade your subscription.");
      return;
    }
    if (plan.id === activePlan) {
      toast.info(`You are already subscribed to the ${plan.name}.`);
      return;
    }
    setSelectedPlan(plan);
    setIsCheckoutOpen(true);
  };

  const handleCompletePayment = async () => {
    if (!selectedPlan || !user) return;

    if (!isPaymentAllowed) {
      toast.error(
        `Payments are only accepted between 10:00 AM and 11:00 AM IST. Current time: ${istTimeString}`
      );
      return;
    }

    setIsProcessing(true);
    try {
      const res = await axiosInstance.post("/subscription/checkout", {
        userId: user._id,
        plan: selectedPlan.id,
        gateway,
      });

      if (res.data.success) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });

        toast.success(res.data.message || "Subscription activated!");
        setIsCheckoutOpen(false);
        setLatestInvoice(res.data.invoice);
        fetchUserSubscription();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Payment failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Mainlayout>
      <div className="max-w-6xl mx-auto py-2">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 mb-3">
            <Crown className="w-3.5 h-3.5 text-orange-600" /> Subscription Plans
          </span>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Ask More, Learn Faster
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            Choose a plan that fits your asking habits. Upgrade anytime with secure time-regulated checkout.
          </p>
        </div>

        {/* TIME RESTRICTION STATUS BANNER */}
        <div
          className={`mb-8 p-4 rounded-2xl border transition shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isPaymentAllowed
              ? "bg-green-50 border-green-200 text-green-950"
              : "bg-amber-50 border-amber-200 text-amber-950"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${
                isPaymentAllowed
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">
                  {isPaymentAllowed ? "Payment Window OPEN" : "Payment Window CLOSED"}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    isPaymentAllowed
                      ? "bg-green-600 text-white"
                      : "bg-amber-600 text-white"
                  }`}
                >
                  {isPaymentAllowed ? "Active (10 - 11 AM IST)" : "Time-Restricted"}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">
                Payments are permitted <strong>strictly between 10:00 AM and 11:00 AM IST</strong>. Current time:{" "}
                <span className="font-mono font-bold text-gray-900">
                  {loadingTime ? "Checking..." : istTimeString}
                </span>
              </p>
            </div>
          </div>

          {!isPaymentAllowed && (
            <div className="text-xs font-semibold text-amber-800 bg-white/80 px-3 py-1.5 rounded-lg border border-amber-200 self-start sm:self-auto">
              Checkout opens daily at 10:00 AM IST
            </div>
          )}
        </div>

        {/* Current User Status Banner */}
        {user && (
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-xs mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-600 text-white font-bold flex items-center justify-center text-base">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">
                  Active Subscription: <span className="text-orange-600">{activePlan} Plan</span>
                </h4>
                <p className="text-xs text-gray-500">
                  You have posted <strong>{questionsToday}</strong> question(s) today.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Invoices on file:</span>
              <span className="text-xs font-bold bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full">
                {invoices.length}
              </span>
            </div>
          </div>
        )}

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {PLANS.map((plan) => {
            const isCurrent = activePlan === plan.id;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl bg-white border transition duration-200 p-6 flex flex-col justify-between ${
                  plan.recommended
                    ? "border-orange-500 shadow-lg ring-2 ring-orange-400/20"
                    : isCurrent
                    ? "border-blue-400 bg-blue-50/20"
                    : "border-gray-200 shadow-sm hover:shadow-md"
                }`}
              >
                {plan.badge && (
                  <span
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-xs ${
                      plan.recommended
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white"
                        : "bg-gray-800 text-white"
                    }`}
                  >
                    {plan.badge}
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg text-gray-900">{plan.name}</h3>
                    {isCurrent && (
                      <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200">
                        Current Plan
                      </span>
                    )}
                  </div>

                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-gray-900">
                        {plan.price === 0 ? "Free" : `₹${plan.price}`}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-xs text-gray-500 font-medium">
                          / month
                        </span>
                      )}
                    </div>
                    <span className="inline-block mt-1 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                      {plan.limit}
                    </span>
                  </div>

                  <div className="pt-4 border-t border-gray-100 space-y-2.5 mb-6">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-gray-600">
                        <Check className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full py-2.5 rounded-xl text-xs font-bold text-gray-500 bg-gray-100 cursor-default"
                    >
                      Active Plan
                    </button>
                  ) : plan.price === 0 ? (
                    <button
                      disabled
                      className="w-full py-2.5 rounded-xl text-xs font-bold text-gray-500 bg-gray-100 cursor-default"
                    >
                      Default Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenCheckout(plan)}
                      disabled={!isPaymentAllowed}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 ${
                        isPaymentAllowed
                          ? "bg-orange-600 hover:bg-orange-700 text-white shadow-orange-500/20"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                      }`}
                    >
                      {isPaymentAllowed ? (
                        <>
                          <span>Subscribe for ₹{plan.price}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      ) : (
                        <span>Opens at 10:00 AM IST</span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Invoices and Billing History Section */}
        {invoices.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-8">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-orange-600" />
                <h3 className="font-bold text-base text-gray-900">
                  Subscription Invoices & Receipts
                </h3>
              </div>
              <span className="text-xs text-gray-500">
                Automatic receipts sent to your registered email
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-100 pb-2">
                    <th className="py-2">Invoice #</th>
                    <th className="py-2">Plan</th>
                    <th className="py-2">Amount</th>
                    <th className="py-2">Date</th>
                    <th className="py-2">Payment ID</th>
                    <th className="py-2">Status</th>
                    <th className="py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoices.map((inv, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="py-3 font-mono font-bold text-gray-800">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 font-semibold text-orange-600">
                        {inv.plan} Plan
                      </td>
                      <td className="py-3 font-bold text-gray-900">
                        ₹{inv.amount}
                      </td>
                      <td className="py-3 text-gray-500">
                        {new Date(inv.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 font-mono text-[11px] text-gray-400">
                        {inv.paymentId}
                      </td>
                      <td className="py-3">
                        <span className="bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded text-[10px]">
                          {inv.status || "PAID"}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => setLatestInvoice(inv)}
                          className="px-2.5 py-1 text-gray-600 hover:text-orange-600 bg-gray-50 hover:bg-orange-50 border border-gray-200 rounded font-semibold text-[11px] transition"
                        >
                          View Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CHECKOUT MODAL */}
        {isCheckoutOpen && selectedPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-orange-500 to-amber-600 px-6 py-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  <h3 className="font-semibold text-lg">Complete Subscription</h3>
                </div>
                <button
                  onClick={() => setIsCheckoutOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-3.5 mb-5 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-sm text-orange-950">
                      {selectedPlan.name}
                    </h4>
                    <span className="text-xs text-orange-700">
                      {selectedPlan.limit}
                    </span>
                  </div>
                  <span className="text-2xl font-black text-orange-950">
                    ₹{selectedPlan.price}
                  </span>
                </div>

                {/* Gateway selection */}
                <div className="mb-5">
                  <label className="block text-xs font-bold text-gray-700 mb-2">
                    Select Payment Gateway
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setGateway("Razorpay")}
                      className={`p-3 rounded-xl border text-left transition ${
                        gateway === "Razorpay"
                          ? "border-blue-600 bg-blue-50/50 text-blue-900 font-bold"
                          : "border-gray-200 hover:bg-gray-50 text-gray-700 text-xs"
                      }`}
                    >
                      <span className="block text-sm">Razorpay</span>
                      <span className="text-[10px] text-gray-400 font-normal">
                        UPI, Cards, Netbanking
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setGateway("Stripe")}
                      className={`p-3 rounded-xl border text-left transition ${
                        gateway === "Stripe"
                          ? "border-blue-600 bg-blue-50/50 text-blue-900 font-bold"
                          : "border-gray-200 hover:bg-gray-50 text-gray-700 text-xs"
                      }`}
                    >
                      <span className="block text-sm">Stripe</span>
                      <span className="text-[10px] text-gray-400 font-normal">
                        Credit & Debit Cards
                      </span>
                    </button>
                  </div>
                </div>

                <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-xl mb-5 space-y-1">
                  <div className="flex justify-between">
                    <span>Subscriber:</span>
                    <strong className="text-gray-800">{user?.name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Invoice dispatched to:</span>
                    <strong className="text-gray-800">{user?.email}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Time Window:</span>
                    <strong className="text-green-700">10:00 - 11:00 AM IST (Verified)</strong>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCheckoutOpen(false)}
                    className="flex-1 py-2.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCompletePayment}
                    disabled={isProcessing}
                    className="flex-1 py-2.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-md transition disabled:opacity-50"
                  >
                    {isProcessing ? "Processing..." : `Pay ₹${selectedPlan.price}`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* INVOICE PREVIEW MODAL */}
        {latestInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100">
              <div className="p-6">
                <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                  <div>
                    <h3 className="font-extrabold text-xl text-gray-900">INVOICE</h3>
                    <span className="font-mono text-xs text-gray-500">
                      #{latestInvoice.invoiceNumber}
                    </span>
                  </div>
                  <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full border border-green-200">
                    PAID
                  </span>
                </div>

                <div className="py-4 space-y-3 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Billed To:</span>
                    <span className="font-bold text-gray-900">{user?.name} ({user?.email})</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Date:</span>
                    <span className="font-semibold text-gray-800">
                      {new Date(latestInvoice.date).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Payment ID:</span>
                    <span className="font-mono text-gray-800">{latestInvoice.paymentId}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Plan:</span>
                    <span className="font-bold text-orange-600">{latestInvoice.plan} Plan</span>
                  </div>
                  <div className="pt-3 border-t border-gray-200 flex justify-between text-sm font-extrabold text-gray-900">
                    <span>Total Amount Paid:</span>
                    <span>₹{latestInvoice.amount}</span>
                  </div>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-xs text-orange-950 mb-4">
                  📧 An official copy of this invoice has been automatically sent to <strong>{user?.email}</strong>.
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => window.print()}
                    className="flex-1 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print Receipt
                  </button>
                  <button
                    onClick={() => setLatestInvoice(null)}
                    className="flex-1 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Mainlayout>
  );
};

export default SubscriptionPage;
