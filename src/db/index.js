import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import logger from "../../logger.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`MongoDB connected !! DBHOST: ${connectionInstance.connection.host}`)
    } catch (error) {
        console.error("MONGODB connection FAILED: ", error);
        logger.error(error);
        process.exit(1);
    }
}

export default connectDB;