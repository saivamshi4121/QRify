import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/config/dbConnect";
import User from "@/models/User";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
        }

        await dbConnect();
        const users = await User.find({}).select("-password").sort({ createdAt: -1 });

        return NextResponse.json({ success: true, data: users });
    } catch (error) {
        return NextResponse.json({ success: false, message: String(error) }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
        }

        const { userId, role, subscriptionPlan } = await request.json();
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
        return NextResponse.json({ success: false, message: String(error) }, { status: 500 });
    }
}
