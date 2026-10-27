import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Mainlayout from "@/layout/Mainlayout";
import axiosInstance from "@/lib/axiosinstance";
import { useLanguage } from "@/lib/LanguageContext";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Plus, Search, Filter } from "lucide-react";

export default function QuestionsIndex() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
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

  const filteredQuestions = questions.filter(
    (q) =>
      q.questiontitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.questionbody?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.questiontags?.some((t: string) =>
        t.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  return (
    <Mainlayout>
      <div className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b border-gray-100 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t("allQuestions", "All Questions")}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Search and explore questions across all topics
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

        {/* Filter & Search Bar */}
        <div className="mb-6 flex gap-3">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Filter by keyword or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500 mx-auto"></div>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-500 text-xs">
            No questions match your search. Try different keywords.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl bg-white shadow-2xs overflow-hidden">
            {filteredQuestions.map((q: any) => {
              const votes = (q.upvote?.length || 0) - (q.downvote?.length || 0);
              const answersCount = q.answer?.length || q.noofanswer || 0;

              return (
                <div key={q._id} className="p-4 sm:p-5 hover:bg-gray-50/50 transition">
                  <div className="flex flex-col sm:flex-row gap-4">
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
        )}
      </div>
    </Mainlayout>
  );
}
