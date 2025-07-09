import mongoose from 'mongoose';

const vote = new mongoose.Schema({
    type: {
        type: String,
        enum: ['up', 'down'],
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    },
}, { timestamps: true });

let Vote = mongoose.models.Vote || mongoose.model('Vote', vote);
export default Vote;