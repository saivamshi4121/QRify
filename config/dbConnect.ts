import dns from "dns";
import mongoose from "mongoose";

const PUBLIC_DNS_SERVERS = ["8.8.8.8", "1.1.1.1"];

/**
 * Some Windows setups point Node at a local/IPv6 resolver that refuses
 * mongodb+srv SRV lookups (querySrv ECONNREFUSED). Fall back to public DNS.
 */
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

        if (needsPublicDns) {
            dns.setServers(PUBLIC_DNS_SERVERS);
        }
    } catch {
        // Ignore DNS configuration failures; mongoose will surface connect errors.
    }
}

preferPublicDnsIfNeeded();

function getMongoUri() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error(
            "Please define the MONGODB_URI environment variable inside .env.local",
        );
    }
    return uri;
}

function isSrvDnsError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    return (
        error.message.includes("querySrv") ||
        ("code" in error && (error as NodeJS.ErrnoException).code === "ECONNREFUSED")
    );
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

function connectOnce() {
    const opts = { bufferCommands: false };
    return mongoose.connect(getMongoUri(), opts).then((m) => m);
}

async function dbConnect() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        cached.promise = connectOnce();
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;

        // Retry once with public DNS if SRV lookup failed
        if (isSrvDnsError(e)) {
            dns.setServers(PUBLIC_DNS_SERVERS);
            cached.promise = connectOnce();
            try {
                cached.conn = await cached.promise;
            } catch (retryError) {
                cached.promise = null;
                throw retryError;
            }
            return cached.conn;
        }

        throw e;
    }

    return cached.conn;
}

export default dbConnect;
