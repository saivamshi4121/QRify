import crypto from "crypto";
import dbConnect from "@/config/dbConnect";
import QRCode from "@/models/QRCode";

const CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const CODE_LENGTH = 7;

/** Random code with no DB check — for ephemeral previews only. */
export function generateTempShortCode(): string {
    const randomBytes = crypto.randomBytes(CODE_LENGTH);
    let result = "";
    for (let i = 0; i < CODE_LENGTH; i++) {
        result += CHARACTERS[randomBytes[i] % CHARACTERS.length];
    }
    return result;
}

export async function generateShortCode(): Promise<string> {
    let isUnique = false;
    let shortUrl = "";

    await dbConnect();

    while (!isUnique) {
        shortUrl = generateTempShortCode();

        // Reliability check: query DB to ensure uniqueness
        const existing = await QRCode.findOne({ shortUrl }).select("_id").lean();

        if (!existing) {
            isUnique = true;
        }
    }

    return shortUrl;
}
