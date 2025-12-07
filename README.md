# QRify SaaS

A comprehensive QR code generation and management platform built with Next.js, MongoDB, and Cloudinary.

## 🚀 Features

- **Dynamic QR Codes**: Create QR codes that can be updated without reprinting
- **Customization**: Add logos, change colors, and customize QR appearance
- **Analytics**: Track scans, locations, devices, and more
- **User Management**: Free and Pro subscription plans
- **Admin Portal**: Complete admin dashboard for user and QR management
- **Website Integration**: Embed QR codes on any website (iframe, script, React component)
- **Multiple QR Types**: URL, Text, Email, Phone, WhatsApp, WiFi, UPI

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js (Google OAuth + Email/Password)
- **Image Storage**: Cloudinary
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Payments**: Stripe & Razorpay (optional)

## 📋 Prerequisites

- Node.js 18.x or higher
- MongoDB (local or MongoDB Atlas)
- Cloudinary account
- Google OAuth credentials (for Google Sign-in)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/smart-qr-saas.git
   cd smart-qr-saas
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Fill in all required environment variables (see `.env.example`)

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)**

## 🔐 Environment Variables

Create a `.env.local` file with the following variables:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/smartqr

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Public URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

See `.env.example` for complete list.

## 📦 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for detailed deployment guide.

## 👤 Admin Setup

To create an admin account:

```bash
node scripts/create-admin.js
```

Or update user role in MongoDB:
```javascript
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "admin" } }
)
```

See [ADMIN_ACCESS.md](./ADMIN_ACCESS.md) for more details.

## 📚 Documentation

- [Admin Access Guide](./ADMIN_ACCESS.md) - How to access and use admin portal
- [Admin Capabilities](./ADMIN_CAPABILITIES.md) - What admins can do
- [Website Integration](./WEBSITE_INTEGRATION.md) - How to embed QR codes
- [Vercel Deployment](./VERCEL_DEPLOYMENT.md) - Complete deployment guide

## 🏗️ Project Structure

```
smart-qr-saas/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Dashboard pages
│   ├── admin/             # Admin portal
│   ├── api/               # API routes
│   └── embed/             # Public embed pages
├── components/             # React components
├── config/                # Configuration files
├── lib/                   # Utility functions
├── models/                # Mongoose models
├── public/                # Static files
└── scripts/               # Utility scripts
```

## 🔒 Security

- Passwords are hashed with bcrypt
- JWT-based authentication
- Protected API routes
- Environment variables for sensitive data
- CORS configured
- Rate limiting on preview API

## 📝 License

This project is private and proprietary.

## 🤝 Contributing

This is a private project. For issues or questions, contact the maintainer.

## 📞 Support

For support, check the documentation files or contact the development team.

---

**Built with ❤️ using Next.js**
