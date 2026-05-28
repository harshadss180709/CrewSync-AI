import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Generic project-files storage
const projectStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:         "museflow/projects",
    allowed_formats: ["jpg","jpeg","png","gif","pdf","mp3","mp4","wav","zip","ai","psd"],
    resource_type:  "auto",
  },
});

// Avatar storage
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:         "museflow/avatars",
    allowed_formats: ["jpg","jpeg","png","webp"],
    transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
  },
});

export const uploadProjectFile = multer({ storage: projectStorage });
export const uploadAvatar      = multer({ storage: avatarStorage });
export default cloudinary;
