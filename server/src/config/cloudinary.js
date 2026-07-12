import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

let isCloudinaryConfigured = false;

if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  isCloudinaryConfigured = true;

} else {
  console.warn("Cloudinary credentials missing. File uploads will run in MOCK mode.");
}

// Helper upload function
export const uploadToCloudinary = async (fileBuffer, fileName) => {
  if (!isCloudinaryConfigured) {
    console.log(`[MOCK CLOUDINARY] Uploading file: ${fileName}`);
    return {
      public_id: "mock_pub_id_" + Math.random().toString(36).substr(2, 9),
      secure_url: "https://res.cloudinary.com/demo/image/upload/v1600000000/sample.jpg",
    };
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: "auto", public_id: fileName.split(".")[0] },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

export { cloudinary };
