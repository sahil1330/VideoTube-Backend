import { Router } from "express";
import {
  getLikedVideos,
  toggleTweetLike,
  toggleVideoLike,
} from "../controllers/like.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT);
router.route("/:videoId").post(toggleVideoLike);
router.route("/:commentId").post(toggleVideoLike);
router.route("/:tweetId").post(toggleTweetLike);
router.route("/").get(getLikedVideos);

export default router;
