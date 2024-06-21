import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

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
    });
    // file has been uploaded successfully
    // console.log("File is uploaded on cloudinary ", response.url);
    fs.unlinkSync(localFilePath); // remove the locally saved temporary file
    // console.log(response);
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
    .then((result) => console.log(result));
};

export { uploadOnCloudinary, deleteFromCloudinary };
