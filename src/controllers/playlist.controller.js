import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { PlayList } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";

// To get the playlists of a user
const getUserPlaylists = asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user id.");
  }
  const userPlayList = await PlayList.find({ owner: userId })
    .populate("videos")
    .populate("owner")
    .select("-password -refreshToken -watchHistory -updatedAt");
  if (!userPlayList || userPlayList.length === 0) {
    throw new ApiError(404, "No playlist found.");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, userPlayList, "User playlists fetched successfully.")
    );
});

// To get a playlist by its id
const getPlayList = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id.");
  }
  // Just trying aggregation pipeline for populating videos and owner
  const playlist = await PlayList.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $project: {
        "owner.password": 0,
        "owner.refreshToken": 0,
        "owner.watchHistory": 0,
        "owner.createdAt": 0,
        "owner.updatedAt": 0,
      },
    },
  ]);
  if (!playlist || playlist.length === 0) {
    throw new ApiError(404, "Playlist not found.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist fetched successfully."));
});

// To create a new playlist
const createPlayList = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const owner = req.user?._id;
  const playlist = await PlayList.create({
    name,
    description,
    owner,
  });
  if (!playlist) {
    throw new ApiError(400, "Error creating playlist.");
  }
  return res
    .status(201)
    .json(new ApiResponse(201, playlist, "Playlist created successfully."));
});

// To update a playlist
const updatePlayList = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id.");
  }
  const { name, description } = req.body;
  const playlist = await PlayList.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found.");
  }
  const updatedPlaylist = await PlayList.findByIdAndUpdate(
    playlistId,
    {
      $set: {
        name,
        description,
      },
    },
    { new: true }
  )
    .populate("videos")
    .populate("owner")
    .select("-password -refreshToken -watchHistory -createdAt -updatedAt");
  if (!updatedPlaylist) {
    throw new ApiError(400, "Error updating playlist.");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedPlaylist, "Playlist updated successfully.")
    );
});

// To delete a playlist
const deletePlayList = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id.");
  }

  try {
    await PlayList.findByIdAndDelete(playlistId); // Deleting playlist document from collection by id 
  } catch (error) {
    return new ApiError(400, "Error deleting playlist.");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Playlist deleted successfully."));
});

// To add a video to a playlist
const addVideoToPlayList = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { videoId } = req.body;
  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid playlist or video id.");
  }
  const playlist = await PlayList.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found.");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found.");
  }
  if (playlist.videos.includes(videoId)) {
    throw new ApiError(400, "Video already exists in playlist.");
  }
  const updatedPlaylist = await PlayList.findByIdAndUpdate(
    playlistId,
    { $push: { videos: videoId } }, // Pushing video id to videos array
    { new: true }
  )
    .populate("videos")
    .populate("owner")
    .select("-password -refreshToken -watchHistory -createdAt -updatedAt");

  if (!updatedPlaylist) {
    throw new ApiError(400, "Error adding video to playlist.");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlaylist,
        "Video added to Playlist successfully."
      )
    );
});

// To remove a video from a playlist
const removeVideoFromPlayList = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { videoId } = req.body;
  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid playlist or video id.");
  }
  const playlist = await PlayList.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found.");
  }
  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found.");
  }
  if (!playlist.videos.includes(videoId)) {
    throw new ApiError(404, "Video doesn't exist in playlist.");
  }
  const updatedPlaylist = await PlayList.findByIdAndUpdate(
    playlistId,
    { $pull: { videos: videoId } }, // Pulling out the video id from videos array
    { new: true }
  )
    .populate("videos")
    .populate("owner")
    .select("-password -refreshToken -watchHistory -createdAt -updatedAt");
  if (!updatedPlaylist) {
    throw new ApiError(400, "Error removing video from playlist.");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedPlaylist, "Video removed from playlist.")
    );
});

export {
  getUserPlaylists,
  getPlayList,
  createPlayList,
  updatePlayList,
  deletePlayList,
  addVideoToPlayList,
  removeVideoFromPlayList,
};
