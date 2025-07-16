import express from 'express'
import { body, validationResult } from 'express-validator'
import Post from '../models/post.js'
import Community from '../models/community.js'
import User from '../models/user.js'
import postUpload from '../multer/post.js'
import fs from 'fs'
import { uploadImage, destroyImage } from '../cloudinary/cloudinary.js' // Import destroyImage
import getPublicId from '../public_id/public_id.js' // Import getPublicId

const postRouter = express.Router()

// --- Middleware for Authentication (PLACEHOLDER) ---
// This is critical. You need to replace this with your actual Clerk authentication middleware.
// This middleware should extract the user's ID from Clerk and attach it to req.user._id or similar.
// For now, I'll assume you can get the user's email from the request body or a header.
// A more robust solution would involve Clerk's auth middleware.
const authenticateUser = async (req, res, next) => {
    // For now, let's assume `req.body.email` is provided for authentication,
    // which is NOT ideal for production. You should use a JWT or Clerk's session.
    const { email } = req.body;
    if (!email) {
        return res.status(401).json({ success: false, message: "Authentication required: Email missing." });
    }
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(401).json({ success: false, message: "Unauthorized: User not found." });
    }
    req.user = user; // Attach the full user object (or just user._id) to the request
    next();
};


// --- CREATE POST ---
postRouter.post('/uploadPost', postUpload.single("postResource"), [
    body("title").notEmpty().withMessage("Title is required").isString().withMessage("Title must be string"),
    body("email").isEmail().withMessage("Email is required"), // Assuming email is used for auth temporarily
    body("communityId").isString().withMessage("CommunityId is required")
], async (req, res) => {
    let uploadedFilePath; // To ensure cleanup in case of errors
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            if (req.file) {
                uploadedFilePath = req.file.path;
                fs.unlink(uploadedFilePath, (err) => { if (err) console.error("Error deleting file:", err); });
            }
            return res.status(400).json({ // Use 400 Bad Request
                success: false,
                errors: errors.array(),
                message: "Something is missing or validation failed"
            });
        }

        if (!req.file) {
            return res.status(400).json({ // Use 400 Bad Request
                success: false,
                message: "File is required"
            });
        }
        uploadedFilePath = req.file.path; // Store the path for cleanup

        const { title, email, description, communityId } = req.body;

        const userExist = await User.findOne({ email: email });

        if (!userExist) {
            if (uploadedFilePath) {
                fs.unlink(uploadedFilePath, (err) => { if (err) console.error("Error deleting file:", err); });
            }
            return res.status(401).json({ // Use 401 Unauthorized
                success: false,
                message: "User does not exist or unauthorized"
            });
        }

        const communityExist = await Community.findById(communityId);
        if (!communityExist) {
            if (uploadedFilePath) {
                fs.unlink(uploadedFilePath, (err) => { if (err) console.error("Error deleting file:", err); });
            }
            return res.status(404).json({ success: false, message: "Community not found" });
        }


        const image = await uploadImage(uploadedFilePath, 'reddit/posts', req.file.mimetype.split('/')[0]);

        // Check if Cloudinary upload was successful
        if (!image || !image.secure_url) {
            if (uploadedFilePath) {
                fs.unlink(uploadedFilePath, (err) => { if (err) console.error("Error deleting file:", err); });
            }
            return res.status(500).json({
                success: false,
                message: "Failed to upload image to Cloudinary."
            });
        }

        let post = await Post.create({
            title,
            content: description,
            imageUrl: image.secure_url,
            communityId,
            authorId: userExist._id
        });

        await User.findByIdAndUpdate(userExist._id, {
            $push: {
                posts: post._id
            }
        });

        await Community.findByIdAndUpdate(communityId, {
            $push: {
                posts: post._id
            }
        });

        if (uploadedFilePath) {
            fs.unlink(uploadedFilePath, (err) => { if (err) console.error("Error deleting temporary file:", err); });
        }

        return res.status(201).json({ // Use 201 Created
            success: true,
            message: "Post uploaded",
            post: post // Return the created post data
        });
    } catch (error) {
        console.error("Error in uploadPost route:", error);
        if (uploadedFilePath) {
            fs.unlink(uploadedFilePath, (err) => { if (err) console.error("Error deleting temporary file in catch:", err); });
        }
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}, (error, req, res, next) => {
    // Multer error handler
    if (error) {
        if (req.file) { // Clean up file if Multer caught an error after saving it
            fs.unlink(req.file.path, (err) => { if (err) console.error("Error deleting file in Multer handler:", err); });
        }
        return res.status(400).json({ // Use 400 Bad Request
            success: false,
            message: "Only Image and Video file is accepted"
        });
    }
    next(error); // Pass other errors
});


