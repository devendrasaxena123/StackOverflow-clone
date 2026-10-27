import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Mainlayout from "@/layout/Mainlayout";
import { useAuth } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { toast } from "react-toastify";
import {
  Calendar,
  Coins,
  History,
  Shield,
  Send,
  Users,
  Receipt,
  Crown,
  Laptop,
  Smartphone,
  Globe,
  Edit,
  Plus,
  X,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

const UserProfilePage = () => {
  const { user: authUser } = useAuth();
  const router = useRouter();
  const { id } = router.query;

  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "points" | "logins" | "invoices" | "friends"
  >("overview");

  // Profile Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    about: "",
    phone: "",
    tags: [] as string[],
  });
  const [newTag, setNewTag] = useState("");

  // Points Transfer state
  const [allUsersList, setAllUsersList] = useState<any[]>([]);
  const [transferRecipient, setTransferRecipient] = useState("");
  const [transferAmount, setTransferAmount] = useState<number | "">("");
  const [isTransferring, setIsTransferring] = useState(false);

  useEffect(() => {
    if (id) {
      fetchUserData();
      fetchAllUsers();
    }
  }, [id]);

  const fetchUserData = async () => {
    try {
      const res = await axiosInstance.get(`/user/${id}`);
      const data = res.data.data;
      setUserData(data);
      setEditForm({
        name: data.name || "",
        about: data.about || "",
        phone: data.phone || "",
        tags: data.tags || [],
      });
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await axiosInstance.get("/user/getalluser");
      setAllUsersList(res.data.data || []);
    } catch (error) {
      console.error("Error fetching all users:", error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const res = await axiosInstance.patch(`/user/update/${id}`, {
        editForm,
      });
      if (res.data.data) {
        setUserData(res.data.data);
        setIsEditing(false);
        toast.success("Profile updated successfully!");
      }
    } catch (error) {
      toast.error("Failed to update profile.");
    }
  };

  const handleTransferPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) {
      toast.info("Please log in to transfer points.");
      return;
    }

    const currentPoints = userData?.points ?? 0;

    // REQUIREMENT: Point transfers will ONLY be allowed if the user has MORE THAN 10 points!
    // Users with 10 points or fewer will NOT be able to transfer points.
    if (currentPoints <= 10) {
      toast.error(
        "Point transfers are only allowed if you have more than 10 points. Users with 10 points or fewer cannot transfer points."
      );
      return;
    }

    const amount = Number(transferAmount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount of points to transfer.");
      return;
    }

    if (amount > currentPoints) {
      toast.error(`You cannot transfer more points than your balance (${currentPoints} pts).`);
      return;
    }

    if (!transferRecipient.trim()) {
      toast.error("Please select or enter a recipient user.");
      return;
    }

    setIsTransferring(true);
    try {
      const res = await axiosInstance.post("/user/transfer-points", {
        senderId: authUser._id,
        recipientEmailOrId: transferRecipient.trim(),
        amount,
      });

      toast.success(res.data.message || "Points transferred successfully!");
      setTransferAmount("");
      setTransferRecipient("");
      fetchUserData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to transfer points.");
    } finally {
      setIsTransferring(false);
    }
  };

  if (loading) {
    return (
      <Mainlayout>
        <div className="py-20 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-xs text-gray-500 mt-3">Loading profile...</p>
        </div>
      </Mainlayout>
    );
  }

  if (!userData) {
    return (
      <Mainlayout>
        <div className="text-center py-20 text-gray-500 text-sm">
          User profile not found.
        </div>
      </Mainlayout>
    );
  }

  const isOwner = authUser?._id === userData._id;
  const userPoints = userData.points ?? 0;
  const canTransfer = userPoints > 10;

  return (
    <Mainlayout>
      <div className="max-w-5xl mx-auto py-2">
        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white font-black text-3xl flex items-center justify-center shadow-md">
                {userData.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                    {userData.name}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-600" />
                    {userData.subscription?.plan || "Free"} Plan
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{userData.email}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    Joined {new Date(userData.joinDate).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1 font-bold text-orange-600">
                    <Coins className="w-3.5 h-3.5" />
                    {userPoints} Reward Points
                  </span>
                  <span className="flex items-center gap-1 text-blue-600 font-semibold">
                    <Users className="w-3.5 h-3.5" />
                    {userData.friends?.length || 0} Friends
                  </span>
                </div>
              </div>
            </div>

            {isOwner && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="self-start sm:self-auto px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
              >
                <Edit className="w-3.5 h-3.5" />
                {isEditing ? "Cancel Edit" : "Edit Profile"}
              </button>
            )}
          </div>

          {/* Edit Profile Form */}
          {isEditing && (
            <div className="mt-6 pt-6 border-t border-gray-100 space-y-4 animate-in fade-in">
              <h3 className="font-bold text-sm text-gray-900">Edit Profile Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Phone Number (for SMS OTP verification)
                  </label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="9876543210"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">About Me</label>
                <textarea
                  rows={3}
                  value={editForm.about}
                  onChange={(e) => setEditForm({ ...editForm, about: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <button
                onClick={handleSaveProfile}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                Save Changes
              </button>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6 gap-2 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-2.5 px-4 rounded-t-xl transition ${
              activeTab === "overview"
                ? "bg-white text-orange-600 border-b-2 border-orange-600 shadow-2xs"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("points")}
            className={`py-2.5 px-4 rounded-t-xl transition flex items-center gap-1.5 ${
              activeTab === "points"
                ? "bg-white text-orange-600 border-b-2 border-orange-600 shadow-2xs"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            Reward Points ({userPoints})
          </button>
          <button
            onClick={() => setActiveTab("logins")}
            className={`py-2.5 px-4 rounded-t-xl transition flex items-center gap-1.5 ${
              activeTab === "logins"
                ? "bg-white text-orange-600 border-b-2 border-orange-600 shadow-2xs"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-blue-500" />
            Login History ({userData.loginHistory?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("invoices")}
            className={`py-2.5 px-4 rounded-t-xl transition flex items-center gap-1.5 ${
              activeTab === "invoices"
                ? "bg-white text-orange-600 border-b-2 border-orange-600 shadow-2xs"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <Receipt className="w-3.5 h-3.5 text-green-500" />
            Invoices ({userData.invoices?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("friends")}
            className={`py-2.5 px-4 rounded-t-xl transition flex items-center gap-1.5 ${
              activeTab === "friends"
                ? "bg-white text-orange-600 border-b-2 border-orange-600 shadow-2xs"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <Users className="w-3.5 h-3.5 text-purple-500" />
            Friends ({userData.friends?.length || 0})
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
              <h3 className="font-bold text-sm text-gray-900 mb-3">About</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                {userData.about || "No bio added yet."}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
              <h3 className="font-bold text-sm text-gray-900 mb-3">Tags & Expertise</h3>
              <div className="flex flex-wrap gap-2">
                {userData.tags && userData.tags.length > 0 ? (
                  userData.tags.map((tag: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs bg-gray-100 text-gray-700 font-medium"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400">No tags listed.</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: REWARD POINTS & TRANSFER */}
        {activeTab === "points" && (
          <div className="space-y-6">
            {/* Points Summary Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-md">
                <span className="text-xs font-semibold text-white/80 uppercase tracking-wider block">
                  Total Points Balance
                </span>
                <div className="flex items-center gap-2 mt-2">
                  <Coins className="w-8 h-8 text-amber-200" />
                  <span className="text-4xl font-black">{userPoints}</span>
                </div>
                <span className="text-[11px] text-white/90 mt-2 block">
                  {canTransfer ? "Eligible for point transfers (> 10 pts)" : "Transfer locked (Requires > 10 pts)"}
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs col-span-2">
                <h4 className="font-bold text-xs text-gray-800 uppercase tracking-wider mb-2">
                  How Points Work:
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">+5</span>
                    <span>For answering questions</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">+5</span>
                    <span>Bonus when answer hits 5 upvotes</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">-5</span>
                    <span>If answer is removed</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">-1</span>
                    <span>If answer is downvoted</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Transfer Points Module (Allowed only if owner & points > 10) */}
            {isOwner && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  <Send className="w-5 h-5 text-orange-600" />
                  <h3 className="font-bold text-base text-gray-900">
                    Transfer Points to Another User
                  </h3>
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  Reward a peer for good help or transfer points to any community member.
                </p>

                {/* REQUIREMENT: Transfer condition check */}
                {!canTransfer ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">Point Transfer Restricted:</strong>
                      <p className="mt-0.5">
                        Point transfers will only be allowed if you have <strong>more than 10 points</strong>. Users with 10 points or fewer cannot transfer points. Your current balance is <strong>{userPoints} points</strong>.
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleTransferPoints} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Search / Select User
                        </label>
                        <select
                          value={transferRecipient}
                          onChange={(e) => setTransferRecipient(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-orange-500 focus:outline-none bg-white"
                          required
                        >
                          <option value="">-- Choose User --</option>
                          {allUsersList
                            .filter((u) => u._id !== authUser?._id)
                            .map((u) => (
                              <option key={u._id} value={u.email}>
                                {u.name} ({u.email}) - {u.points ?? 0} pts
                              </option>
                            ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Points to Transfer (Max: {userPoints})
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={userPoints}
                          value={transferAmount}
                          onChange={(e) => setTransferAmount(Number(e.target.value))}
                          placeholder="e.g. 5"
                          className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-orange-500 focus:outline-none"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isTransferring}
                      className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {isTransferring ? "Transferring..." : "Transfer Points"}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Points History */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
              <h3 className="font-bold text-sm text-gray-900 mb-4">
                Points Activity History
              </h3>
              {userData.pointsHistory && userData.pointsHistory.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {userData.pointsHistory.map((item: any, idx: number) => (
                    <div key={idx} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-gray-800 block">
                          {item.description || item.type}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(item.date).toLocaleString()}
                        </span>
                      </div>
                      <span
                        className={`font-mono font-bold text-sm ${
                          item.amount > 0 ? "text-green-600" : "text-red-500"
                        }`}
                      >
                        {item.amount > 0 ? `+${item.amount}` : item.amount} pts
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 text-center py-4">
                  No points activity recorded yet.
                </p>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: LOGIN HISTORY */}
        {activeTab === "logins" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-base text-gray-900">
                  Detailed Login History
                </h3>
                <p className="text-xs text-gray-500">
                  Records of your login environment: Browser type, OS, Device, and IP.
                </p>
              </div>
              <Shield className="w-5 h-5 text-blue-600" />
            </div>

            {userData.loginHistory && userData.loginHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-100 pb-2">
                      <th className="py-2">Browser</th>
                      <th className="py-2">Operating System</th>
                      <th className="py-2">Device Type</th>
                      <th className="py-2">IP Address</th>
                      <th className="py-2">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {userData.loginHistory.map((log: any, idx: number) => {
                      const isMobile =
                        log.deviceType?.toLowerCase().includes("mobile") ||
                        log.os?.toLowerCase().includes("android") ||
                        log.os?.toLowerCase().includes("ios");

                      return (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="py-3 font-semibold text-gray-800 flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-blue-500" />
                            {log.browser || "Chrome"}
                          </td>
                          <td className="py-3 text-gray-600">{log.os || "Windows"}</td>
                          <td className="py-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                                isMobile
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {isMobile ? (
                                <Smartphone className="w-3 h-3" />
                              ) : (
                                <Laptop className="w-3 h-3" />
                              )}
                              {log.deviceType || "Desktop/Laptop"}
                            </span>
                          </td>
                          <td className="py-3 font-mono text-gray-600">
                            {log.ip || "127.0.0.1"}
                          </td>
                          <td className="py-3 text-gray-500">
                            {new Date(log.loginAt).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-6">
                No login history available yet.
              </p>
            )}
          </div>
        )}

        {/* TAB 4: INVOICES */}
        {activeTab === "invoices" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
            <h3 className="font-bold text-base text-gray-900 mb-4">
              Subscription Invoices
            </h3>
            {userData.invoices && userData.invoices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-100 pb-2">
                      <th className="py-2">Invoice #</th>
                      <th className="py-2">Plan</th>
                      <th className="py-2">Amount</th>
                      <th className="py-2">Date</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {userData.invoices.map((inv: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="py-3 font-mono font-bold">{inv.invoiceNumber}</td>
                        <td className="py-3 font-semibold text-orange-600">{inv.plan} Plan</td>
                        <td className="py-3 font-bold">₹{inv.amount}</td>
                        <td className="py-3 text-gray-500">
                          {new Date(inv.date).toLocaleDateString()}
                        </td>
                        <td className="py-3">
                          <span className="bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded text-[10px]">
                            {inv.status || "PAID"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-6">
                No invoices found on file.
              </p>
            )}
          </div>
        )}

        {/* TAB 5: FRIENDS */}
        {activeTab === "friends" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
            <h3 className="font-bold text-base text-gray-900 mb-4">
              Connected Friends ({userData.friends?.length || 0})
            </h3>
            {userData.friends && userData.friends.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {userData.friends.map((friend: any) => (
                  <div
                    key={friend._id || friend}
                    className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-orange-600 text-white font-bold flex items-center justify-center text-xs">
                      {friend.name?.charAt(0) || "F"}
                    </div>
                    <div>
                      <span className="font-semibold text-xs text-gray-900 block leading-tight">
                        {friend.name || "Friend"}
                      </span>
                      <span className="text-[10px] text-gray-400">{friend.email}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-6">
                No friends connected yet. Visit the Community Feed to connect with friends!
              </p>
            )}
          </div>
        )}
      </div>
    </Mainlayout>
  );
};

export default UserProfilePage;
