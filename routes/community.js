import express from 'express'
import Community from '../models/community.js'
import User from '../models/user.js'
import { validationResult, body, query } from 'express-validator'
import upload from '../multer/communityImage.js'
import { uploadImage, destroyImage } from '../cloudinary/cloudinary.js'
import fs from 'fs'
import path from 'path'
import getPublicId from '../public_id/public_id.js'

const communityRoute = express.Router()

const createCommunityValidator = [
    body('name')
        .trim()
        .notEmpty().withMessage('Community name is required.')
        .isLength({ min: 3, max: 21 }).withMessage('Community name must be at least 3 characters long.'),

    body('description')
        .trim()
        .notEmpty().withMessage('Description is required.')
        .isLength({ min: 10, max: 500 }).withMessage('Description must be at least 10 characters long.')
];

communityRoute.post('/create', upload.single('image'), createCommunityValidator, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.json({
                success: false,
                errors: errors.array(),
                message: "Something is missing or validation failed"
            });
        }
        if (!req.file) {
            return res.json({
                success: false,
                message: "File is required"
            })
        }

        const { name, description, email } = req.body;

        const extension = path.extname(req.file.originalname)

        let user = await User.findOne({ email: email })
        const isCommunityExist = await Community.findOne({ name: name })

        if (!user) {
            fs.unlink(`public/community${extension}`, (err) => { })
            return res.json({
                success: false,
                message: "Unauthorized user"
            })
        }

        if (isCommunityExist) {
            fs.unlink(`public/community${extension}`, (err) => { })
            return res.json({
                success: false,
                message: "Community alerady exists"
            })
        }

        let url = await uploadImage(`public/${req.file.filename}`, 'reddit/community')

        await Community.create({
            name: name,
            description: description,
            imageUrl: url.secure_url,
            authorId: user._id
        })

        fs.unlink(`public/community${extension}`, (err) => { })

        return res.json({
            success: true,
            message: "Community created",
        });
    } catch (error) {
        console.log(error.message);
        return res.json({
            success: false,
            message: 'Internal server error'
        });
    }
}, (error, req, res, next) => {
    if (error) {
        return res.json({
            success: false,
            message: "Only Image file is accepted"
        })
    }
});

communityRoute.post('/getCommunities', [
    body("email").isEmail().withMessage("Invalid email").isEmpty().withMessage("Email required")
], async (req, res) => {
    try {
        const { email } = req.body;
        const isExist = await User.findOne({ email: email })
        if (!email || !isExist) {
            return res.json({
                success: false,
                message: "Unauthorized"
            })
        }

        const communities = await Community.find({ authorId: isExist._id })

        return res.json({
            success: true,
            communities
        })

    } catch (error) {
        console.log(error.message)
        return res.json({
            success: false,
            message: "Could not fetch communities"
        })
    }
})

communityRoute.post('/updateCommunityImage', upload.single("communityImage"), async (req, res) => {
    try {
        if (!req.file || !req.body.id) {
            return res.json({
                success: false,
                message: "Something is missing"
            })
        }

        let community = await Community.findById(req.body.id)

        if (!community) {
            return res.json({
                success: false,
                message: "Community does not exist"
            })
        }

        const publicId = await getPublicId(community.imageUrl)
        await destroyImage(publicId)
        const result = await uploadImage(`public/${req.file.filename}`, 'reddit/community')
        await Community.findByIdAndUpdate(req.body.id, {
            imageUrl: result.secure_url
        })
        fs.unlink(`public/${req.file.filename}`, (err) => { })

        return res.json({
            success: true,
            result
        })
    } catch (error) {
        console.log(error.message)
        return res.json({
            success: false,
            message: "Internal server error"
        })
    }
})

communityRoute.get('/get-community', async (req, res) => {
    try {
        const { q } = req.query
        if (!q) {
            return res.json({
                success: false,
                message: "Community ID is required"
            })
        }
        const community = await Community.findById(q)
        if (!community) {
            return res.json({
                success: false,
                message: "Community does not exist"
            })
        }
        return res.json({
            success: true,
            community
        })
    } catch (error) {
        return res.json({
            success: false,
            message: "Server error occured"
        })
    }
})

communityRoute.post('/search-community', async (req, res) => {
    try {
        const { query } = req.body
        if (!query) {
            return res.json({
                success: false,
                message: "Community ID is required"
            })
        }
        const communities = await Community.find({
            name: { $regex: query, $options: 'i' }
        }, '_id name').limit(5)
        if (!communities) {
            return res.json({
                success: false,
                message: "No communities found"
            })
        }
        return res.json({
            success: true,
            communities
        })
    } catch (error) {
        return res.json({
            success: false,
            message: "Internal server error"
        })
    }
})

communityRoute.get('/getFileNames', async (req, res) => {
    try {
        let files = fs.readdirSync('public')
        return res.json({
            success: true,
            files
        })
    } catch (error) {
        return res.json({
            success: false,
            message: "Internal server error"
        })
    }
})

export default communityRoute;