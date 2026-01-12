import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

// Transformation presets for different image types
export const AVATAR_TRANSFORMATION = {
  width: 400,
  height: 400,
  crop: 'fill',
  gravity: 'face',  // Smart face detection for centering
  quality: 'auto:best',
  fetch_format: 'auto',
  effect: 'improve',  // AI enhancement for image quality
};

export const AVATAR_THUMBNAIL = {
  width: 100,
  height: 100,
  crop: 'fill',
  gravity: 'face',
  quality: 'auto',
  fetch_format: 'auto',
};
