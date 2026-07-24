import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import dbConnect from "@/config/dbConnect";
import User from "@/models/User";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { changePasswordSchema } from "@/lib/validation/schemas";
import { handleApiError } from "@/core/errors/handleApiError";
import {
    UnauthorizedError,
    NotFoundError,
    BadRequestError,
} from "@/core/errors/AppError";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            throw new UnauthorizedError("Unauthorized");
        }

        await dbConnect();
        const body = await request.json();
        const { currentPassword, newPassword } = changePasswordSchema.parse(body);

        const user = await User.findById(session.user.id).select("+password");

        if (!user) {
            throw new NotFoundError("User not found");
        }

        if (!user.password) {
            throw new BadRequestError("Password change not available for Google accounts");
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            throw new UnauthorizedError("Current password is incorrect");
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await User.findByIdAndUpdate(session.user.id, {
            password: hashedPassword,
        });

        return NextResponse.json({
            success: true,
            message: "Password changed successfully",
        });

    } catch (error) {
        return handleApiError(error, "Change Password Error");
    }
}
