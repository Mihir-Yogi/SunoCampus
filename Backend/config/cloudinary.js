import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage for event banner images
const eventBannerStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'sunocampus/events',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, height: 630, crop: 'limit', quality: 'auto' }],
  },
});

// Storage for post images
const postImageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'sunocampus/posts',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }],
  },
});

// Storage for registration file uploads (custom form file fields)
const registrationFileStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'sunocampus/registrations',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
    resource_type: 'auto',
  },
});

// Multer instances
export const uploadEventBanner = multer({
  storage: eventBannerStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export const uploadPostImage = multer({
  storage: postImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export const uploadRegistrationFile = multer({
  storage: registrationFileStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Utility: delete image from Cloudinary by public_id
export const deleteCloudinaryImage = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error.message);
  }
};

export { cloudinary };
export default cloudinary;
