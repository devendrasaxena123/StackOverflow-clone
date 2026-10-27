import {
  Bookmark,
  ChevronDown,
  ChevronUp,
  Clock,
  Flag,
  History,
  Share,
  Trash,
  Trophy,
  Sparkles,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import Link from "next/link";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import axiosInstance from "@/lib/axiosinstance";
import Mainlayout from "@/layout/Mainlayout";
import { useAuth } from "@/lib/AuthContext";

const QuestionDetail = ({ questionId }: any) => {
  const router = useRouter();
  const [question, setQuestion] = useState<any>(null);
  const [newAnswer, setNewAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchQuestion();
  }, [questionId]);

  const fetchQuestion = async () => {
    try {
      const res = await axiosInstance.get(`/question/${questionId}`);
      setQuestion(res.data.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500 mx-auto"></div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="text-center text-gray-500 py-20 text-sm">
        Question not found.
      </div>
    );
  }

  const handleVote = async (vote: string) => {
    if (!user) {
      toast.info("Please login to vote.");
      router.push("/auth");
      return;
    }
    try {
      const res = await axiosInstance.patch(`/question/vote/${question._id}`, {
        value: vote,
        userid: user._id,
      });
      if (res.data.data) {
        setQuestion(res.data.data);
        toast.success("Vote updated");
      }
    } catch (error) {
      toast.error("Failed to vote on question.");
    }
  };

  const handleVoteAnswer = async (answerId: string, vote: string) => {
    if (!user) {
      toast.info("Please login to vote on answers.");
      router.push("/auth");
      return;
    }
    try {
      const res = await axiosInstance.patch(`/answer/vote/${question._id}`, {
        answerid: answerId,
        value: vote,
        userid: user._id,
      });
      if (res.data.data) {
        setQuestion(res.data.data);
        toast.success(
          vote === "upvote" ? "Answer upvoted!" : "Answer downvoted (-1 point penalty applied to author)"
        );
      }
    } catch (error) {
      toast.error("Failed to vote on answer.");
    }
  };

  const handleBookmark = () => {
    setQuestion((prev: any) => ({ ...prev, isBookmarked: !prev.isBookmarked }));
    toast.info("Bookmark updated");
  };

  const handleSubmitAnswer = async () => {
    if (!user) {
      toast.info("Please login to answer.");
      router.push("/auth");
      return;
    }
    if (!newAnswer.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await axiosInstance.post(
        `/answer/postanswer/${question._id}`,
        {
          noofanswer: question.noofanswer || 0,
          answerbody: newAnswer.trim(),
          useranswered: user.name,
          userid: user._id,
        }
      );
      if (res.data.data) {
        setQuestion(res.data.data);
        setNewAnswer("");
        toast.success("Answer posted! You earned +5 Reward Points 🪙");
      }
    } catch (error) {
      toast.error("Failed to post answer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!user) return;
    if (!window.confirm("Are you sure you want to delete this question?"))
      return;

    try {
      await axiosInstance.delete(`/question/delete/${question._id}`);
      toast.success("Question deleted successfully.");
      router.push("/");
    } catch (error) {
      toast.error("Failed to delete question.");
    }
  };

  const handleDeleteAnswer = async (id: string) => {
    if (!user) return;
    if (!window.confirm("Are you sure you want to delete this answer? (5 points will be deducted)"))
      return;

    try {
      const res = await axiosInstance.delete(`/answer/delete/${question._id}`, {
        data: { answerid: id },
      });
      if (res.data.data) {
        setQuestion(res.data.data);
        toast.info("Answer removed (-5 points deducted)");
      }
    } catch (error) {
      toast.error("Failed to delete answer.");
    }
  };

  const questionScore =
    (question.upvote?.length || 0) - (question.downvote?.length || 0);

  return (
    <div className="max-w-5xl mx-auto py-2">
      {/* Question Header */}
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h1 className="text-xl lg:text-2xl font-bold mb-3 text-gray-900 leading-snug">
          {question.questiontitle}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Asked {new Date(question.askedon).toLocaleDateString()}</span>
          </div>
          <div>
            <span>Answers: </span>
            <strong className="text-gray-800">{question.answer?.length || 0}</strong>
          </div>
        </div>
      </div>

      {/* Question Card */}
      <Card className="mb-8 rounded-2xl shadow-sm border-gray-200 overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row">
            {/* Voting Bar */}
            <div className="flex sm:flex-col items-center justify-center p-4 sm:p-5 border-b sm:border-b-0 sm:border-r border-gray-100 bg-gray-50/50 gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="p-1.5 hover:text-orange-600 rounded-full"
                onClick={() => handleVote("upvote")}
              >
                <ChevronUp className="w-6 h-6" />
              </Button>
              <span className="font-bold text-base text-gray-800 font-mono">
                {questionScore}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="p-1.5 hover:text-orange-600 rounded-full"
                onClick={() => handleVote("downvote")}
              >
                <ChevronDown className="w-6 h-6" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className={`p-1.5 mt-2 rounded-full ${
                  question?.isBookmarked
                    ? "text-yellow-500"
                    : "text-gray-400 hover:text-yellow-500"
                }`}
                onClick={handleBookmark}
              >
                <Bookmark
                  className="w-4 h-4"
                  fill={question?.isBookmarked ? "currentColor" : "none"}
                />
              </Button>
            </div>

            {/* Question Body */}
            <div className="flex-1 p-5 sm:p-6">
              <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-line mb-6">
                {question.questionbody}
              </div>

              <div className="flex flex-wrap gap-1.5 mb-6">
                {question.questiontags?.map((tag: string) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-medium cursor-pointer"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        navigator.clipboard.writeText(window.location.href);
                        toast.success("Question link copied!");
                      }
                    }}
                    className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1 px-2.5 py-1 rounded hover:bg-gray-100"
                  >
                    <Share className="w-3.5 h-3.5" /> Share
                  </button>

                  {question.userid === user?._id && (
                    <button
                      onClick={handleDeleteQuestion}
                      className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 px-2.5 py-1 rounded hover:bg-red-50"
                    >
                      <Trash className="w-3.5 h-3.5" /> Delete
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2.5 text-xs bg-orange-50/60 p-2.5 rounded-xl border border-orange-100">
                  <Avatar className="w-7 h-7">
                    <AvatarFallback className="text-xs bg-orange-600 text-white font-bold">
                      {question.userposted?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <span className="text-gray-400 text-[10px] block leading-tight">
                      asked {new Date(question.askedon).toLocaleDateString()}
                    </span>
                    <Link
                      href={`/users/${question.userid}`}
                      className="text-blue-600 hover:underline font-semibold leading-tight block"
                    >
                      {question.userposted}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Answers Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">
            {question.answer?.length || 0} Answer
            {question.answer?.length !== 1 ? "s" : ""}
          </h2>
          <span className="text-xs text-orange-600 font-semibold bg-orange-50 px-2.5 py-1 rounded-full border border-orange-100">
            🪙 +5 Points per answer | +5 Bonus at 5 upvotes
          </span>
        </div>

        <div className="space-y-4">
          {question.answer?.map((ans: any) => {
            const upvotesCount = ans.upvote?.length || 0;
            const downvotesCount = ans.downvote?.length || 0;
            const ansScore = upvotesCount - downvotesCount;
            const hasBonus = upvotesCount >= 5;

            return (
              <Card
                key={ans._id}
                className="rounded-2xl border-gray-200 shadow-sm overflow-hidden"
              >
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row">
                    {/* Answer Voting Column */}
                    <div className="flex sm:flex-col items-center justify-center p-3 sm:p-4 border-b sm:border-b-0 sm:border-r border-gray-100 bg-gray-50/50 gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 hover:text-orange-600 rounded-full"
                        onClick={() => handleVoteAnswer(ans._id, "upvote")}
                      >
                        <ChevronUp className="w-5 h-5" />
                      </Button>
                      <span className="font-bold text-sm text-gray-800 font-mono">
                        {ansScore}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 hover:text-orange-600 rounded-full"
                        onClick={() => handleVoteAnswer(ans._id, "downvote")}
                      >
                        <ChevronDown className="w-5 h-5" />
                      </Button>
                    </div>

                    <div className="flex-1 p-5">
                      {hasBonus && (
                        <div className="mb-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200">
                          <Trophy className="w-3.5 h-3.5 text-amber-600" />
                          <span>5+ Upvotes! +5 Bonus Points Awarded</span>
                        </div>
                      )}

                      <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-line mb-4">
                        {ans.answerbody}
                      </div>

                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-3 border-t border-gray-100">
                        <div>
                          {ans.userid === user?._id && (
                            <button
                              onClick={() => handleDeleteAnswer(ans._id)}
                              className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 font-medium"
                            >
                              <Trash className="w-3 h-3" /> Delete Answer (-5 pts)
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2.5 text-xs bg-gray-50 p-2 rounded-xl border border-gray-200/60">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-xs bg-blue-600 text-white font-bold">
                              {ans.useranswered?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="text-gray-400 text-[10px] block leading-tight">
                              answered {new Date(ans.answeredon).toLocaleDateString()}
                            </span>
                            <Link
                              href={`/users/${ans.userid}`}
                              className="text-blue-600 hover:underline font-semibold leading-tight block"
                            >
                              {ans.useranswered}
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Answer Submission Card */}
      <Card className="rounded-2xl border-gray-200 shadow-sm p-6">
        <h3 className="text-base font-bold text-gray-900 mb-2">Your Answer</h3>
        <p className="text-xs text-gray-500 mb-4">
          Each approved answer earns you <strong>5 Reward Points</strong>! Answer quality questions to climb the community leaderboard.
        </p>

        <Textarea
          placeholder="Write your answer clearly... You can use formatting or code blocks."
          rows={6}
          value={newAnswer}
          onChange={(e) => setNewAnswer(e.target.value)}
          className="mb-4 rounded-xl text-sm"
        />

        <div className="flex items-center justify-between">
          <Button
            onClick={handleSubmitAnswer}
            disabled={!newAnswer.trim() || isSubmitting}
            className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs transition shadow-sm"
          >
            {isSubmitting ? "Submitting..." : "Post Your Answer (+5 pts)"}
          </Button>

          <span className="text-xs text-gray-400">
            Earn rewards for quality contributions
          </span>
        </div>
      </Card>
    </div>
  );
};

export default QuestionDetail;
