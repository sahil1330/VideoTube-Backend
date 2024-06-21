import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model";
import { User } from "../models/user.model";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { uploadOnCloudinary } from "../utils/cloudinary";
import { deleteFromCloudinary } from "../utils/cloudinary";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  // Convert page and limit string to number
  const pageNumber = Number(page) || 1;
  const limitNumber = Number(limit) || 10;
  const matchQuery = {};
  if (query) {
    matchQuery = {
      $or: [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ],
    };
  }
  if (userId) {
    matchQuery.owner = userId;
  }

  // sort videos
  const sort = {};
  if (sortBy && sortType) {
    sort[sortBy] = sortType === "desc" ? -1 : 1;
  }

  try {
    // create an aggregation pipeline
    const aggregationPipeline = [
      {
        $match: matchQuery,
      },
      {
        $sort: sort,
      },
    ];

    const options = {
      page: pageNumber,
      limit: limitNumber,
    };

    const videosresult = await Video.aggregatePaginate(
      Video.aggregate(aggregationPipeline),
      options
    );
  } catch (error) {
    throw new ApiError(400, error?.message || "Error fetching videos.");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, videosresult, "All videos fetched successsfully.")
    );
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video

  const videoFileLocalPath = req.file;
  const thumbnailFileLocalPath = req.file;

  if (!videoFileLocalPath) {
    throw new ApiError(400, "Video File is Missing!");
  }

  if (!thumbnailFileLocalPath) {
    throw new ApiError(400, "Thumbnail File is Missing!");
  }

  const videoFile = await uploadOnCloudinary(videoFileLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailFileLocalPath);

  if (!videoFile || !thumbnail) {
    throw new ApiError(400, "Error uploading video or thumbnail to cloudinary");
  }

  const duration = videoFile.duration;
  const owner = req.user._id;

  const video = await Video.create({
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    title,
    description,
    duration,
    owner,
    views: 0,
    isPublished: true,
  });

  const publishedVideo = await Video.findById(video._id);

  if (!publishedVideo) {
    throw new ApiError(400, "Error publishing video.");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(201, publishedVideo, "Video published successfully.")
    );
});

export { getAllVideos, publishAVideo };
