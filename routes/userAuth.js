import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/user.js';

const userAuth = express.Router();

userAuth.post('/create', [
    body('email').isEmail().withMessage('Invalid email format'),
    body('username').notEmpty().withMessage('Username is required'),
    body('imageUrl').notEmpty().withMessage('Image URL is required'),
], async (req, res) => {
    try {
        let error = validationResult(req);
        if (!error.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: error.array()
            });
        }
        const { email, username, imageUrl } = await req.body;

        const isExist = await User.findOne({ email: email })
        if (isExist) {
            return res.status(400).json({
                success: false,
                message: "User already exists"
            })
        }
        const user = await User.create({
            email,
            username,
            imageUrl,
        })
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'User not created'
            });
        }
        return res.status(200).json({
            success: true,
            message: 'User created',
            user
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'User not created'
        });
    }
},)

export default userAuth;