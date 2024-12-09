import mongoose from "mongoose"

type connectionObject = {
    isConnected?: number
}

const connection: connectionObject = {}

export const connectToDatabase = async () => {

    mongoose.set('strictQuery', true);

    if (!process.env.MONGODB_URL) {
        return console.log('MISSING MONGODB_URL');
    }

    if (connection.isConnected) {
        // console.log("Already connected to DB");
        return;
    }

    try {
        const db = await mongoose.connect(`${process.env.MONGODB_URL!}`, {
            dbName: process.env.DB_NAME
        });
        connection.isConnected = db.connections[0].readyState;
        // console.log("DB connect successfully");
    } catch (error) {
        console.log("DB connection failed", error)
        process.exit(1);
    }

}