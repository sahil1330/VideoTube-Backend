import mongoose, { isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Like } from "../models/like.model.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

  const { channelId } = req.params;

  // Get total video views of a channel
  const totalVideoViews = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId("6668adfecd3df591e0c55aa2"),
      },
    },
    {
      $group: {
        _id: null,
        viewsCount: {
          $sum: "$views",
        },
      },
    },
  ]);

  if (!totalVideoViews) {
    throw new ApiError(400, "Error fetching total video views.");
  }

  // Get total subscribers of a channel
  const totalSubscribers = await Subscription.countDocuments({
    channel: channelId,
  }).catch((error) => {
    throw new ApiError(400, "Error fetching total subscribers.");
  });

  // Get total videos of a channel
  const totalVideos = await Video.countDocuments({
    owner: channelId,
  }).catch((error) => {
    throw new ApiError(400, "Error fetching total videos.");
  });

  // Get total likes on videos of a channel
  const totalLikes = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId("6668adfecd3df591e0c55aa2"),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $unwind: "$likes",
    },
    {
      $group: {
        _id: null,
        totalNumberOfLikes: {
          $sum: 1,
        },
      },
    },
  ]);

  if (!totalLikes) {
    throw new ApiError(400, "Error fetching total likes.");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalVideoViews: totalVideoViews[0]?.viewsCount || 0,
        totalSubscribers,
        totalVideos,
        totalLikes: totalLikes[0]?.totalNumberOfLikes || 0,
      },
      "Channel stats fetched successfully."
    )
  );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel id.");
  }

  const videos = await Video.find({ owner: channelId }).sort({
    createdAt: -1,
  });

  if (!videos) {
    throw new ApiError(404, "No videos found for this channel.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Channel videos fetched successfully"));
});

export { getChannelStats, getChannelVideos };
