import Router from "express";
import { upload } from "../middlewares/multer.middleware";
import { verifyJWT } from "../middlewares/auth.middleware";
import { createTweet } from "../controllers/tweet.controller";

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
