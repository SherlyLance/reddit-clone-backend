import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/user.js';

const userAuth = express.Router();

userAuth.post('/create', [
    body('email').isEmail().withMessage('Invalid email format'),
    body('username').notEmpty().withMessage('Username is required'),
    // REMOVE THIS LINE: body('imageUrl').notEmpty().withMessage('Image URL is required'),
], async (req, res) => {
    try {
        let error = validationResult(req);
        if (!error.isEmpty()) {
            // console.log("Validation Errors:", error.array()); // Add for debugging
            return res.status(400).json({
                success: false,
                errors: error.array()
            });
        }
        // Destructure only the fields you expect to be sent
        const { email, username, imageUrl } = req.body; // Keep imageUrl here if you might send it, but it won't be validated as required
        console.log("Received data for user creation:", req.body); // Add this for debugging

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
            imageUrl: imageUrl || null, // Allow imageUrl to be null if not provided
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
        console.error("Backend error creating user:", error); // Use console.error for backend errors
        return res.status(500).json({
            success: false,
            message: 'User not created due to server error' // More descriptive message
        });
    }
},)

export default userAuth;
