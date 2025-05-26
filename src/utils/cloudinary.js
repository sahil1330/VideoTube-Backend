import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import logger from "../../logger.js";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Log Cloudinary configuration (without revealing secrets)
console.log("Cloudinary Configuration:", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY ? "Set (hidden)" : "Not set",
  api_secret: process.env.CLOUDINARY_API_SECRET ? "Set (hidden)" : "Not set"
});

// Upload an image
const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      console.log("No file path provided for upload");
      return null;
    }

    // Check if file exists
    if (!fs.existsSync(localFilePath)) {
      console.error("File does not exist at path:", localFilePath);
      return null;
    }

    console.log("Uploading file to Cloudinary:", localFilePath);

    // upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: "videotube",
    }).catch((error) => {
      console.error("Cloudinary upload error:", error);
      throw new Error("Failed to upload to Cloudinary");
    });

    // file has been uploaded successfully
    console.log("File uploaded successfully:", response.url);
    fs.unlinkSync(localFilePath); // remove the locally saved temporary file
    return response;
  } catch (error) {
    console.error("Error uploading to cloudinary:", error);
    // Only attempt to delete file if it exists
    if (localFilePath && fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath); // remove the locally saved temporary file
    }
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
