import React from "react";
import Mainlayout from "@/layout/Mainlayout";
import Link from "next/link";
import { Tag } from "lucide-react";

const POPULAR_TAGS = [
  { name: "javascript", count: 1420, desc: "For questions about ECMAScript or modern JS engines." },
  { name: "python", count: 980, desc: "For questions about Python programming language." },
  { name: "react", count: 850, desc: "For questions about React.js UI library." },
  { name: "node.js", count: 640, desc: "For server-side JavaScript applications." },
  { name: "mongodb", count: 420, desc: "For questions regarding MongoDB NoSQL database." },
  { name: "typescript", count: 510, desc: "For statically typed JavaScript superset questions." },
  { name: "next.js", count: 390, desc: "For full-stack React framework questions." },
  { name: "tailwind", count: 310, desc: "For utility-first CSS styling." },
];

export default function TagsPage() {
  return (
    <Mainlayout>
      <div className="max-w-6xl mx-auto py-2">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Tags</h1>
        <p className="text-xs text-gray-500 mb-6">
          A tag is a keyword or label that categorizes your question with other, similar questions.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {POPULAR_TAGS.map((tag) => (
            <div
              key={tag.name}
              className="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-semibold text-xs rounded-lg border border-blue-200">
                  {tag.name}
                </span>
                <span className="text-[11px] text-gray-400 font-mono">
                  {tag.count} questions
                </span>
              </div>
              <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                {tag.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Mainlayout>
  );
}
