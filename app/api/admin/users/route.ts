import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/config/dbConnect";
import User from "@/models/User";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { adminUpdateUserSchema } from "@/lib/validation/schemas";
import { handleApiError } from "@/core/errors/handleApiError";
import { ForbiddenError } from "@/core/errors/AppError";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "admin") {
            throw new ForbiddenError("Unauthorized");
        }

        await dbConnect();
        const users = await User.find({}).select("-password").sort({ createdAt: -1 });

        return NextResponse.json({ success: true, data: users });
    } catch (error) {
        return handleApiError(error, "Admin Users GET Error");
    }
}

export async function PATCH(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "admin") {
            throw new ForbiddenError("Unauthorized");
        }

        const body = await request.json();
        const { userId, role, subscriptionPlan } = adminUpdateUserSchema.parse(body);
        await dbConnect();

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                ...(role && { role }),
                ...(subscriptionPlan && { subscriptionPlan }),
            },
            { new: true }
        ).select("-password");

        return NextResponse.json({ success: true, data: updatedUser });
    } catch (error) {
        return handleApiError(error, "Admin Users PATCH Error");
    }
}
