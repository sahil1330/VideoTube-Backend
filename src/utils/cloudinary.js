import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import logger from "../../logger.js";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View Credentials' below to copy your API secret
});

// Upload an image
const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    // upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: "videotube",
      transformation: [{ quality: "auto", fetch_format: "auto" }],
    });
    // file has been uploaded successfully
    fs.unlinkSync(localFilePath); // remove the locally saved temporary file
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the upload operation got failed
    return null;
  }
};

const deleteFromCloudinary = async (fileUrl) => {
  const publicId = fileUrl.split("/").pop().split(".")[0];
  await cloudinary.uploader
    .destroy(publicId, {
      invalidate: true,
    })
    .then((result) => logger.info(result))
    .catch((error) => logger.error(error));
};

const autoCropAvatarUrl = (avatarUrl) => {
  return avatarUrl.replace("/upload/", "/upload/w_400,h_400,c_thumb,g_face/");
};

export { uploadOnCloudinary, deleteFromCloudinary, autoCropAvatarUrl };
