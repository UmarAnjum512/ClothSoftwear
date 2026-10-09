import { v2 as cloudinary } from 'cloudinary';

/**
 * Returns a configured Cloudinary client.
 *
 * Configuration is read lazily (on first use) rather than at import time:
 * server.js loads .env after its static imports are evaluated, so reading
 * process.env at the top of this file would find the keys empty.
 */
let configured = false;

export const getCloudinary = () => {
  if (!configured) {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      throw new Error(
        'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in server/.env'
      );
    }

    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
      secure: true
    });
    configured = true;
  }
  return cloudinary;
};

export default getCloudinary;
