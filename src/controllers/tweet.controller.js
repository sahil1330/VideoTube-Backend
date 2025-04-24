import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Like } from "../models/like.model.js";
import { Tweet } from "../models/tweet.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content) {
    throw new ApiError(400, "Content is required");
  }

  let tweetImageLocalPath;
  if (req.file) {
    try {
      tweetImageLocalPath = req.file?.path;
    } catch (error) {
      throw new ApiError(400, "Error uploading tweet image");
    }
  }

  let tweetImage;
  if (tweetImageLocalPath) {
    try {
      tweetImage = await uploadOnCloudinary(tweetImageLocalPath);
    } catch (error) {
      throw new ApiError(
        400,
        error?.message || "Error uploading tweet image to cloudinary"
      );
    }
  }

  const tweet = await Tweet.create({
    content,
    owner: req.user?._id,
    contentImage: tweetImage?.url,
  });

  if (!tweet) {
    throw new ApiError(400, "Error creating tweet.");
  }

  const populatedTweet = await Tweet.findById(tweet._id).populate(
    "owner",
    "-password -refreshToken"
  );

  return res
    .status(201)
    .json(new ApiResponse(201, populatedTweet, "Tweet created successfully."));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid User ID");
  }
  const tweets = await Tweet.find({
    owner: userId,
  })
    .select("-owner")
    .sort({ createdAt: -1 });

  if (!tweets) {
    throw new ApiError(404, "No tweets found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweets, "User tweets fetched successfully."));
});

const getTweetById = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid Tweet ID");
  }
  const tweet = await Tweet.findById(tweetId)

  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  return res.status(200).json(new ApiResponse(200, tweet, "Tweet fetched successfully."));
})

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;
  const tweetImage = req.file?.path;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid Tweet ID");
  }
  const oldTweetImage = await Tweet.findById(tweetId).select("contentImage");

  let contentImage;
  if (tweetImage) {
    try {
      contentImage = await uploadOnCloudinary(tweetImage);
    } catch (error) {
      throw new ApiError(
        400,
        error?.message || "Error uploading tweet image to cloudinary"
      );
    }
  }

  const tweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: {
        content,
        contentImage: contentImage
          ? contentImage?.url
          : oldTweetImage?.contentImage,
      },
    },
    { new: true }
  ).populate("owner", "-password -refreshToken");

  if (!tweet) {
    throw new ApiError(400, "Error updating tweet.");
  }

  if (contentImage && oldTweetImage?.contentImage) {
    try {
      await deleteFromCloudinary(oldTweetImage.contentImage);
    } catch (error) {
      throw new ApiError(
        400,
        "Error deleting old tweet image from cloudinary."
      );
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid Tweet ID");
  }

  const tweet = await Tweet.findById(tweetId).select("contentImage");

  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  const tweetImage = tweet.contentImage;

  try {
    await Tweet.findByIdAndDelete(tweetId);
    try {
      await Like.deleteMany({ tweet: tweetId });
    } catch (error) {
      throw new ApiError(400, "Error deleting tweet likes");
    }
  } catch (error) {
    throw new ApiError(400, "Error deleting tweet.-" + error.message);
  }

  if (tweetImage) {
    try {
      await deleteFromCloudinary(tweetImage);
    } catch (error) {
      throw new ApiError(400, "Error deleting tweet image from cloudinary.");
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet, getTweetById };
