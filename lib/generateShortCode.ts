import crypto from "crypto";
import dbConnect from "@/config/dbConnect";
import QRCode from "@/models/QRCode";

export async function generateShortCode(): Promise<string> {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const length = 7;
    let isUnique = false;
    let shortUrl = "";

    await dbConnect();

    while (!isUnique) {
        const randomBytes = crypto.randomBytes(length);
        let result = "";

        // Map random bytes to characters
        for (let i = 0; i < length; i++) {
            result += characters[randomBytes[i] % characters.length];
        }
        shortUrl = result;

        // Reliability check: query DB to ensure uniqueness
        // Using select("_id") is faster than fetching full docs
        const existing = await QRCode.findOne({ shortUrl }).select("_id").lean();

        if (!existing) {
            isUnique = true;
        }
        // If exists, loop runs again automatically
    }

    return shortUrl;
}
