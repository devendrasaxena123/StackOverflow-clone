import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Mainlayout from "@/layout/Mainlayout";
import axiosInstance from "@/lib/axiosinstance";
import { useLanguage } from "@/lib/LanguageContext";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Sparkles, MessageSquare, Plus } from "lucide-react";

export default function Home() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await axiosInstance.get("/question/getallquestion");
        setQuestions(res.data.data || []);
      } catch (error) {
        console.error("Error fetching questions:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  return (
    <Mainlayout>
      <div className="w-full">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b border-gray-100 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t("allQuestions", "Top Questions")}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Explore questions and answers from the community
            </p>
          </div>
          <button
            onClick={() => router.push("/ask")}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            {t("askQuestion", "Ask Question")}
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500 mx-auto"></div>
            <p className="text-xs text-gray-500 mt-3">Loading questions...</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-800 text-base mb-1">No questions yet</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mb-5">
              Be the first to ask a question and get answers from experienced developers.
            </p>
            <button
              onClick={() => router.push("/ask")}
              className="px-5 py-2.5 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 transition"
            >
              Ask the First Question
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4 text-xs text-gray-500">
              <span>
                <strong>{questions.length}</strong> questions found
              </span>
            </div>

            <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl bg-white shadow-2xs overflow-hidden">
              {questions.map((q: any) => {
                const votes = (q.upvote?.length || 0) - (q.downvote?.length || 0);
                const answersCount = q.answer?.length || q.noofanswer || 0;

                return (
                  <div key={q._id} className="p-4 sm:p-5 hover:bg-gray-50/50 transition">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Metric Stats */}
                      <div className="flex sm:flex-col items-center justify-start text-xs sm:w-20 gap-3 sm:gap-1.5 shrink-0">
                        <div className="text-center">
                          <span className="font-bold text-gray-800 text-sm block">
                            {votes}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {t("votes", "votes")}
                          </span>
                        </div>
                        <div
                          className={`text-center px-2 py-0.5 rounded-lg ${
                            answersCount > 0
                              ? "bg-green-100 text-green-800 font-bold border border-green-200"
                              : "text-gray-500"
                          }`}
                        >
                          <span className="font-bold text-xs block">
                            {answersCount}
                          </span>
                          <span className="text-[10px]">
                            {t("answers", "answers")}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/questions/${q._id}`}
                          className="text-blue-600 hover:text-blue-800 text-base font-semibold mb-1.5 block hover:underline"
                        >
                          {q.questiontitle}
                        </Link>
                        <p className="text-gray-600 text-xs mb-3 line-clamp-2 leading-relaxed">
                          {q.questionbody}
                        </p>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                          <div className="flex flex-wrap gap-1.5">
                            {q.questiontags?.map((tag: string) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-[11px] bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>

                          <div className="flex items-center text-xs text-gray-500 gap-2">
                            <span className="text-[11px]">
                              asked {new Date(q.askedon).toLocaleDateString()}
                            </span>
                            <Link
                              href={`/users/${q.userid}`}
                              className="flex items-center gap-1 font-semibold text-gray-700 hover:text-orange-600"
                            >
                              <div className="w-5 h-5 rounded-full bg-orange-600 text-white font-bold flex items-center justify-center text-[10px]">
                                {q.userposted?.charAt(0).toUpperCase()}
                              </div>
                              <span>{q.userposted}</span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Mainlayout>
  );
}
