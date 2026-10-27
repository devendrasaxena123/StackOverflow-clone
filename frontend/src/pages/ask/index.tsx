import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Mainlayout from "@/layout/Mainlayout";
import { useAuth } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { Crown, Plus, X, AlertTriangle, ArrowRight } from "lucide-react";
import { useRouter } from "next/router";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

const AskQuestionPage = () => {
  const router = useRouter();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: "",
    body: "",
    tags: [] as string[],
  });
  const [newTag, setNewTag] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Subscription quota state
  const [quotaInfo, setQuotaInfo] = useState<any>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [limitErrorMessage, setLimitErrorMessage] = useState("");

  useEffect(() => {
    if (user?._id) {
      fetchQuota();
    }
  }, [user?._id]);

  const fetchQuota = async () => {
    try {
      const res = await axiosInstance.get(`/subscription/status/${user._id}`);
      setQuotaInfo(res.data);
    } catch (error) {
      console.error("Quota fetch error:", error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    if (id === "tags") {
      const tagarray = value
        .split(/[s,]+/)
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
      setFormData((prev) => ({ ...prev, tags: tagarray }));
    } else {
      setFormData((prev) => ({ ...prev, [id]: value }));
    }
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTag = newTag.trim();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData({ ...formData, tags: [...formData.tags, trimmedTag] });
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to ask a question.");
      router.push("/auth");
      return;
    }

    if (!formData.title.trim() || !formData.body.trim()) {
      toast.error("Please fill in both the title and body.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axiosInstance.post("/question/Askquestion", {
        postquestiondata: {
          questiontitle: formData.title,
          questionbody: formData.body,
          questiontags: formData.tags.length > 0 ? formData.tags : ["general"],
          userposted: user.name,
          userid: user._id,
        },
      });

      if (res.data.data) {
        toast.success("Question posted successfully!");
        router.push("/");
      }
    } catch (error: any) {
      if (
        error.response?.status === 403 ||
        error.response?.data?.error === "PLAN_LIMIT_REACHED"
      ) {
        const msg =
          error.response?.data?.message ||
          "Daily question limit reached for your active plan.";
        setLimitErrorMessage(msg);
        setShowUpgradeModal(true);
      } else {
        toast.error(error.response?.data?.message || "Failed to post question.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Mainlayout>
      <div className="max-w-4xl mx-auto py-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Ask a public question</h1>

          {/* User's Plan Quota Badge */}
          {user && quotaInfo && (
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-xl text-xs">
              <Crown className="w-4 h-4 text-orange-600" />
              <span className="font-semibold text-gray-800">
                {quotaInfo.plan} Plan:
              </span>
              <span className="text-orange-700 font-bold">
                {quotaInfo.questionsToday} /{" "}
                {quotaInfo.dailyLimit === Infinity
                  ? "Unlimited"
                  : quotaInfo.dailyLimit}{" "}
                today
              </span>
              <Link
                href="/subscription"
                className="text-orange-600 font-bold hover:underline ml-1"
              >
                Upgrade
              </Link>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="rounded-2xl border-gray-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-base font-bold text-gray-900">
                Title
              </CardTitle>
              <p className="text-xs text-gray-500">
                Be specific and imagine you're asking a question to another developer.
              </p>
            </CardHeader>
            <CardContent className="pt-4">
              <Input
                id="title"
                placeholder="e.g. Is there an R function for finding the index of an element in a vector?"
                value={formData.title}
                onChange={handleChange}
                className="text-sm rounded-xl"
                required
              />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-gray-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-base font-bold text-gray-900">
                What are the details of your problem?
              </CardTitle>
              <p className="text-xs text-gray-500">
                Introduce the problem and expand on what you put in the title. Minimum 20 characters.
              </p>
            </CardHeader>
            <CardContent className="pt-4">
              <Textarea
                id="body"
                rows={8}
                placeholder="Explain what you were trying to do, what happened, and paste any relevant code..."
                value={formData.body}
                onChange={handleChange}
                className="text-sm rounded-xl resize-y"
                required
              />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-gray-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-base font-bold text-gray-900">
                Tags
              </CardTitle>
              <p className="text-xs text-gray-500">
                Add up to 5 tags to describe what your question is about.
              </p>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex gap-2 mb-3">
                <Input
                  placeholder="e.g. javascript, react, mongodb"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag(e);
                    }
                  }}
                  className="text-sm rounded-xl"
                />
                <Button
                  type="button"
                  onClick={handleAddTag}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-xl"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Tag
                </Button>
              </div>

              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-red-500 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-sm shadow-md transition"
          >
            {isSubmitting ? "Posting Question..." : "Post your question"}
          </Button>
        </form>

        {/* Upgrade Subscription Modal when daily limit reached */}
        {showUpgradeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-700 mx-auto flex items-center justify-center mb-4">
                <Crown className="w-7 h-7" />
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Daily Limit Reached
              </h3>
              <p className="text-xs text-gray-600 mb-6 leading-relaxed">
                {limitErrorMessage ||
                  "You have reached your daily question posting quota for your active plan. Upgrade your subscription to Bronze, Silver, or Gold to post more questions today."}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition"
                >
                  Dismiss
                </button>
                <Link
                  href="/subscription"
                  className="flex-1 py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-md"
                >
                  <span>View Plans</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </Mainlayout>
  );
};

export default AskQuestionPage;
