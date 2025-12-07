# Vercel Deployment Guide

Complete guide for deploying SmartQR SaaS to Vercel.

---

## 📋 Pre-Deployment Checklist

- [x] All environment variables documented
- [x] `.gitignore` properly configured
- [x] No hardcoded localhost URLs
- [x] Build script configured
- [x] Dependencies listed in `package.json`

---

## 🚀 Deployment Steps

### 1. Prepare Your Repository

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: SmartQR SaaS ready for deployment"

# Add your remote (replace with your repo URL)
git remote add origin https://github.com/yourusername/smart-qr-saas.git

# Push to GitHub
git push -u origin main
```

### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click **"New Project"**
4. Import your repository
5. Configure project settings

### 3. Environment Variables

Add these environment variables in Vercel Dashboard → Settings → Environment Variables:

#### Required Variables

```
MONGODB_URI=mongodb+srv://...
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-secret-key
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
NODE_ENV=production
```

#### Optional Variables (if using payments)

```
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=your-razorpay-secret
```

### 4. Build Settings

Vercel will auto-detect Next.js. Ensure these settings:

- **Framework Preset**: Next.js
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `npm install` (auto-detected)
- **Node Version**: 18.x or 20.x (recommended)

### 5. Deploy

Click **"Deploy"** and wait for the build to complete.

---

## 🔧 Post-Deployment

### 1. Update Google OAuth Redirect URIs

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** → **Credentials**
3. Edit your OAuth 2.0 Client
4. Add authorized redirect URI:
   ```
   https://your-domain.vercel.app/api/auth/callback/google
   ```

### 2. Update Stripe Webhook (if using)

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Webhooks**
3. Add endpoint: `https://your-domain.vercel.app/api/payments/stripe/webhook`
4. Copy the webhook secret to Vercel environment variables

### 3. Test Your Deployment

- [ ] Homepage loads
- [ ] Sign up works
- [ ] Google Sign-in works
- [ ] QR code creation works
- [ ] QR code scanning works
- [ ] Admin portal accessible
- [ ] Embed functionality works

---

## 🌐 Custom Domain (Optional)

1. Go to Vercel Dashboard → **Settings** → **Domains**
2. Add your custom domain
3. Update DNS records as instructed
4. Update `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to your custom domain

---

## 📊 Monitoring

### Vercel Analytics

- Enable Vercel Analytics in dashboard
- Monitor performance and errors

### Logs

- View deployment logs in Vercel Dashboard
- Check function logs for API routes

---

## 🔒 Security Checklist

- [ ] All environment variables set in Vercel (not in code)
- [ ] `.env` files in `.gitignore`
- [ ] `NEXTAUTH_SECRET` is strong and unique
- [ ] MongoDB connection string uses strong password
- [ ] Cloudinary API keys are secure
- [ ] Google OAuth credentials are production keys
- [ ] Stripe keys are live keys (not test)

---

## 🐛 Troubleshooting

### Build Fails

1. Check build logs in Vercel
2. Ensure all dependencies are in `package.json`
3. Check for TypeScript errors
4. Verify Node.js version compatibility

### Environment Variables Not Working

1. Ensure variables are set in Vercel Dashboard
2. Redeploy after adding variables
3. Check variable names match exactly (case-sensitive)
4. Restart deployment

### Database Connection Issues

1. Verify `MONGODB_URI` is correct
2. Check MongoDB Atlas IP whitelist (allow all IPs: `0.0.0.0/0`)
3. Verify database user has correct permissions

### OAuth Not Working

1. Verify redirect URIs match exactly
2. Check `NEXTAUTH_URL` matches your domain
3. Ensure Google OAuth credentials are correct

---

## 📝 Important Notes

1. **Never commit `.env` files** - They're in `.gitignore`
2. **Use production keys** - Don't use test/development keys in production
3. **Update redirect URIs** - Always update OAuth redirect URIs for production
4. **Monitor logs** - Check Vercel logs regularly for errors
5. **Backup database** - Set up regular MongoDB backups

---

## 🎯 Quick Deploy Commands

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

## ✅ Deployment Checklist

Before going live:

- [ ] All environment variables configured
- [ ] Google OAuth redirect URIs updated
- [ ] Stripe webhooks configured (if using)
- [ ] Custom domain configured (if using)
- [ ] Database backups enabled
- [ ] Error monitoring set up
- [ ] Performance monitoring enabled
- [ ] Security headers configured
- [ ] SSL certificate active (automatic with Vercel)
- [ ] Test all major features

---

**Ready to deploy? Follow the steps above and your SmartQR SaaS will be live! 🚀**

