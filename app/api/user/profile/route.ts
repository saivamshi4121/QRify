import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/config/dbConnect";
import User from "@/models/User";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PATCH(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        await dbConnect();
        const body = await request.json();
        const { name, email } = body;

        // Validate
        if (!name || !email) {
            return NextResponse.json(
                { success: false, message: "Name and email are required" },
                { status: 400 }
            );
        }

        // Check if email is already taken by another user
        const existingUser = await User.findOne({ 
            email: email.toLowerCase().trim(),
            _id: { $ne: session.user.id }
        });

        if (existingUser) {
            return NextResponse.json(
                { success: false, message: "Email is already taken by another account" },
                { status: 409 }
            );
        }

        // Update user
        const updatedUser = await User.findByIdAndUpdate(
            session.user.id,
            {
                name: name.trim(),
                email: email.toLowerCase().trim(),
            },
            { new: true }
        ).select("-password");

        if (!updatedUser) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
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
        console.error("Profile Update Error:", error);
        return NextResponse.json(
            { success: false, message: "Internal Server Error" },
            { status: 500 }
        );
    }
}







