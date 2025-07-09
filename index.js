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

//middlewares
app.use(cors());
app.use(express.json());
// app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use('/user', userAuth);
app.use('/community', communityRoute)
app.use('/post', postRouter)
app.use('/comment', commentRouter)
app.use('/vote', voteRouter)

//database connection
connectDB();

app.get('/', (req, res) => {
    return res.send('Hello World!');
})

app.listen(process.env.PORT, () => {
    console.log(`Server is running on http://localhost:${process.env.PORT}`);
})