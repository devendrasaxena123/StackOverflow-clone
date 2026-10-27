import { cn } from "@/lib/utils";
import {
  Bookmark,
  Crown,
  Home,
  MessageSquareIcon,
  Sparkles,
  Tag,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";
import React from "react";
import { Badge } from "./ui/badge";
import { useLanguage } from "@/lib/LanguageContext";
import { useRouter } from "next/router";

const Sidebar = ({ isopen }: any) => {
  const { t } = useLanguage();
  const router = useRouter();

  const navItems = [
    {
      href: "/",
      label: t("home", "Home"),
      icon: Home,
      exact: true,
    },
    {
      href: "/questions",
      label: t("questions", "Questions"),
      icon: MessageSquareIcon,
    },
    {
      href: "/community",
      label: t("community", "Community Feed"),
      icon: Sparkles,
      badge: "Social",
      badgeColor: "bg-orange-100 text-orange-700",
    },
    {
      href: "/subscription",
      label: t("subscription", "Subscription Plans"),
      icon: Crown,
      badge: "Upgrade",
      badgeColor: "bg-amber-100 text-amber-800",
    },
    {
      href: "/users",
      label: t("users", "Users"),
      icon: Users,
    },
    {
      href: "/tags",
      label: t("tags", "Tags"),
      icon: Tag,
    },
  ];

  return (
    <div>
      <aside
        className={cn(
          "top-[56px] w-52 lg:w-64 min-h-[calc(100vh-56px)] bg-white border-r border-gray-200 transition-transform duration-200 ease-in-out md:translate-x-0",
          isopen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <nav className="p-3">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? router.pathname === item.href
                : router.pathname.startsWith(item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition",
                      isActive
                        ? "bg-orange-50 text-orange-700 font-semibold border-r-4 border-orange-500"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4 mr-3",
                        isActive ? "text-orange-600" : "text-gray-500"
                      )}
                    />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span
                        className={cn(
                          "ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider",
                          item.badgeColor
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-8 pt-4 border-t border-gray-100 px-3">
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-3.5 border border-orange-100">
              <div className="flex items-center gap-2 text-xs font-bold text-orange-800 mb-1">
                <Trophy className="w-4 h-4 text-orange-600" />
                <span>Reward System</span>
              </div>
              <p className="text-[11px] text-gray-600 leading-snug">
                Earn 5 pts per answer, +5 pts bonus at 5 upvotes! Transfer points when above 10 pts.
              </p>
            </div>
          </div>
        </nav>
      </aside>
    </div>
  );
};

export default Sidebar;
