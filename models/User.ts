import mongoose, { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
    {
        name: {
            type: String,
            required: false,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            select: false, // Don't return password by default
        },
        provider: {
            type: String,
            enum: ["email", "google"],
            default: "email",
        },
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
        },
        subscriptionPlan: {
            type: String,
            enum: ["free", "pro", "business"],
            default: "free",
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Prevent overwriting the model if it's already compiled
const User = models?.User || model("User", UserSchema);

export default User;
