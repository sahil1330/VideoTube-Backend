import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const subscriberId = req.user?._id;
  console.log(subscriberId.toString(), channelId);
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid Channel Id");
  }

  if (subscriberId.toString() === channelId) {
    throw new ApiError(400, "You cannot subscribe to yourself");
  }

  const channel = await User.findById(channelId);
  if (!channel) {
    throw new ApiError(404, "Channel not found");
  }

  const subscription = await Subscription.findOne({
    subscriber: subscriberId,
    channel: channelId,
  });

  if (subscription) {
    try {
      await Subscription.findByIdAndDelete(subscription._id);
    } catch (error) {
      throw new ApiError(400, "Error unsubscribing");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "User Unsubscribed successfully"));
  }
  //   const subscribed = await Subscription.create({
  //     subscriber: subscriberId,
  //     channel: channelId,
  //   });
  const subscribed = new Subscription();
  subscribed.subscriber = subscriberId;
  subscribed.channel = channelId;
  const subscribedresult = await subscribed.save();
  if (!subscribedresult) {
    throw new ApiError(400, "Error subscribing");
  }
  return res
    .status(201)
    .json(new ApiResponse(201, subscribed, "User Subscribed Successfully"));
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid Channel Id");
  }

  const channel = await User.findById(channelId);
  if (!channel) {
    throw new ApiError(404, "Channel not found");
  }

  const subscribers = await Subscription.find({ channel: channelId }).populate(
    "subscriber",
    "-password -refreshToken"
  );

  if (!subscribers) {
    throw new ApiError(404, "No subscribers found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, subscribers, "Subscribers fetched successfully")
    );
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid Subscriber Id");
  }

  const subscriber = await User.findById(subscriberId);
  if (!subscriber) {
    throw new ApiError(404, "Subscriber not found");
  }

  const channels = await Subscription.find({
    subscriber: subscriberId,
  }).populate("channel", "-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, channels, "Channels fetched successfully"));
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
