import mongoose from "mongoose";

// Lazy check for MONGODB_URI to avoid build-time errors
function getMongoUri() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error(
            "Please define the MONGODB_URI environment variable inside .env.local",
        );
    }
    return uri;
}

interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

declare global {
    // eslint-disable-next-line no-var
    var mongoose: MongooseCache;
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        };

        const mongoUri = getMongoUri();
        cached.promise = mongoose.connect(mongoUri, opts).then((mongoose) => {
            return mongoose;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    return cached.conn;
}

export default dbConnect;
