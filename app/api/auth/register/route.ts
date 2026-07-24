import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/config/dbConnect";
import User from "@/models/User";
import { registerSchema } from "@/lib/validation/schemas";
import { handleApiError } from "@/core/errors/handleApiError";
import { AppError } from "@/core/errors/AppError";

export async function POST(request: Request) {
    try {
        await dbConnect();
        const body = await request.json();
        const { name, email, password } = registerSchema.parse(body);

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new AppError(409, "CONFLICT", "Email already registered");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            provider: "email",
            role: "user",
            subscriptionPlan: "free",
        });

        const { ensureDefaultWorkspace } = await import("@/modules/workspace/service");
        await ensureDefaultWorkspace(user._id.toString());

        return NextResponse.json({
            success: true,
            message: "User registered successfully",
        });

    } catch (error) {
        return handleApiError(error, "Signup Error");
    }
}
