import { Router } from "express";
import {
  getLikedVideos,
  toggleTweetLike,
  toggleCommentLike,
  toggleVideoLike,
  getVideoLikes,
  getTweetLikesCount,
  getCommentLikesCount,
} from "../controllers/like.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT);
router.route("/toggle-video-like/:videoId").post(toggleVideoLike);
router.route("/toggle-comment-like/:commentId").post(toggleCommentLike);
router.route("/toggle-tweet-like/:tweetId").post(toggleTweetLike);
router.route("/").get(getLikedVideos);
router.route("/get-video-likes/:videoId").get(getVideoLikes);
router.route("/get-tweet-likes/:tweetId").get(getTweetLikesCount);
router.route("/get-comment-likes/:commentId").get(getCommentLikesCount);

export default router;
