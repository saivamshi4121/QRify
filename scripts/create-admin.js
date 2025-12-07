/**
 * Script to create a new admin account
 * 
 * Usage:
 * 1. Update the email and password below
 * 2. Run: node scripts/create-admin.js
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
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

async function createAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Connected to MongoDB\n");

        // ⬇️ UPDATE THESE VALUES ⬇️
        const adminEmail = "admin@smartqr.com";  // Change this
        const adminPassword = "Admin123";        // Change this
        const adminName = "Admin User";           // Change this
        // ⬆️ UPDATE THESE VALUES ⬆️

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: adminEmail });
        if (existingAdmin) {
            console.log(`⚠️  User with email "${adminEmail}" already exists`);
            console.log(`   Current role: ${existingAdmin.role}`);
            
            if (existingAdmin.role === "admin") {
                console.log(`\n✅ This user is already an admin!`);
                console.log(`   Email: ${adminEmail}`);
                console.log(`   You can login at: http://localhost:3000/admin/login`);
                process.exit(0);
            } else {
                // Update to admin
                existingAdmin.role = "admin";
                await existingAdmin.save();
                console.log(`\n✅ Updated existing user to admin!`);
                console.log(`   Email: ${adminEmail}`);
                console.log(`   Role: ${existingAdmin.role}`);
                console.log(`\n🚀 You can now login at: http://localhost:3000/admin/login`);
                console.log(`   Password: (your existing password)`);
                process.exit(0);
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        // Create admin user
        const admin = await User.create({
            name: adminName,
            email: adminEmail,
            password: hashedPassword,
            provider: "email",
            role: "admin",
            subscriptionPlan: "free",
            isActive: true,
        });

        console.log(`✅ Admin account created successfully!`);
        console.log(`\n📋 Admin Credentials:`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   Password: ${adminPassword}`);
        console.log(`   Name: ${admin.name}`);
        console.log(`   Role: ${admin.role}`);
        console.log(`\n🚀 Login at: http://localhost:3000/admin/login`);
        console.log(`\n⚠️  IMPORTANT: Change the password after first login!`);

        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error);
        if (error.code === 11000) {
            console.error("   Email already exists. Use a different email or run the script to update existing user.");
        }
        process.exit(1);
    }
}

createAdmin();

