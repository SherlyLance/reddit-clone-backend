import mongoose from 'mongoose';

let user = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    imageUrl: {
        type: String,
        required: true,
    },
    posts: {
        type: [String],
        default: [],
    },
    comments: {
        type: [String],
        default: [],
    },
    votes: {
        type: [String],
        default: [],
    }
}, { timestamps: true });

let User = mongoose.models.User || mongoose.model('User', user);
export default User;