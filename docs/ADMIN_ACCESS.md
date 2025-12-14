# Admin Portal Access Guide

## How to Access Admin Portal

### Admin Login Page
- **Admin Login**: `http://localhost:3000/admin/login`
- **Dedicated admin login page** with admin-themed design
- Only admin users can successfully log in
- Non-admin users will see "Access denied" error

### Admin Portal URLs
- **Admin Portal**: `http://localhost:3000/admin`
- **User Management**: `http://localhost:3000/admin/users`
- **QR Oversight**: `http://localhost:3000/admin/qrs`

### Requirements
- User must have `role: "admin"` in the database
- User must log in through `/admin/login` or regular login
- Admin login validates admin role before allowing access

---

## Admin Credentials

**⚠️ There are NO default admin credentials!**

You need to either:
1. **Create a new admin account** (recommended for first-time setup)
2. **Promote an existing user to admin**

---

## How to Create an Admin Account

### Method 1: Using the Script (Easiest)

1. Edit `scripts/create-admin.js`
2. Update the email, password, and name:
   ```javascript
   const adminEmail = "admin@smartqr.com";  // Your admin email
   const adminPassword = "YourSecurePassword123!";  // Your admin password
   const adminName = "Admin User";  // Admin name
   ```
3. Run:
   ```bash
   node scripts/create-admin.js
   ```
4. Use the credentials to login at `/admin/login`

### Method 2: Create Account + Make Admin

1. **Create a regular account**:
   - Go to `/signup` or register via the app
   - Use any email and password
   
2. **Make it admin** (see "How to Make a User an Admin" below)

---

## How to Make a User an Admin

### Method 1: Using MongoDB Directly (Recommended)

**Step 1: Find your user email first**

```javascript
// List all users to find the correct email
db.users.find({}, { email: 1, name: 1, role: 1 }).pretty()
```

**Step 2: Update the user to admin**

```javascript
// Replace with the ACTUAL email from Step 1
db.users.updateOne(
  { email: "actual-email@example.com" },  // Use exact email from database
  { $set: { role: "admin" } }
)
```

**Important Notes:**
- Email must match EXACTLY (case-sensitive)
- Check for any typos or extra spaces
- If `matchedCount: 0`, the email doesn't exist - use Step 1 to find correct email

### Method 2: Using the Script

1. Edit `scripts/make-admin.js`
2. Update the `userEmail` variable with the user's email
3. Run:
```bash
node scripts/make-admin.js
```

### Method 3: Via Admin Portal (if you already have admin access)

1. Go to `/admin/users`
2. Find the user in the table
3. Change their "Role" dropdown from "User" to "Admin"
4. The change is saved automatically

---

## Admin Portal Features

### 1. User Management (`/admin/users`)
- View all users
- Change user roles (user/admin)
- Change subscription plans (free/pro/business)
- View user status (active/inactive)
- See join dates

### 2. QR Oversight (`/admin/qrs`)
- View all QR codes in the system
- See QR owners
- View scan counts
- Check QR status (active/disabled)
- Preview QR codes

### 3. System Maintenance
- Purge invalid QR codes (via API)
- Database cleanup and hygiene

**📖 For complete details, see `ADMIN_CAPABILITIES.md`**

---

## Security

- Middleware protects `/admin/*` routes
- Only users with `role: "admin"` can access
- Non-admin users are redirected to `/dashboard`
- All admin API routes check for admin role

---

## Quick Setup

**To make yourself admin (if you're the first user):**

1. **First, find all users to see the correct email:**
```javascript
db.users.find({}, { email: 1, name: 1, role: 1 }).pretty()
```

2. **Then update with the ACTUAL email from Step 1:**
```javascript
db.users.updateOne(
  { email: "actual-email-from-step-1@example.com" },
  { $set: { role: "admin" } }
)
```

3. **Verify it worked (should show `modifiedCount: 1`):**
```javascript
db.users.findOne({ email: "your-email@example.com" }, { role: 1 })
```

4. Logout and login again
5. Visit `http://localhost:3000/admin`

---

## Troubleshooting

**If you get `matchedCount: 0`:**
- The email doesn't exist in the database
- Run `db.users.find({}, { email: 1, name: 1 }).pretty()` to see all emails
- Check for typos, case sensitivity, or extra spaces
- Use the exact email from the database



