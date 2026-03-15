const mongoose = require('mongoose');

const connectDB = async (retries = 5, delay = 5000) => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error(`❌ MongoDB Error (attempt ${6-retries}): ${error.message}`);
        
        if (retries > 0) {
            const nextDelay = delay * 2; // Exponential backoff
            console.log(`🔄 Retrying in ${nextDelay/1000}s... (Remaining: ${retries-1})`);
            await new Promise(resolve => setTimeout(resolve, nextDelay));
            return connectDB(retries - 1, nextDelay);
        } else {
            console.error('💥 Max retries reached. MongoDB connection failed permanently.');
            // Don't exit - let server run, routes will 500 on DB ops
            throw error;
        }
    }
};

module.exports = connectDB;
