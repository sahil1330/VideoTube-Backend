import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Tweet } from "../models/tweet.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content) {
    throw new ApiError(400, "Content is required");
  }
  let tweetImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.tweetImage) &&
    req.files.tweetImage.length > 0
  ) {
    tweetImageLocalPath = req.files.tweetImage[0].path;
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
    return new ApiError(400, "Error creating tweet.");
  }

  const populatedTweet = await Tweet.findById(tweet._id).populate(
    "owner",
    "-password -refreshToken"
  );

  return res
    .status(201)
    .json(new ApiResponse(201, populatedTweet, "Tweet created successfully."));
});

export { createTweet };
