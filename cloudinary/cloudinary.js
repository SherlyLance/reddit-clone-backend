import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
    secure: true,
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});

async function uploadImage(imagePath, folderName, resourceType) {
    try {
        const imageUrl = await cloudinary.uploader.upload(imagePath, {
            folder: folderName,
            resource_type: resourceType // This can be 'image', 'video', 'raw', etc.
        });
        return imageUrl; // This returns the full Cloudinary response object
    } catch (error) {
        // Log the actual Cloudinary error for debugging
        console.error("Cloudinary upload error:", error);
        // Re-throw the error so the calling function can catch it
        throw new Error(`Failed to upload image to Cloudinary: ${error.message || error}`);
    }
}

async function destroyImage(publicId) {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        if (result.result !== 'ok') {
            // Cloudinary destroy might return 'not found' or other results
            // Throw an error if it wasn't successful
            throw new Error(`Failed to destroy image on Cloudinary: ${result.result}`);
        }
        return result;
    } catch (error) {
        console.error("Cloudinary destroy error:", error);
        throw new Error(`Failed to destroy image on Cloudinary: ${error.message || error}`);
    }
}

export { uploadImage, destroyImage };
