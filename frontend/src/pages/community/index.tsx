import React, { useState, useEffect } from "react";
import Mainlayout from "@/layout/Mainlayout";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/LanguageContext";
import axiosInstance from "@/lib/axiosinstance";
import { toast } from "react-toastify";
import {
  Heart,
  MessageCircle,
  Share2,
  Image as ImageIcon,
  Video,
  UserPlus,
  Users,
  AlertCircle,
  CheckCircle,
  Lock,
  Send,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

interface Comment {
  _id?: string;
  userName: string;
  commentText: string;
  createdAt: string;
}

interface Post {
  _id: string;
  author: {
    _id: string;
    name: string;
    email: string;
  };
  authorName: string;
  authorEmail: string;
  content: string;
  mediaType: "image" | "video" | "none";
  mediaUrl: string;
  likes: string[];
  comments: Comment[];
  shares: number;
  createdAt: string;
}

const CommunityFeedPage = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [friendsList, setFriendsList] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  // Post form state
  const [content, setContent] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video" | "none">("none");
  const [mediaUrl, setMediaUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active commenting post ID
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  const friendCount = friendsList.length;

  // Calculate posting status based on friends count
  const getPostingLimitInfo = () => {
    if (friendCount === 0) {
      return {
        allowed: false,
        limitText: "0 posts allowed per day",
        message: "You have 0 friends. Connect with friends to unlock posting!",
        badge: "Locked (0 Friends)",
        badgeColor: "bg-red-100 text-red-700 border-red-200",
      };
    }
    if (friendCount === 1) {
      return {
        allowed: true,
        limitText: "1 post per day",
        message: "1 Friend: You can post once per day.",
        badge: "Tier 1: 1 post/day",
        badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
      };
    }
    if (friendCount >= 2 && friendCount <= 10) {
      return {
        allowed: true,
        limitText: "Up to 2 posts per day",
        message: `${friendCount} Friends: You can post up to 2 times per day.`,
        badge: "Tier 2: 2 posts/day",
        badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
      };
    }
    return {
      allowed: true,
      limitText: "Unlimited posts per day",
      message: `${friendCount} Friends: You can post without restrictions!`,
      badge: "VIP: Unlimited",
      badgeColor: "bg-green-100 text-green-800 border-green-200",
    };
  };

  const limitInfo = getPostingLimitInfo();

  useEffect(() => {
    fetchPosts();
    fetchAllUsers();
    if (user?._id) {
      fetchUserFriends();
    }
  }, [user?._id]);

  const fetchPosts = async () => {
    try {
      const res = await axiosInstance.get("/post/all");
      setPosts(res.data.data || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserFriends = async () => {
    try {
      const res = await axiosInstance.get(`/user/${user._id}`);
      if (res.data.data) {
        setFriendsList(res.data.data.friends || []);
      }
    } catch (error) {
      console.error("Error fetching user friends:", error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await axiosInstance.get("/user/getalluser");
      setAllUsers(res.data.data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleAddFriend = async (friendId: string) => {
    if (!user) {
      toast.info("Please log in to add friends.");
      return;
    }
    try {
      const res = await axiosInstance.post("/user/friends/add", {
        userId: user._id,
        friendId,
      });
      toast.success(res.data.message || "Friend added!");
      fetchUserFriends();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add friend.");
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.info("Please log in to post.");
      return;
    }

    if (friendCount === 0) {
      toast.error("Users with no friends are not allowed to post. Add a friend to unlock posting!");
      return;
    }

    if (!content.trim() && !mediaUrl.trim()) {
      toast.warn("Please write something or provide a photo/video.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axiosInstance.post("/post/create", {
        authorId: user._id,
        content: content.trim(),
        mediaType,
        mediaUrl: mediaUrl.trim(),
      });

      toast.success("Post published to community space!");
      setContent("");
      setMediaType("none");
      setMediaUrl("");
      fetchPosts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to publish post.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) {
      toast.info("Please log in to like posts.");
      return;
    }
    try {
      const res = await axiosInstance.patch(`/post/like/${postId}`, {
        userId: user._id,
      });
      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? res.data.data : p))
      );
    } catch (error) {
      console.error("Like error:", error);
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!user) {
      toast.info("Please log in to comment.");
      return;
    }
    if (!commentText.trim()) return;

    try {
      const res = await axiosInstance.post(`/post/comment/${postId}`, {
        userId: user._id,
        userName: user.name,
        commentText: commentText.trim(),
      });
      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? res.data.data : p))
      );
      setCommentText("");
      toast.success("Comment added!");
    } catch (error) {
      toast.error("Failed to add comment.");
    }
  };

  const handleShare = async (postId: string) => {
    try {
      const res = await axiosInstance.patch(`/post/share/${postId}`);
      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? res.data.data : p))
      );
      if (typeof window !== "undefined") {
        navigator.clipboard.writeText(
          `${window.location.origin}/community#post-${postId}`
        );
      }
      toast.success("Post link copied to clipboard!");
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  return (
    <Mainlayout>
      <div className="max-w-6xl mx-auto py-2">
        {/* Top Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-orange-100 text-orange-600 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold text-gray-900">
                Public Social Space
              </h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Connect with fellow developers, share media, and interact with the community.
            </p>
          </div>

          {/* User's Social Posting Limit Card */}
          {user && (
            <div className="bg-white border rounded-xl p-3 shadow-sm flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-orange-50 text-orange-600">
                <Users className="w-5 h-5" />
              </div>
              <div className="text-left text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-800">
                    {friendCount} {friendCount === 1 ? "Friend" : "Friends"}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${limitInfo.badgeColor}`}
                  >
                    {limitInfo.badge}
                  </span>
                </div>
                <p className="text-gray-500 text-[11px] mt-0.5">
                  Limit: {limitInfo.limitText}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Rules Explainer Alert */}
        <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border border-orange-200 rounded-xl p-4 mb-6 text-xs text-orange-950">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Community Posting Rules:</strong>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mt-1.5 text-[11px]">
                <div className="bg-white/80 p-2 rounded-lg border border-orange-200/60">
                  <span className="text-red-600 font-bold block">0 Friends:</span> No posting permitted
                </div>
                <div className="bg-white/80 p-2 rounded-lg border border-orange-200/60">
                  <span className="text-amber-700 font-bold block">1 Friend:</span> 1 post per day
                </div>
                <div className="bg-white/80 p-2 rounded-lg border border-orange-200/60">
                  <span className="text-blue-700 font-bold block">2 Friends:</span> Up to 2 posts per day
                </div>
                <div className="bg-white/80 p-2 rounded-lg border border-orange-200/60">
                  <span className="text-green-700 font-bold block">&gt; 10 Friends:</span> Unlimited posting
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Feed Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Create Post Card */}
            {user ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-orange-600 text-white font-bold flex items-center justify-center text-sm">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{user.name}</h3>
                    <span className="text-[11px] text-gray-500">Share with the developer community</span>
                  </div>
                </div>

                <form onSubmit={handleCreatePost}>
                  <textarea
                    rows={3}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="What are you building or working on? Share code snippets, questions, or updates..."
                    className="w-full p-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none bg-gray-50/50"
                  />

                  {/* Media URL Input if activated */}
                  {mediaType !== "none" && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs">
                      <label className="block font-semibold text-gray-700 mb-1">
                        {mediaType === "image" ? "Photo URL (PNG, JPG, WebP)" : "Video URL (MP4, WebM)"}
                      </label>
                      <input
                        type="url"
                        value={mediaUrl}
                        onChange={(e) => setMediaUrl(e.target.value)}
                        placeholder={
                          mediaType === "image"
                            ? "https://images.unsplash.com/..."
                            : "https://www.w3schools.com/html/mov_bbb.mp4"
                        }
                        className="w-full px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 text-xs"
                      />
                      {mediaUrl && (
                        <div className="mt-2 max-h-48 overflow-hidden rounded border border-gray-200">
                          {mediaType === "image" ? (
                            <img src={mediaUrl} alt="Preview" className="w-full h-auto object-cover" />
                          ) : (
                            <video src={mediaUrl} controls className="w-full max-h-48" />
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setMediaType(mediaType === "image" ? "none" : "image")}
                        className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition ${
                          mediaType === "image"
                            ? "bg-orange-50 text-orange-700 border-orange-300 font-semibold"
                            : "text-gray-600 hover:bg-gray-50 border-gray-200"
                        }`}
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                        <span>Photo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMediaType(mediaType === "video" ? "none" : "video")}
                        className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition ${
                          mediaType === "video"
                            ? "bg-orange-50 text-orange-700 border-orange-300 font-semibold"
                            : "text-gray-600 hover:bg-gray-50 border-gray-200"
                        }`}
                      >
                        <Video className="w-3.5 h-3.5 text-red-500" />
                        <span>Video</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {friendCount === 0 && (
                        <span className="text-[11px] text-red-500 font-medium flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Connect 1 friend to post
                        </span>
                      )}
                      <button
                        type="submit"
                        disabled={isSubmitting || friendCount === 0}
                        className="px-4 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {isSubmitting ? "Posting..." : "Publish Post"}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-dashed border-gray-300 p-6 text-center">
                <p className="text-sm text-gray-600 mb-3">
                  Log in to interact and post photos and videos to the community.
                </p>
                <Link
                  href="/auth"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
                >
                  Log in to participate
                </Link>
              </div>
            )}

            {/* Posts List */}
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500 mx-auto"></div>
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white rounded-xl p-8 border border-gray-200 text-center text-gray-500">
                <Sparkles className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-700">No posts yet</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Be the first to connect with friends and share a post with the community!
                </p>
              </div>
            ) : (
              posts.map((post) => {
                const isLiked = user && post.likes?.some((uid) => String(uid) === String(user._id));

                return (
                  <div
                    key={post._id}
                    id={`post-${post._id}`}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                  >
                    {/* Post Author Header */}
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                          {post.authorName?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 leading-tight">
                            {post.authorName}
                          </h4>
                          <span className="text-[11px] text-gray-400">
                            {new Date(post.createdAt).toLocaleDateString()} at{" "}
                            {new Date(post.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Post Content */}
                    {post.content && (
                      <div className="px-4 pb-3 text-sm text-gray-800 leading-relaxed whitespace-pre-line">
                        {post.content}
                      </div>
                    )}

                    {/* Post Media (Photo / Video) */}
                    {post.mediaType === "image" && post.mediaUrl && (
                      <div className="bg-gray-100 max-h-[480px] overflow-hidden flex items-center justify-center">
                        <img
                          src={post.mediaUrl}
                          alt="Post media"
                          className="w-full h-auto max-h-[480px] object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      </div>
                    )}

                    {post.mediaType === "video" && post.mediaUrl && (
                      <div className="bg-black max-h-[480px] flex items-center justify-center">
                        <video
                          src={post.mediaUrl}
                          controls
                          className="w-full max-h-[480px]"
                        />
                      </div>
                    )}

                    {/* Post Actions Bar */}
                    <div className="p-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleLike(post._id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition ${
                            isLiked
                              ? "text-red-600 bg-red-50 font-semibold"
                              : "hover:bg-gray-100 text-gray-600"
                          }`}
                        >
                          <Heart
                            className={`w-4 h-4 ${isLiked ? "fill-red-600" : ""}`}
                          />
                          <span>{post.likes?.length || 0} Likes</span>
                        </button>

                        <button
                          onClick={() =>
                            setActiveCommentPostId(
                              activeCommentPostId === post._id ? null : post._id
                            )
                          }
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-gray-100 text-gray-600 transition"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>{post.comments?.length || 0} Comments</span>
                        </button>
                      </div>

                      <button
                        onClick={() => handleShare(post._id)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-gray-100 text-gray-600 transition"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>{post.shares || 0} Shares</span>
                      </button>
                    </div>

                    {/* Comments Section */}
                    {activeCommentPostId === post._id && (
                      <div className="bg-gray-50/70 p-4 border-t border-gray-100 animate-in fade-in duration-150">
                        <div className="space-y-2 mb-3 max-h-56 overflow-y-auto">
                          {post.comments && post.comments.length > 0 ? (
                            post.comments.map((comm, idx) => (
                              <div
                                key={idx}
                                className="bg-white p-2.5 rounded-lg border border-gray-100 text-xs shadow-2xl shadow-gray-100"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-semibold text-gray-800">
                                    {comm.userName}
                                  </span>
                                  <span className="text-[10px] text-gray-400">
                                    {new Date(comm.createdAt).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                                <p className="text-gray-700">{comm.commentText}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-gray-400 text-center py-2">
                              No comments yet. Start the conversation!
                            </p>
                          )}
                        </div>

                        {user && (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              placeholder="Write a comment..."
                              className="flex-grow px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleAddComment(post._id);
                              }}
                            />
                            <button
                              onClick={() => handleAddComment(post._id)}
                              className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-xs font-semibold hover:bg-orange-700 transition"
                            >
                              Reply
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Friends & Connections */}
          <div className="space-y-6">
            {/* Friends Status Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-orange-600" />
                  <h3 className="font-bold text-sm text-gray-900">Your Friends</h3>
                </div>
                <span className="text-xs font-bold bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                  {friendCount}
                </span>
              </div>

              {friendsList.length === 0 ? (
                <div className="text-center py-3 text-xs text-gray-500">
                  <p>You haven't connected with any friends yet.</p>
                  <p className="text-[11px] text-orange-600 font-medium mt-1">
                    Connect with friends below to unlock community posting!
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {friendsList.map((fr: any) => (
                    <div
                      key={fr._id || fr}
                      className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-orange-600 text-white font-bold flex items-center justify-center text-[10px]">
                          {fr.name?.charAt(0) || "F"}
                        </div>
                        <span className="font-medium text-gray-800">
                          {fr.name || "Connected Friend"}
                        </span>
                      </div>
                      <span className="text-[10px] text-green-700 font-semibold flex items-center gap-0.5">
                        <CheckCircle className="w-3 h-3" /> Friend
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Connect with Community Members */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                <UserPlus className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-gray-900">
                  Connect & Build Friends
                </h3>
              </div>
              <p className="text-[11px] text-gray-500 mb-3">
                Build meaningful connections to increase your daily posting limit.
              </p>

              <div className="space-y-2.5 max-h-72 overflow-y-auto">
                {allUsers
                  .filter((u) => u._id !== user?._id)
                  .map((otherUser) => {
                    const isAlreadyFriend = friendsList.some(
                      (f: any) => (f._id || f) === otherUser._id
                    );

                    return (
                      <div
                        key={otherUser._id}
                        className="flex items-center justify-between p-2 rounded-lg border border-gray-100 hover:bg-gray-50 transition"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                            {otherUser.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="text-left">
                            <span className="font-semibold text-xs text-gray-900 block leading-tight">
                              {otherUser.name}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              🪙 {otherUser.points ?? 0} pts
                            </span>
                          </div>
                        </div>

                        {isAlreadyFriend ? (
                          <span className="text-[11px] font-semibold text-green-600 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Added
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAddFriend(otherUser._id)}
                            className="px-2.5 py-1 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                          >
                            <UserPlus className="w-3 h-3" /> Connect
                          </button>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Mainlayout>
  );
};

export default CommunityFeedPage;
