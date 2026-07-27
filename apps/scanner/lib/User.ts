import mongoose, { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
    {
        name: { type: String, required: false },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: { type: String, select: false },
        provider: {
            type: String,
            enum: ["email", "google"],
            default: "email",
        },
        role: { type: String, enum: ["user", "admin"], default: "user" },
        subscriptionPlan: {
            type: String,
            enum: ["free", "pro", "business"],
            default: "free",
        },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

const User = models?.User || model("User", UserSchema);
export default User;
