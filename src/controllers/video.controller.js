import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { deleteFromCloudinary } from "../utils/cloudinary.js";

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
  if (userId || isValidObjectId(userId)) {
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

  const videoFileLocalPath = req.file?.path;
  const thumbnailFileLocalPath = req.file?.path;

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
    videoFilePublicId: videoFile.public_id,
    thumbnailPublicId: thumbnail.public_id,
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

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully."));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const prevThumbnail = await Video.findById(videoId).select("thumbnail");
  const prevThumbnailUrl = prevThumbnail.thumbnail;

  const { title, description } = req.body;
  const thumbnailFileLocalPath = req.file;

  let thumbnail;
  if (thumbnailFileLocalPath) {
    thumbnail = await uploadOnCloudinary(thumbnailFileLocalPath);
    if (!thumbnail) {
      throw new ApiError(400, "Error uploading thumbnail to cloudinary");
    }
  }

  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
        thumbnail: thumbnail ? thumbnail.url : prevThumbnailUrl,
      },
    },
    { new: true }
  ); // update video

  if (!video) {
    throw new ApiError(400, "Error updating video.");
  }

  if (thumbnail) {
    await deleteFromCloudinary(prevThumbnailUrl);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video updated successfully."));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const thumbnail = video.thumbnail;
  const videoFile = video.videoFile;

  await Video.findByIdAndDelete(videoId);

  if (thumbnail) {
    await deleteFromCloudinary(thumbnail);
  }
  if (videoFile) {
    await deleteFromCloudinary(videoFile);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted successfully."));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const isPublished = video.isPublished;
  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !isPublished,
      },
    },
    { new: true }
  );

  if (!updatedVideo) {
    throw new ApiError(400, "Error updating video.");
  }

  let message;
  if (isPublished) {
    message = "Video is Published";
  } else {
    message = "Video is Unpublished";
  }

  return res.status(200).json(new ApiResponse(200, updatedVideo, message));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
