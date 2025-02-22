import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";
import { PlayList } from "../models/playlist.model.js";
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
  let matchQuery = {};
  if (query) {
    matchQuery = {
      $or: [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ],
    };
  }
  if (userId || isValidObjectId(userId)) {
    matchQuery.owner = new mongoose.Types.ObjectId(userId);
  }

  // sort videos
  const sort = {};
  if (sortBy && sortType) {
    sort[sortBy] = sortType === "desc" ? -1 : 1;
  }

  let videosresult;
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
    aggregationPipeline.push({
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner"
      },
    });
    aggregationPipeline.push({
      $unwind: {
        path: "$owner",
        preserveNullAndEmptyArrays: true
      }
    });
    const options = {
      page: pageNumber,
      limit: limitNumber,
    };

    videosresult = await Video.aggregatePaginate(
      Video.aggregate(aggregationPipeline),
      options
    )
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

  const videoFileLocalPath = req.files?.videoFile[0].path;

  let thumbnailFileLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.thumbnail) &&
    req.files.thumbnail.length > 0
  ) {
    thumbnailFileLocalPath = req.files.thumbnail[0].path;
  }

  if (!videoFileLocalPath) {
    throw new ApiError(400, "Video File is Missing!");
  }

  const videoFile = await uploadOnCloudinary(videoFileLocalPath);

  if (!videoFile) {
    throw new ApiError(400, "Error uploading video to cloudinary");
  }

  let thumbnail;
  if (thumbnailFileLocalPath) {
    try {
      thumbnail = await uploadOnCloudinary(thumbnailFileLocalPath);
    } catch (error) {
      throw new ApiError(
        400,
        error?.message || "Error uploading thumbnail to cloudinary"
      );
    }
  }

  const duration = videoFile.duration;
  const owner = req.user?._id;

  const video = await Video.create({
    videoFile: videoFile.url,
    videoFilePublicId: videoFile.public_id,
    thumbnail: thumbnail?.url,
    thumbnailPublicId: thumbnail?.public_id,
    title,
    description,
    duration,
    owner,
    views: 0,
    isPublished: true,
  });

  if (!video) {
    throw new ApiError(400, "Error creating video.");
  }

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
  console.log(videoId)
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }
  const userWatchHistory = await User.findById(req.user?._id).select(
    "watchHistory"
  );
  if (!userWatchHistory) {
    throw new ApiError(400, "Error fetching user watch history.");
  }

  const watchHistoryStrings = userWatchHistory?.watchHistory.map((id) =>
    id.toString()
  );
  if (watchHistoryStrings.includes(videoId)) {
    const video = await Video.findById(videoId).populate("owner");
    if (!video) {
      throw new ApiError(400, "Error fetching video.");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, video, "Video Already viewed by user."));
  }

  // Update Video View
  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      $inc: {
        views: 1,
      },
    },
    { new: true }
  ).populate("owner");
  if (!video) {
    throw new ApiError("400", "Error Incrementing Views");
  }

  // Update User Watch History
  const updateWatchHistory = await User.findByIdAndUpdate(req.user?._id, {
    $push: {
      watchHistory: videoId,
    },
  });

  if (!updateWatchHistory) {
    throw new ApiError("400", "Error Updating Watch History");
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
  const thumbnailFileLocalPath = req.file?.path;

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
        thumbnailPublicId: thumbnail ? thumbnail.public_id : prevThumbnail.public_id,
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

  try {
    await Video.findByIdAndDelete(videoId);
    try {
      await User.updateMany(
        { watchHistory: videoId },
        { $pull: { watchHistory: videoId } }
      );
    } catch (error) {
      throw new ApiError(400, "Error deleting video from watch history.");
    }
    try {
      await Like.deleteMany({ video: videoId });
    } catch (error) {
      throw new ApiError(400, "Error deleting video likes.");
    }
    try {
      await Comment.deleteMany({ video: videoId });
    } catch (error) {
      throw new ApiError(400, "Error deleting video comments.");
    }
    try {
      await PlayList.updateMany(
        { videos: videoId },
        { $pull: { videos: videoId } }
      );
    } catch (error) {
      throw new ApiError(400, "Error deleting video from playlists.");
    }
  } catch (error) {
    throw new ApiError(400, "Error deleting video.");
  }

  if (thumbnail) {
    try {
      await deleteFromCloudinary(thumbnail);
    } catch (error) {
      throw new ApiError(400, "Error deleting thumbnail from cloudinary.");
    }
  }
  if (videoFile) {
    try {
      await deleteFromCloudinary(videoFile);
    } catch (error) {
      throw new ApiError(400, "Error deleting video file from cloudinary.");
    }
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
