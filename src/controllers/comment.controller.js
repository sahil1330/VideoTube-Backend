import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { Comment } from "../models/comment.model";
import { Video } from "../models/video.model";

const getVideoComments = asyncHandler(async (req, res) => {
  // Get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  // Convert page and limit string to number
  const pageNumber = Number(page) || 1;
  const limitNumber = Number(limit) || 10;

  let comments;
  try {
    comments = await Comment.aggregatePaginate(
      Comment.aggregate([
        {
          $match: { video: mongoose.Types.ObjectId(videoId) },
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