// --- EDIT POST ---
postRouter.put('/edit/:postId', authenticateUser, [
    body("title").optional().trim().isString().withMessage("Title must be a string"),
    body("content").optional().trim().isString().withMessage("Content must be a string")
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array(),
                message: "Validation failed for edit"
            });
        }

        const { postId } = req.params;
        const { title, content } = req.body; // Allow partial updates

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found.' });
        }

        // Authorization: Check if the current authenticated user is the author of the post
        // IMPORTANT: Ensure req.user._id is populated by your actual authentication middleware
        if (post.authorId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Forbidden: You are not authorized to edit this post.' });
        }

        // Update fields if they are provided in the request body
        if (title !== undefined) post.title = title;
        if (content !== undefined) post.content = content; // Assuming 'description' from frontend maps to 'content' in model
        post.lastEditedAt = new Date(); // Update edit timestamp

        await post.save();

        return res.status(200).json({
            success: true,
            message: 'Post updated successfully.',
            post: post
        });

    } catch (error) {
        console.error('Error updating post:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while updating post.'
        });
    }
});


// --- DELETE POST ---
postRouter.delete('/delete/:postId', authenticateUser, async (req, res) => {
    try {
        const { postId } = req.params;

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found.' });
        }

        // Authorization: Check if the current authenticated user is the author of the post
        if (post.authorId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Forbidden: You are not authorized to delete this post.' });
        }

        // 1. Delete associated image/video from Cloudinary
        if (post.imageUrl) {
            try {
                const publicId = getPublicId(post.imageUrl);
                if (publicId) {
                    await destroyImage(publicId);
                }
            } catch (cloudinaryError) {
                console.warn(`Warning: Could not delete Cloudinary image for post ${postId}:`, cloudinaryError.message);
                // Continue with deletion of post even if image deletion fails,
                // but log the warning. You might choose to stop here if image deletion is critical.
            }
        }

        // 2. Remove post from User's posts array
        await User.findByIdAndUpdate(post.authorId, {
            $pull: { posts: postId }
        });

        // 3. Remove post from Community's posts array
        await Community.findByIdAndUpdate(post.communityId, {
            $pull: { posts: postId }
        });

        // 4. Delete the post from the database
        await Post.deleteOne({ _id: postId });

        return res.status(200).json({ success: true, message: 'Post deleted successfully.' }); // 200 OK or 204 No Content

    } catch (error) {
        console.error('Error deleting post:', error);
        return res.status(500).json({ success: false, message: 'Internal server error while deleting post.' });
    }
});


// --- EXISTING ROUTES (KEEP THEM AS IS) ---
postRouter.get('/getCommunityPosts', async (req, res) => { /* ... existing code ... */ });
postRouter.post('/getAllPosts', async (req, res) => { /* ... existing code ... */ });
postRouter.get("/getPost", async (req, res) => { /* ... existing code ... */ });
postRouter.get('/recent-posts', async (req, res) => { /* ... existing code ... */ });
postRouter.post('/filterPosts', [ /* ... existing code ... */ ]);

export default postRouter;
