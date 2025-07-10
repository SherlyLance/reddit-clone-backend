import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import userAuth from './routes/userAuth.js';
import connectDB from './connectdb/connectdb.js'
import communityRoute from './routes/community.js';
import postRouter from './routes/posts.js';
import commentRouter from './routes/comment.js';
import voteRouter from './routes/votes.js';

dotenv.config();

let app = express();

// Define allowed origins based on environment
// For local development, it will allow localhost:3000
// For production, it will use the URL from Render's CORS_ORIGIN env variable
const allowedOrigins = [
    'http://localhost:3000', // For local frontend development
    process.env.CORS_ORIGIN // This variable will hold your Vercel frontend URL
];

// Middlewares
// Configure CORS to allow specific origins
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        // or if the origin is in our allowedOrigins list
        if (!origin) return callback(null, true); // Allow requests without an origin (e.g., Postman, server-to-server)
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true // Important: Set this to true if your frontend sends cookies, authorization headers, or needs session management. Clerk often relies on this.
}));

app.use(express.json());
app.use(bodyParser.json()); // body-parser.json is usually sufficient, express.json() also covers it. You likely only need one.
// app.use(bodyParser.urlencoded({ extended: true })); // Only uncomment if you are specifically sending url-encoded data
app.use(express.static('public')); // Serve static files from 'public' directory
app.use('/user', userAuth);
app.use('/community', communityRoute);
app.use('/post', postRouter);
app.use('/comment', commentRouter);
app.use('/vote', voteRouter);

// Database connection
connectDB();

app.get('/', (req, res) => {
    return res.send('Hello World!');
});

// Make sure your app listens on process.env.PORT for Render deployment
const PORT = process.env.PORT || 5000; // Use port 5000 as a fallback for local testing if PORT is not set
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    // For deployment, console.log(Server is running on port ${PORT}); might be more accurate
});
