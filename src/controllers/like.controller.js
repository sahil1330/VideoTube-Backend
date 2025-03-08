import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { Tweet } from "../models/tweet.model.js";
import { Like } from "../models/like.model.js";

// To toggle like a video
const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user._id;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id.");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found.");
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
    .status(201)
    .json(new ApiResponse(201, newLike, "Video liked successfully."));
});

// To toggle comment like
const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user._id;
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid Comment Id");
  }
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found.");
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
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found.");
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
  const newLike = await Like.create({
    tweet: tweetId,
    likedBy: userId,
  });
  return res
    .status(201)
    .json(new ApiResponse(201, newLike, "Tweet Liked Successfully"));
});

// To get all Liked Videos
const getLikedVideos = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const likedVideos = await Like.find({
    likedBy: userId,
    video: { $ne: null },
  }).select("video").populate("video");
  const filteredLikedVideos = likedVideos.filter((like) => like.video !== null);
  if (!filteredLikedVideos) {
    throw new ApiError(404, "No liked videos found.");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, filteredLikedVideos, "Liked Videos fetched successfully.")
    );
});

// To get the count of likes on a video
const getVideoLikes = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id.");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found.");
  }
  const videoLikes = await Like.find({ video: videoId }).select("likedBy").populate("likedBy", "_id");
  // const videoLikes = await Like.find({ video: videoId }).populate("likedBy").select("likedBy");
  const videoLikesCount = videoLikes.length;
  return res
    .status(200)
    .json(
      new ApiResponse(200, { videoLikes, videoLikesCount }, "Video likes count fetched successfully.")
    );
})

// To get the count of likes on a tweet
const getTweetLikesCount = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet id.");
  }
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found.");
  }
  const tweetLikesCount = await Like.countDocuments({ tweet: tweetId });
  return res
    .status(200).json(new ApiResponse(200, tweetLikesCount, " Tweet Likes fetched Successfully"))
})

// To get the count of likes on a comment
const getCommentLikesCount = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment id.");
  }
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found.");
  }
  const commentLikesCount = await Like.countDocuments({ comment: commentId });
  return res
    .status(200).json(new ApiResponse(200, commentLikesCount, "Comment Likes fetched Successfully"))
})

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos, getVideoLikes, getTweetLikesCount, getCommentLikesCount };
