import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv'
dotenv.config()

cloudinary.config({
    secure: true,
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
})

async function uploadImage(imagePath, folderName, resourceType) {
    try {
        const imageUrl = await cloudinary.uploader.upload(imagePath, {
            folder: folderName,
            resource_type: resourceType
        })

        return imageUrl
    } catch (error) {
        return error.message
    }
}

async function destroyImage(publicId) {
    try {
        let object = await cloudinary.uploader.destroy(publicId)
        return object;
    } catch (error) {
        return error.message;
    }
}

export { uploadImage, destroyImage };