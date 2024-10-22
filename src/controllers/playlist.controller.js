import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { PlayList } from "../models/playlist.model.js";

const getUserPlaylists = asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user id.");
  }
  const userPlayList = PlayList.find({ owner: userId });
  if (!userPlayList) {
    throw new ApiError(404, "No playlist found for this user.");
  }
  return res
    .sendStatus(200)
    .json(
      new ApiResponse(200, userPlayList, "User playlists fetched successfully.")
    );
});

const getPlayList = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id.");
  }
  const playlist = await PlayList.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found.");
  }

  return res
    .sendStatus(200)
    .ApiResponse(200, playlist, "Playlist fetched successfully.");
});

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
    .sendStatus(201)
    .json(new ApiResponse(201, playlist, "Playlist created successfully."));
});

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
  );
  if (!updatedPlaylist) {
    throw new ApiError(400, "Error updating playlist.");
  }
  return res
    .sendStatus(200)
    .json(
      new ApiResponse(200, updatedPlaylist, "Playlist updated successfully.")
    );
});

const deletePlayList = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id.");
  }

  try {
    await PlayList.findByIdAndDelete(playlistId);
  } catch (error) {
    return new ApiError(400, "Error deleting playlist.");
  }
  return res
    .sendStatus(204)
    .ApiResponse(204, {}, "Playlist deleted successfully.");
});

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
  const updatedPlaylist = await PlayList.findByIdAndUpdate(
    playlistId,
    { $push: { videos: videoId } },
    { new: true }
  );

  if (!updatedPlaylist) {
    throw new ApiError(400, "Error adding video to playlist.");
  }
  return res
    .sendStatus(200)
    .json(
      new ApiResponse(
        200,
        updatedPlaylist,
        "Video added to Playlist successfully."
      )
    );
});

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
  const updatedPlaylist = await PlayList.findByIdAndUpdate(
    playlistId,
    { $pull: { videos: videoId } },
    { new: true }
  );
  if (!updatedPlaylist) {
    throw new ApiError(400, "Error removing video from playlist.");
  }
  return res
    .sendStatus(200)
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
