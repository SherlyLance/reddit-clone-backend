import mongoose from 'mongoose';

let community = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    authorId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    posts: {
        type: [String],
        default: []
    }
}, { timestamps: true });

let Community = mongoose.model('Community', community);
export default Community;