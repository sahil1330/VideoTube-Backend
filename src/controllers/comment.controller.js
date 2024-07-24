import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";

const getVideoComments = asyncHandler(async (req, res) => {
  // Get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!isValidObjectId(videoId)) {
    return new ApiError(400, "Invalid video ID");
  }

  // Convert page and limit string to number
  const pageNumber = Number(page) || 1;
  const limitNumber = Number(limit) || 10;

  let comments;
  try {
    comments = await Comment.aggregatePaginate(
      Comment.aggregate([
        {
          $match: { video: new mongoose.Types.ObjectId(videoId) },
        },
        {
          $sort: { createdAt: -1 },
        },
      ]),
      { page: pageNumber, limit: limitNumber }
    );
  } catch (error) {
    throw new ApiError(400, error?.message || "Error fetching comments");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments fetched successfully"));
});

const addComment = asyncHandler(async (req, res) => {
  // Add a comment to a video
  const { videoId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(videoId)) {
    return new ApiError(400, "Invalid video ID");
  }

  if (!content) {
    return new ApiError(400, "Content is required");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  let comment;
  try {
    comment = await Comment.create({
      content,
      video: videoId,
      owner: req.user?._id,
    });
  } catch (error) {
    throw new ApiError(400, error?.message || "Error creating comment");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, comment, "Comment created successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(commentId)) {
    return new ApiError(400, "Invalid Comment Id");
  }

  if (!content) {
    return new ApiError(400, "Content is required");
  }

  const comment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: {
        content,
      },
    },
    { new: true }
  );

  if (!comment) {
    return new ApiError(404, "Comment not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!isValidObjectId(commentId)) {
    return new ApiError(400, "Invalid Comment Id");
  }

  try {
    await Comment.findByIdAndDelete(commentId);
  } catch (error) {
    return new ApiError(400, "Error deleting comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
