import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { Like } from "../models/like.model.js";

// To toggle like a video
const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user._id;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id.");
  }
  const videoLike = await Like.findOne({ video: videoId, likedBy: userId });
  if (videoLike) {
    try {
      await Like.findByIdAndDelete(videoLike._id);
    } catch (error) {
      throw new ApiError(400, "Error disliking video.");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Video disliked successfully."));
  }
  const newLike = new Like({
    video: videoId,
    likedBy: userId,
  });
  try {
    await newLike.save();
  } catch (error) {
    throw new ApiError(400, "Error liking video.");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, newLike, "Video liked successfully."));
});

// To toggle comment like
const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user._id;
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid Comment Id");
  }
  const commentLike = await Like.findOne({
    comment: commentId,
    likedBy: userId,
  });
  if (commentLike) {
    try {
      await Like.findByIdAndDelete(commentLike._id);
    } catch (error) {
      throw new ApiError(400, "Error disliking comment.");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Comment disliked successfully."));
  }
  const newLike = await Like.create({
    comment: commentId,
    likedBy: userId,
  });
  return res
    .status(201)
    .json(new ApiResponse(201, newLike, "Comment Liked Successfully"));
});

// to toggle a tweet like
const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const userId = req.user._id;
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid Tweet Id");
  }
  const tweetLike = await Like.findOne({
    tweet: tweetId,
    likedBy: userId,
  });
  if (tweetLike) {
    try {
      await Like.findByIdAndDelete(tweetLike._id);
    } catch (error) {
      throw new ApiError(400, "Error disliking tweet.");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Tweet disliked successfully."));
  }
});

// To get all Liked Videos
const getLikedVideos = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const likedVideos = await Like.find({
    likedBy: userId,
    video: { $ne: null },
  }).populate("video");
  if (!likedVideos) {
    throw new ApiError(404, "No liked videos found.");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, likedVideos, "Liked Videos fetched successfully.")
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
