import { NextResponse } from "next/server";
import dbConnect from "@/config/dbConnect";
import User from "@/models/User";

export async function GET() {
    try {
        await dbConnect();

        // Check if there are any users, if not create a dummy one for testing
        const userCount = await User.countDocuments();

        if (userCount === 0) {
            await User.create({
                name: "Test User",
                email: "test@example.com",
                password: "hashedpassword123", // In a real scenario, this should be hashed
                provider: "email",
                role: "admin",
                subscriptionPlan: "free",
            });
            console.log("Dummy user created for testing.");
        }

        return NextResponse.json({
            success: true,
            message: "MongoDB Connected Successfully",
        });
    } catch (error) {
        console.error("Database connection error:", error);
        return NextResponse.json(
            { success: false, message: "Database connection failed", error: String(error) },
            { status: 500 }
        );
    }
}
