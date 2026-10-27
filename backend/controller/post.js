import mongoose from "mongoose";
import postModel from "../models/post.js";
import userModel from "../models/auth.js";

export const createPost = async (req, res) => {
  const { authorId, content, mediaType, mediaUrl } = req.body;

  if (!authorId || !mongoose.Types.ObjectId.isValid(authorId)) {
    return res.status(400).json({ message: "Valid author ID is required." });
  }

  try {
    const user = await userModel.findById(authorId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const friendCount = user.friends ? user.friends.length : 0;

    // REQUIREMENT: Posting limits based on number of friends
    // 1. Users with no friends: NOT allowed to post on public page
    if (friendCount === 0) {
      return res.status(403).json({
        message:
          "Users with no friends are not allowed to post on the public page. Connect with friends to start posting!",
        error: "NO_FRIENDS",
        friendCount: 0,
      });
    }

    // 2. Daily Limit calculation
    let maxPostsPerDay = 1; // 1 friend -> 1 post/day
    if (friendCount >= 2 && friendCount <= 10) {
      maxPostsPerDay = 2; // 2 friends -> up to 2 times/day
    } else if (friendCount > 10) {
      maxPostsPerDay = Infinity; // > 10 friends -> unrestricted
    }

    // Count user's posts today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const postsToday = await postModel.countDocuments({
      author: user._id,
      createdAt: { $gte: startOfToday },
    });

    if (postsToday >= maxPostsPerDay) {
      return res.status(403).json({
        message: `Posting limit reached! With ${friendCount} friend(s), you can post ${maxPostsPerDay} time(s) per day. Add more than 10 friends to post without restrictions.`,
        error: "DAILY_LIMIT_REACHED",
        friendCount,
        postsToday,
        maxPostsPerDay,
      });
    }

    const newPost = await postModel.create({
      author: user._id,
      authorName: user.name,
      authorEmail: user.email,
      content: content || "",
      mediaType: mediaType || "none",
      mediaUrl: mediaUrl || "",
    });

    res.status(201).json({ data: newPost, message: "Post created successfully!" });
  } catch (error) {
    console.error("createPost error:", error);
    res.status(500).json({ message: "Failed to create post." });
  }
};

export const getAllPosts = async (req, res) => {
  try {
    const posts = await postModel
      .find()
      .sort({ createdAt: -1 })
      .populate("author", "name email");
    res.status(200).json({ data: posts });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch posts." });
  }
};

export const toggleLike = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid post or user ID." });
  }

  try {
    const post = await postModel.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    const alreadyLiked = post.likes.some((uid) => uid.toString() === userId.toString());
    if (alreadyLiked) {
      post.likes = post.likes.filter((uid) => uid.toString() !== userId.toString());
    } else {
      post.likes.push(userId);
    }

    await post.save();
    res.status(200).json({ data: post });
  } catch (error) {
    res.status(500).json({ message: "Failed to update like." });
  }
};

export const addComment = async (req, res) => {
  const { id } = req.params;
  const { userId, userName, commentText } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id) || !commentText?.trim()) {
    return res.status(400).json({ message: "Post ID and comment text are required." });
  }

  try {
    const post = await postModel.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    post.comments.push({
      user: userId,
      userName: userName || "Anonymous User",
      commentText: commentText.trim(),
      createdAt: new Date(),
    });

    await post.save();
    res.status(200).json({ data: post });
  } catch (error) {
    res.status(500).json({ message: "Failed to add comment." });
  }
};

export const sharePost = async (req, res) => {
  const { id } = req.params;
  try {
    const post = await postModel.findByIdAndUpdate(
      id,
      { $inc: { shares: 1 } },
      { new: true }
    );
    res.status(200).json({ data: post, message: "Post shared successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Failed to share post." });
  }
};
