import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    authorName: { type: String, required: true },
    authorEmail: { type: String },
    content: { type: String, default: "" },
    mediaType: {
      type: String,
      enum: ["image", "video", "none"],
      default: "none",
    },
    mediaUrl: { type: String, default: "" },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
        userName: { type: String, required: true },
        commentText: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    shares: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("post", postSchema);
