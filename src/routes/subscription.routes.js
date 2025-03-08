import { Router } from "express";
import {
  toggleSubscription,
  getUserChannelSubscribers,
  getSubscribedChannels,
  getUserChannelSubscribersCount
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT);
router.route("/toggle/:channelId").post(toggleSubscription);
router.route("/subscribers/:channelId").get(getUserChannelSubscribers);
router.route("/subscribers-count/:channelId").get(getUserChannelSubscribersCount);
router.route("/channels/:subscriberId").get(getSubscribedChannels);

export default router;
