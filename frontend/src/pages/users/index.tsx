import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import Mainlayout from "@/layout/Mainlayout";
import axiosInstance from "@/lib/axiosinstance";
import { Calendar, Search, Coins, Crown } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";

const UsersDirectoryPage = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axiosInstance.get("/user/getalluser");
        setUsers(res.data.data || []);
      } catch (error) {
        console.error("Fetch users error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((u) =>
    u.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Mainlayout>
      <div className="max-w-6xl mx-auto py-2">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Users Directory</h1>
        <p className="text-xs text-gray-500 mb-6">
          Connect with developers and view community contributors
        </p>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Filter by user name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500 mx-auto"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-500 text-xs">
            No users found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredUsers.map((user) => (
              <Link key={user._id} href={`/users/${user._id}`}>
                <div className="border border-gray-200 bg-white rounded-2xl p-4 hover:shadow-md transition cursor-pointer">
                  <div className="flex items-center mb-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white font-bold flex items-center justify-center text-sm mr-3">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 hover:text-orange-600 truncate text-sm">
                        {user.name}
                      </h3>
                      <span className="text-[10px] text-gray-400 block truncate">
                        {user.email}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100">
                    <span className="font-bold text-orange-600 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5 text-amber-500" />
                      {user.points ?? 0} pts
                    </span>
                    <span className="text-[10px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      <Crown className="w-2.5 h-2.5 text-amber-600" />
                      {user.subscription?.plan || "Free"}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Mainlayout>
  );
};

export default UsersDirectoryPage;
