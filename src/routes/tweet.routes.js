import Router from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createTweet,
  deleteTweet,
  getUserTweets,
  updateTweet,
} from "../controllers/tweet.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/").post(upload.single("tweetImage"), createTweet);

router.route("/user/:userId").get(getUserTweets);
router
  .route("/:tweetId")
  .patch(upload.single("tweetImage"), updateTweet)
  .delete(deleteTweet);

export default router;
