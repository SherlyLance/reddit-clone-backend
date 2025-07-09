export default function getPublicId(cloudinaryUrl) {
    // Remove the base URL and version part
    const parts = cloudinaryUrl.split('/upload/');
    if (parts.length < 2) return null;

    // Get the path after /upload/
    const path = parts[1];

    // Remove the version number (starts with "v" and followed by digits)
    const pathWithoutVersion = path.replace(/^v\d+\//, '');

    // Remove the file extension
    const publicId = pathWithoutVersion.replace(/\.[^/.]+$/, '');

    return publicId;
}