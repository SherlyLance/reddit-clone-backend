import mongoose from "mongoose";

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI).then(() => {
            console.log("MongoDB connected successfully");
        }).catch((error) => {
            console.error(`MongoDB connection error: ${error.message}`);
            process.exit(1); // Exit process with failure
        })
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}

export default connectDB;