import Router from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createTweet } from "../controllers/tweet.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/").post(
  upload.fields([
    {
      name: "tweetImage",
      maxCount: 5,
    },
  ]),
  createTweet
);

export default router;
