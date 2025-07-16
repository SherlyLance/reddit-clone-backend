import mongoose from 'mongoose';

let post = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    content: { // This is your description field
        type: String,
    },
    imageUrl: {
        type: String,
        required: true // Keeping this required as per your schema
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
    },
    lastEditedAt: { // New field for tracking edits
        type: Date,
        default: null // Will be updated when the post is edited
    }
}, { timestamps: true });

let Post = mongoose.models.Post || mongoose.model('Post', post);
export default Post;
