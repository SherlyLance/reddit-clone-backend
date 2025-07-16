// public_id/public_id.js
export default function getPublicId(cloudinaryUrl) {
    // Example Cloudinary URL: https://res.cloudinary.com/yourcloud/image/upload/v16789/folder/image_name.jpg
    // We want 'folder/image_name'

    const parts = cloudinaryUrl.split('/upload/');
    if (parts.length < 2) return null; // Not a valid Cloudinary URL format

    const pathAfterUpload = parts[1]; // e.g., 'v16789/folder/image_name.jpg'

    // Remove version number (e.g., 'v16789/')
    const pathWithoutVersion = pathAfterUpload.replace(/^v\d+\//, '');

    // Remove file extension
    const publicId = pathWithoutVersion.split('.')[0];

    return publicId;
}
