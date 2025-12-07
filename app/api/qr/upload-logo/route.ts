import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("logo") as File;

        if (!file) {
            return NextResponse.json(
                { success: false, message: "No file provided" },
                { status: 400 }
            );
        }

        // Validate file type
        if (!file.type.startsWith("image/")) {
            return NextResponse.json(
                { success: false, message: "File must be an image" },
                { status: 400 }
            );
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            return NextResponse.json(
                { success: false, message: "File must be less than 2MB" },
                { status: 400 }
            );
        }

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to Cloudinary
        const uploadResponse = await new Promise<any>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: "smart-qr/logos",
                    resource_type: "image",
                    transformation: [
                        { width: 500, height: 500, crop: "limit" },
                        { quality: "auto" },
                    ],
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            uploadStream.end(buffer);
        });

        return NextResponse.json({
            success: true,
            logoUrl: uploadResponse.secure_url,
        });

    } catch (error) {
        console.error("Logo Upload Error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to upload logo" },
            { status: 500 }
        );
    }
}

