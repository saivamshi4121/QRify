import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/config/dbConnect";
import User from "@/models/User";

export async function POST(request: Request) {
    try {
        await dbConnect();
        const body = await request.json();
        const { name, email, password } = body;

        // Validate
        if (!name || !email || !password) {
            return NextResponse.json(
                { success: false, message: "Missing required fields" },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { success: false, message: "Password must be at least 6 characters" },
                { status: 400 }
            );
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json(
                { success: false, message: "Email already registered" },
                { status: 409 }
            );
        }

        // Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create User
        await User.create({
            name,
            email,
            password: hashedPassword,
            provider: "email",
            role: "user",
            subscriptionPlan: "free",
        });

        return NextResponse.json({
            success: true,
            message: "User registered successfully",
        });

    } catch (error) {
        console.error("Signup Error:", error);
        return NextResponse.json(
            { success: false, message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
