import mongoose from 'mongoose';

let post = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
    },
    imageUrl: {
        type: String,
        required: true
    },
    communityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Community',
        required: true,
    },
    authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    comments: {
        type: [String],
        default: []
    },
    votes: {
        type: [String],
        default: []
    }
}, { timestamps: true });

let Post = mongoose.models.Post || mongoose.model('Post', post);
export default Post;