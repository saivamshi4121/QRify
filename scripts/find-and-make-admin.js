/**
 * Script to find a user and make them admin
 * 
 * Usage:
 * node scripts/find-and-make-admin.js
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

async function findAndMakeAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Connected to MongoDB\n");

        // First, list all users
        console.log("📋 All users in database:");
        console.log("=" .repeat(50));
        const allUsers = await User.find({}).select("name email role subscriptionPlan").lean();
        
        if (allUsers.length === 0) {
            console.log("❌ No users found in database");
            process.exit(1);
        }

        allUsers.forEach((user, index) => {
            console.log(`${index + 1}. ${user.name || "No name"} (${user.email})`);
            console.log(`   Role: ${user.role} | Plan: ${user.subscriptionPlan}`);
        });

        // Try to find the user
        const searchEmail = "admin01@gmail.com";
        console.log(`\n🔍 Searching for: ${searchEmail}`);
        
        // Try exact match
        let user = await User.findOne({ email: searchEmail });
        
        // Try case-insensitive match
        if (!user) {
            user = await User.findOne({ email: new RegExp(`^${searchEmail}$`, "i") });
        }

        if (!user) {
            console.log(`\n❌ User with email "${searchEmail}" not found`);
            console.log("\n💡 Try one of these emails from the list above, or check for typos.");
            console.log("\n📝 To make a user admin, use:");
            console.log(`   db.users.updateOne({ email: "actual-email@example.com" }, { $set: { role: "admin" } })`);
            process.exit(1);
        }

        console.log(`\n✅ Found user: ${user.name || "No name"} (${user.email})`);
        console.log(`   Current role: ${user.role}`);

        // Update to admin
        const updatedUser = await User.findOneAndUpdate(
            { email: user.email },
            { $set: { role: "admin" } },
            { new: true }
        );

        console.log(`\n✅ Successfully made user admin!`);
        console.log(`   Name: ${updatedUser.name || "N/A"}`);
        console.log(`   Email: ${updatedUser.email}`);
        console.log(`   Role: ${updatedUser.role}`);
        console.log(`\n🚀 You can now access the admin portal at: http://localhost:3000/admin`);
        console.log(`   (Make sure to logout and login again to refresh your session)`);

        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
}

findAndMakeAdmin();





