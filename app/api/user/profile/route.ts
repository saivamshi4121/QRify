import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/config/dbConnect";
import User from "@/models/User";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { updateProfileSchema } from "@/lib/validation/schemas";
import { handleApiError } from "@/core/errors/handleApiError";
import { UnauthorizedError, NotFoundError, AppError } from "@/core/errors/AppError";

export async function PATCH(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            throw new UnauthorizedError("Unauthorized");
        }

        await dbConnect();
        const body = await request.json();
        const { name, email } = updateProfileSchema.parse(body);

        const existingUser = await User.findOne({
            email: email.toLowerCase().trim(),
            _id: { $ne: session.user.id }
        });

        if (existingUser) {
            throw new AppError(409, "CONFLICT", "Email is already taken by another account");
        }

        const updatedUser = await User.findByIdAndUpdate(
            session.user.id,
            {
                name: name.trim(),
                email: email.toLowerCase().trim(),
            },
            { new: true }
        ).select("-password");

        if (!updatedUser) {
            throw new NotFoundError("User not found");
        }

        return NextResponse.json({
            success: true,
            message: "Profile updated successfully",
            data: {
                name: updatedUser.name,
                email: updatedUser.email,
            },
        });

    } catch (error) {
        return handleApiError(error, "Profile Update Error");
    }
}
