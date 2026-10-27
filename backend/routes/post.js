import express from "express";
import {
  createPost,
  getAllPosts,
  toggleLike,
  addComment,
  sharePost,
} from "../controller/post.js";

const router = express.Router();

router.post("/create", createPost);
router.get("/all", getAllPosts);
router.patch("/like/:id", toggleLike);
router.post("/comment/:id", addComment);
router.patch("/share/:id", sharePost);

export default router;
