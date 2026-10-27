import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/LanguageContext";
import { Globe, Menu, Search, Sparkles, Users, Crown } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { LanguageCode } from "@/lib/translations";

const Navbar = ({ handleslidein }: any) => {
  const { user, Logout } = useAuth();
  const { language, supportedLanguages, initiateLanguageSwitch, t } =
    useLanguage();
  const [hasMounted, setHasMounted] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHasMounted(true);
    const handleClickOutside = (event: MouseEvent) => {
      if (
        langMenuRef.current &&
        !langMenuRef.current.contains(event.target as Node)
      ) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentLangInfo =
    supportedLanguages.find((l) => l.code === language) || supportedLanguages[0];

  const handleSelectLang = (code: LanguageCode) => {
    setIsLangMenuOpen(false);
    initiateLanguageSwitch(code);
  };

  return (
    <div className="sticky top-0 z-40 w-full min-h-[56px] bg-white border-t-[3px] border-[#ef8236] shadow-sm flex items-center justify-center">
      <div className="w-[94%] max-w-[1440px] flex items-center justify-between mx-auto py-1.5 gap-2">
        <button
          aria-label="Toggle sidebar"
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
          onClick={handleslidein}
        >
          <Menu className="w-5 h-5 text-gray-800" />
        </button>

        <div className="flex items-center gap-3 flex-grow">
          <Link href="/" className="flex items-center gap-1.5 px-2 py-1">
            <span className="text-2xl">🥞</span>
            <span className="font-bold text-lg tracking-tight hidden sm:inline text-gray-900">
              stack<span className="text-[#ef8236]">overflow</span>
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-1 text-xs font-medium text-gray-600">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-full hover:bg-gray-100 transition"
            >
              {t("home", "Home")}
            </Link>
            <Link
              href="/community"
              className="px-3 py-1.5 rounded-full hover:bg-orange-50 hover:text-orange-700 transition flex items-center gap-1.5 font-semibold text-orange-600"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {t("community", "Community Feed")}
            </Link>
            <Link
              href="/subscription"
              className="px-3 py-1.5 rounded-full hover:bg-amber-50 hover:text-amber-800 transition flex items-center gap-1.5 text-amber-700 font-semibold"
            >
              <Crown className="w-3.5 h-3.5" />
              {t("subscription", "Plans & Pricing")}
            </Link>
          </div>

          <form className="hidden sm:block flex-grow relative max-w-[500px]">
            <input
              type="text"
              placeholder={t("searchPlaceholder", "Search...")}
              className="w-full pl-9 pr-4 py-1.5 text-sm bg-gray-50 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </form>
        </div>

        <div className="flex items-center gap-2">
          {/* Multi-language Selector */}
          <div className="relative" ref={langMenuRef}>
            <button
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition"
              title="Change Language"
            >
              <Globe className="w-3.5 h-3.5 text-orange-600" />
              <span className="hidden sm:inline">{currentLangInfo.flag}</span>
              <span className="font-semibold">{currentLangInfo.name}</span>
            </button>

            {isLangMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in duration-150">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  Select Language
                </div>
                {supportedLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleSelectLang(lang.code)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-orange-50 transition ${
                      language === lang.code
                        ? "bg-orange-50 font-bold text-orange-700"
                        : "text-gray-700"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base">{lang.flag}</span>
                      <span>{lang.name}</span>
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {lang.nativeName}
                    </span>
                  </button>
                ))}
                <div className="mt-1 pt-1.5 border-t border-gray-100 px-3 py-1 text-[10px] text-gray-400">
                  Switching to French requires Email OTP. Other languages require Mobile OTP.
                </div>
              </div>
            )}
          </div>

          {!hasMounted ? null : !user ? (
            <div className="flex items-center gap-1.5">
              <Link
                href="/auth"
                className="text-xs font-semibold text-gray-700 bg-[#e7f8fe] hover:bg-[#d3e4eb] border border-blue-400 px-3 py-1.5 rounded-lg transition"
              >
                {t("login", "Log in")}
              </Link>
              <Link
                href="/signup"
                className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition hidden sm:inline"
              >
                {t("signup", "Sign up")}
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href={`/users/${user._id}`}
                className="flex items-center gap-1.5 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-2.5 py-1 rounded-full transition group"
              >
                <div className="flex items-center justify-center bg-orange-600 text-white text-xs font-bold w-6 h-6 rounded-full">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold text-gray-800 leading-tight">
                    {user.name?.split(" ")[0]}
                  </span>
                  <span className="text-[10px] text-orange-600 font-bold leading-none">
                    🪙 {user.points ?? 15} pts
                  </span>
                </div>
              </Link>

              <button
                onClick={Logout}
                className="text-xs font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 border border-gray-200 px-2.5 py-1.5 rounded-lg transition"
              >
                {t("logout", "Log out")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
