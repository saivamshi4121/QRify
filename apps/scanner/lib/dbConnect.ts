import dns from "dns";
import mongoose from "mongoose";

const PUBLIC_DNS_SERVERS = ["8.8.8.8", "1.1.1.1"];

function preferPublicDnsIfNeeded() {
    try {
        if (process.env.FORCE_IPV4_DNS === "true") {
            dns.setServers(PUBLIC_DNS_SERVERS);
            return;
        }
        const servers = dns.getServers();
        const needsPublicDns = servers.some(
            (s) => s === "127.0.0.1" || s === "::1" || s.startsWith("fe80:")
        );
        if (needsPublicDns) dns.setServers(PUBLIC_DNS_SERVERS);
    } catch {
        // ignore
    }
}

preferPublicDnsIfNeeded();

const MONGODB_URI = process.env.MONGODB_URI;

type MongooseCache = {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
};

declare global {
    // eslint-disable-next-line no-var
    var mongooseScannerCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseScannerCache || {
    conn: null,
    promise: null,
};

global.mongooseScannerCache = cached;

export default async function dbConnect() {
    if (!MONGODB_URI) {
        throw new Error("Please define MONGODB_URI in apps/scanner/.env.local");
    }
    if (cached.conn) return cached.conn;
    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });
    }
    cached.conn = await cached.promise;
    return cached.conn;
}
