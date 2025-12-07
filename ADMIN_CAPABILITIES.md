# Admin Portal Capabilities

## Overview
Admins have full system oversight and management capabilities. The admin portal provides a centralized dashboard for managing users, QR codes, and system health.

---

## 🔐 Access Requirements

- **Role**: User must have `role: "admin"` in the database
- **Authentication**: Must be logged in
- **URL**: `http://localhost:3000/admin`

---

## 👥 User Management (`/admin/users`)

### View All Users
- See complete list of all registered users
- View user details:
  - Name and email
  - Account status (Active/Inactive)
  - Current role (User/Admin)
  - Subscription plan (Free/Pro/Business)
  - Join date
- Total user count

### Manage User Roles
- **Change user roles** between:
  - `user` - Regular user
  - `admin` - Admin privileges
- Changes are saved immediately
- Can promote any user to admin
- Can demote admins to regular users

### Manage Subscription Plans
- **Upgrade/Downgrade user plans**:
  - `free` - Free plan (3 QR codes limit)
  - `pro` - Pro plan (5 QR codes limit)
  - `business` - Business plan
- Changes take effect immediately
- Useful for:
  - Manual upgrades
  - Promotional access
  - Support requests

### View User Status
- See which users are active or inactive
- Monitor account health

---

## 📱 QR Code Oversight (`/admin/qrs`)

### View All QR Codes
- See every QR code in the system
- View comprehensive details:
  - QR code name
  - Original data/content
  - Owner information (name & email)
  - Total scan count
  - Active/Disabled status
  - Creation date
  - QR image preview

### Monitor QR Performance
- Track scan statistics across all users
- Identify popular QR codes
- View QR code status (Active/Disabled)

### System-Wide Analytics
- Total QR codes generated
- Scan counts per QR
- User activity patterns

---

## 🛠️ System Maintenance

### Purge Invalid QR Codes
**API Endpoint**: `POST /api/admin/purge-invalid-qrs`

- **Purpose**: Database hygiene and cleanup
- **What it does**: Deletes QR codes that are missing critical fields:
  - QR codes without `shortUrl`
  - QR codes with empty `shortUrl`
  - QR codes without `originalData`
- **Use case**: Clean up corrupted or incomplete QR codes
- **Access**: Admin-only API endpoint

**Example Usage:**
```bash
curl -X POST http://localhost:3000/api/admin/purge-invalid-qrs \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

---

## 🔒 Security & Permissions

### Protected Routes
All admin routes are protected by middleware:
- `/admin/*` - All admin pages
- `/api/admin/*` - All admin API endpoints

### Access Control
- **Non-admin users**: Automatically redirected to `/dashboard`
- **API routes**: Return `403 Forbidden` if not admin
- **Session validation**: All requests verify admin role

### What Admins CANNOT Do
- ❌ Cannot delete users (not implemented)
- ❌ Cannot delete QR codes directly (not implemented)
- ❌ Cannot modify QR code content
- ❌ Cannot access user passwords (passwords are hashed)

---

## 📊 Admin Dashboard Features

### Navigation
- **Sidebar Navigation**:
  - User Management
  - QR Oversight
  - Exit to App (return to regular dashboard)
  - Sign Out

### Real-Time Updates
- Changes to user roles/plans save immediately
- Optimistic UI updates for better UX
- Automatic refresh on errors

### Data Display
- Clean, organized tables
- Sortable columns
- Status indicators (Active/Inactive badges)
- External links for QR previews

---

## 🎯 Common Admin Tasks

### 1. Promote User to Admin
1. Go to `/admin/users`
2. Find the user
3. Change "Role" dropdown from "User" to "Admin"
4. Done! User can now access admin portal

### 2. Upgrade User to Pro Plan
1. Go to `/admin/users`
2. Find the user
3. Change "Plan" dropdown from "Free" to "Pro"
4. User immediately gets 5 QR code limit

### 3. Monitor System Health
1. Go to `/admin/qrs`
2. Check total QR codes
3. Review scan counts
4. Identify inactive/problematic QRs

### 4. Clean Up Database
1. Use purge API endpoint
2. Remove invalid QR codes
3. Maintain database integrity

---

## 🔍 API Endpoints (Admin Only)

### User Management
- `GET /api/admin/users` - Get all users
- `PATCH /api/admin/users` - Update user role or plan

### QR Oversight
- `GET /api/admin/qrs` - Get all QR codes with user details

### System Maintenance
- `POST /api/admin/purge-invalid-qrs` - Clean up invalid QR codes

---

## 📝 Best Practices

1. **Regular Monitoring**: Check `/admin/qrs` regularly to monitor system usage
2. **User Support**: Use role/plan changes to help users quickly
3. **Database Health**: Periodically purge invalid QR codes
4. **Security**: Only grant admin access to trusted users
5. **Audit Trail**: Consider logging admin actions (future feature)

---

## 🚀 Future Admin Features (Potential)

- User deletion
- QR code deletion
- Bulk operations
- Advanced analytics dashboard
- System logs and audit trail
- Email notifications for admin actions
- Export user/QR data
- Rate limiting management
- Feature flags

---

## ⚠️ Important Notes

- **Admin privileges are powerful**: Admins can change any user's role or plan
- **No undo**: Changes are immediate and permanent (no confirmation dialogs yet)
- **Session refresh**: Users may need to logout/login after role changes
- **Database access**: Admins have read/write access to all user data

---

## 📞 Support

If you need to:
- **Become an admin**: Follow instructions in `ADMIN_ACCESS.md`
- **Report issues**: Check logs and database
- **Request features**: Document what you need

