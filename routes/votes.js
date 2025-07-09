import express from 'express'
import { body, validationResult } from 'express-validator'
import Vote from '../models/vote.js';
import User from '../models/user.js'
import Post from '../models/post.js'
import mongoose from 'mongoose';

const voteRouter = express.Router()

voteRouter.post('/react', [
    body("vote").notEmpty().withMessage("Vote is required"),
    body("userId").notEmpty().withMessage("User ID is required"),
    body("postId").notEmpty().withMessage("Post ID is required"),
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

        const { vote, userId, postId } = req.body;

        let userVote = await Vote.create({
            type: vote,
            userId,
            postId
        })

        await Post.findByIdAndUpdate(postId, {
            $push: {
                votes: userVote._id
            }
        })

        await User.findByIdAndUpdate(userId, {
            $push: {
                votes: userVote._id
            }
        })

        return res.json({
            success: true,
            message: "Vote added"
        })
    } catch (error) {
        return res.json({
            success: false,
            message: "Internal server error"
        })
    }
})

voteRouter.post("/getVoteDetails", [
    body("userId").notEmpty().withMessage("User Id is required"),
    body("postId").notEmpty().withMessage("Post Id is required")
], async (req, res) => {
    try {
        let errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.json({
                success: false,
                errors: errors.array()
            })
        }

        const { userId, postId } = req.body;
        if (!userId || !postId) {
            return res.json({
                success: false,
                message: "User ID and Post ID are required"
            })
        }

        const userVote = await Vote.findOne({
            userId,
            postId
        })

        if (userVote) {
            return res.json({
                success: true,
                vote: userVote,
            })
        }

        return res.json({
            success: false,
        })
    } catch (error) {
        return res.json({
            success: false,
            message: "Internal server error"
        })
    }
})

voteRouter.post('/voteCount', async (req, res) => {
    try {
        if (!req.body.postId) {
            return res.json({
                success: false
            })
        }
        const { postId } = req.body;
        let countUp = await Vote.countDocuments({ postId, type: "up" })
        let countDown = await Vote.countDocuments({ postId, type: "down" })
        return res.json({
            success: true,
            counts: countUp - countDown
        })
    } catch (error) {
        return res.json({
            success: false
        })
    }
})

voteRouter.post('/updateVote', [
    body("vote").isIn(['up', 'down']).withMessage("Invalid vote"),
    body("destroy").isBoolean().withMessage("Destroy is required"),
    body("userId").notEmpty().withMessage("User ID is required"),
    body("postId").notEmpty().withMessage("Post ID is required"),
], async (req, res) => {
    try {
        let errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.json({
                success: false,
                errors: errors.array(),
                message: "Inappropriate data"
            })
        }

        const { vote, destroy, postId, userId } = req.body;

        if (!userId || !postId) {
            return res.json({
                success: false,
                message: "User ID and Post ID are required"
            })
        }
        if (destroy) {
            let deletedDoc = await Vote.findOneAndDelete({
                userId,
                postId
            })

            await Post.findByIdAndUpdate(postId, {
                $pull: {
                    votes: deletedDoc._id
                }
            })

            await User.findByIdAndUpdate(userId, {
                $pull: {
                    votes: deletedDoc._id
                }
            })

            return res.json({
                success: true,
                message: "Vote removed"
            })
        }
        else {
            const userVote = await Vote.findOne({
                userId,
                postId
            })

            if (userVote) {
                await Vote.findByIdAndUpdate(userVote._id, {
                    type: vote
                })
            }
            else {
                let newVote = await Vote.create({
                    type: vote,
                    userId,
                    postId
                })

                await Post.findByIdAndUpdate(postId, {
                    $push: {
                        votes: newVote._id
                    }
                })

                await User.findByIdAndUpdate(userId, {
                    $push: {
                        votes: newVote._id
                    }
                })

                return res.json({
                    success: true,
                    message: "Vote updated",
                    newVote
                })
            }

            return res.json({
                success: true,
                message: "Vote updated",
            })
        }

    } catch (error) {
        console.log(error)
        return res.json({
            success: false,
            message: "Internal server error"
        })
    }
})

export default voteRouter;