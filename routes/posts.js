import express from 'express'
import { body, validationResult } from 'express-validator'
import Post from '../models/post.js'
import Community from '../models/community.js'
import User from '../models/user.js'
import postUpload from '../multer/post.js'
import fs from 'fs'
import { uploadImage } from '../cloudinary/cloudinary.js'

const postRouter = express.Router()

postRouter.post('/uploadPost', postUpload.single("postResource"), [
    body("title").notEmpty().withMessage("Title is required").isString().withMessage("Title must be string"),
    body("email").isEmail().withMessage("Email is required"),
    body("communityId").isString().withMessage("CommunityId is required")
], async (req, res) => {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            if (req.file) {
                fs.unlink(`public/${req.file.filename}`, (err) => { })
            }
            return res.json({
                success: false,
                errors: errors.array(),
                message: "Something is missing or validation failed"
            })
        }
        if (!req.file) {
            return res.json({
                success: false,
                message: "File is required"
            })
        }
        const { title, email, description, communityId } = req.body;

        const userExist = await User.findOne({ email: email })

        if (!userExist) {
            fs.unlink(`public/${req.file.filename}`, (err) => { })
            return res.json({
                success: false,
                message: "User does not exist"
            })
        }

        const image = await uploadImage(`public/${req.file.filename}`, 'reddit/posts', req.file.mimetype.split('/')[0])

        let post = await Post.create({
            title,
            content: description,
            imageUrl: image.secure_url,
            communityId,
            authorId: userExist._id
        })

        await User.findByIdAndUpdate(userExist._id, {
            $push: {
                posts: post._id
            }
        })

        await Community.findByIdAndUpdate(communityId, {
            $push: {
                posts: post._id
            }
        })

        fs.unlink(`public/${req.file.filename}`, (err) => { })

        return res.json({
            success: true,
            message: "Post uploaded"
        })
    } catch (error) {
        return res.json({
            success: true,
            message: 'Internal server error'
        })
    }
}, (error, req, res, next) => {
    if (error) {
        return res.json({
            success: false,
            message: "Only Image and Video file is accepted"
        })
    }
})

postRouter.get('/getCommunityPosts', async (req, res) => {
    try {
        const { q } = req.query
        if (!q) {
            return res.json({
                success: false,
                message: "Community ID is required"
            })
        }

        let postsArray = await Community.findById(q).select('posts -_id')

        if (!postsArray) {
            return res.json({
                success: false,
                message: "Community does not exist"
            })
        }

        let posts = await Post.find({ _id: { $in: postsArray.posts } }).populate({
            path: "authorId",
            select: "username imageUrl"
        })

        return res.json({
            success: true,
            posts
        })
    } catch (error) {
        console.log(error)
        return res.json({
            success: false,
            message: "Internal server error"
        })
    }
})

// , [
//     body("page").notEmpty().withMessage("Page is required"),
//     body("limit").notEmpty().withMessage("Limit is required")
// ]

postRouter.post('/getAllPosts', async (req, res) => {
    try {
        const { page, limit } = req.body
        let posts = await Post.find({}).populate({
            path: 'authorId',
            select: 'username imageUrl'
        }).skip(limit * page).limit(limit)

        if (!posts) {
            return res.json({
                success: false,
                message: "No posts available"
            })
        }

        const total = await Post.countDocuments()

        return res.json({
            success: true,
            posts,
            total
        })
    } catch (error) {
        return res.json({
            success: false,
            message: "Internal server error"
        })
    }
})

postRouter.get("/getPost", async (req, res) => {
    try {
        let { postId } = req.query;
        if (!postId) {
            return res.json({
                success: false,
                message: "Post Id is required"
            })
        }
        const post = await Post.findById(postId).select("-comments -updatedAt").populate({
            path: "authorId",
            select: "username imageUrl"
        })
        if (!post) {
            return res.json({
                success: false,
                message: "Post does not exist"
            })
        }

        return res.json({
            success: true,
            post
        })
    } catch (error) {
        return req.json({
            success: false,
            message: 'Internal server error'
        })
    }
})

postRouter.get('/recent-posts', async (req, res) => {
    try {
        const posts = await Post.find({}).populate({
            path: "authorId",
            select: "username imageUrl"
        })

        if (!posts) {
            return res.json({
                success: false,
            })
        }

        return res.json({
            success: true,
            posts
        })
    } catch (error) {
        return res.json({
            success: false,
            message: "Internal server error"
        })
    }
})

postRouter.post('/filterPosts', [
    body("date").isString().withMessage("Date is required")
], async (req, res) => {
    try {
        let errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.json({
                success: false,
                message: "Date is required",
                errors: errors.array()
            })
        }
        const { date } = req.body;
        const posts = await Post.find({
            createdAt: {
                $gte: new Date(date)
            }
        }).populate({
            path: "authorId",
            select: "username imageUrl"
        });

        if (!posts || posts.length === 0) {
            return res.json({
                success: false,
                message: "No posts found"
            });
        }

        return res.json({
            success: true,
            posts,
        });
    } catch (error) {
        return res.json({
            success: false,
            message: "Internal server error"
        })
    }
})

export default postRouter;