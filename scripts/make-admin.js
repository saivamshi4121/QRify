/**
 * Script to make a user an admin
 * 
 * Usage:
 * 1. Update the email below with the user's email
 * 2. Run: node scripts/make-admin.js
 * 
 * Or use MongoDB directly:
 * db.users.updateOne(
 *   { email: "user@example.com" },
 *   { $set: { role: "admin" } }
 * )
 */

const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, required: true, unique: true },
    password: String,
    provider: { type: String, enum: ["email", "google"], default: "email" },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    subscriptionPlan: { type: String, enum: ["free", "pro", "business"], default: "free" },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function makeAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Connected to MongoDB");

        // UPDATE THIS EMAIL to the user you want to make admin
        const userEmail = "your-email@example.com"; // ⬅️ CHANGE THIS

        // Find and update user
        const user = await User.findOneAndUpdate(
            { email: userEmail },
            { $set: { role: "admin" } },
            { new: true }
        );

        if (!user) {
            console.error(`❌ User with email "${userEmail}" not found`);
            process.exit(1);
        }

        console.log(`✅ Successfully made user admin!`);
        console.log(`   Name: ${user.name || "N/A"}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`\n🚀 You can now access the admin portal at: http://localhost:3000/admin`);

        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
}

makeAdmin();





