import express from 'express'
import { body, validationResult } from 'express-validator'
import Comment from '../models/comment.js'
import User from '../models/user.js'
import Post from '../models/post.js'

const commentRouter = express.Router()

commentRouter.post('/add', [
    body("content").notEmpty().withMessage("Content is required").isString().withMessage("Content must be string"),
    body("postId").notEmpty().withMessage("Post Id is required"),
    body("authorId").notEmpty().withMessage("Author Id is required")
], async (req, res) => {
    try {
        let errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.json({
                success: false,
                message: "Something is missing",
                errors: errors.array()
            })
        }

        const { content, authorId, postId } = await req.body;

        let userComment = await Comment.create({
            content,
            authorId,
            postId
        })

        await Post.findByIdAndUpdate(postId, {
            $push: {
                comments: userComment._id
            }
        })

        await User.findByIdAndUpdate(authorId, {
            $push: {
                comments: userComment._id
            }
        })

        return res.json({
            success: true,
            message: "Comment added successfully"
        })
    } catch (error) {
        return res.json({
            success: false,
            message: "Internal server error"
        })
    }
})

commentRouter.post('/getComments', [
    body("postId").notEmpty().withMessage("Post Id is required"),
    body("page").notEmpty().withMessage("Page is required"),
    body("limit").notEmpty().withMessage("Limit is required")
], async (req, res) => {
    try {
        let errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.json({
                success: false,
                message: "Something is messing",
                errors: errors.array()
            })
        }

        const { postId, page, limit } = req.body;
        
        let comments = await Comment.find({ postId })
            .populate({
                path: "authorId",
                select: "username imageUrl"
            })
            .skip(page * limit)
            .limit(limit)

        let totalComments = await Comment.find({ postId }).countDocuments()

        return res.json({
            success: true,
            message: "Comments fetched successfully",
            comments,
            totalComments
        })
    } catch (error) {
        return res.json({
            success: false,
            message: "Internal server error"
        })
    }
})

export default commentRouter;