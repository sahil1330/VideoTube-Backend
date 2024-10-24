import { Router } from "express";
import {
  getPlayList,
  getUserPlaylists,
  createPlayList,
  updatePlayList,
  deletePlayList,
  addVideoToPlayList,
  removeVideoFromPlayList,
} from "../controllers/playlist.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/user/:userId").get(getUserPlaylists);
router.route("/create-playlist").post(createPlayList);
router
  .route("/:playlistId")
  .get(getPlayList)
  .patch(updatePlayList)
  .delete(deletePlayList);
router.route("/add-video/:playlistId").post(addVideoToPlayList);
router.route("/remove-video/:playlistId").delete(removeVideoFromPlayList);

export default router;
