import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
    secure: true,
    // Change these to match your Render environment variable keys
    cloud_name: process.env.CLOUDINARY_NAME,    // Changed from CLOUD_NAME
    api_key: process.env.CLOUDINARY_API_KEY,      // Changed from API_KEY
    api_secret: process.env.CLOUDINARY_API_SECRET // Changed from API_SECRET
});

async function uploadImage(imagePath, folderName, resourceType) {
    try {
        const imageUrl = await cloudinary.uploader.upload(imagePath, {
            folder: folderName,
            resource_type: resourceType
        });
        return imageUrl;
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        throw new Error(`Failed to upload image to Cloudinary: ${error.message || error}`);
    }
}

async function destroyImage(publicId) {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        if (result.result !== 'ok') {
            throw new Error(`Failed to destroy image on Cloudinary: ${result.result}`);
        }
        return result;
    } catch (error) {
        console.error("Cloudinary destroy error:", error);
        throw new Error(`Failed to destroy image on Cloudinary: ${error.message || error}`);
    }
}

export { uploadImage, destroyImage };
