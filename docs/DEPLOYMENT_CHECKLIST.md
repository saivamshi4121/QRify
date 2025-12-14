# 🚀 Deployment Checklist

Complete checklist before deploying to Vercel.

## ✅ Code Quality

- [x] All TypeScript errors resolved
- [x] No console errors in browser
- [x] All API routes tested
- [x] Environment variables use `process.env` (no hardcoded values)
- [x] `.gitignore` properly configured
- [x] No sensitive data in code

## ✅ Environment Variables

Ensure these are set in Vercel:

### Required
- [ ] `MONGODB_URI` - MongoDB connection string
- [ ] `NEXTAUTH_URL` - Your production URL (e.g., `https://your-app.vercel.app`)
- [ ] `NEXTAUTH_SECRET` - Strong secret key (generate with `openssl rand -base64 32`)
- [ ] `NEXT_PUBLIC_APP_URL` - Your production URL
- [ ] `GOOGLE_CLIENT_ID` - Google OAuth client ID
- [ ] `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- [ ] `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- [ ] `CLOUDINARY_API_KEY` - Cloudinary API key
- [ ] `CLOUDINARY_API_SECRET` - Cloudinary API secret
- [ ] `NODE_ENV` - Set to `production`

### Optional (if using payments)
- [ ] `STRIPE_SECRET_KEY` - Stripe secret key
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- [ ] `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- [ ] `RAZORPAY_KEY_ID` - Razorpay key ID
- [ ] `RAZORPAY_KEY_SECRET` - Razorpay key secret

## ✅ External Services Configuration

### Google OAuth
- [ ] Authorized redirect URI added: `https://your-domain.vercel.app/api/auth/callback/google`
- [ ] Using production OAuth credentials (not test)

### MongoDB
- [ ] Database accessible from Vercel (IP whitelist: `0.0.0.0/0` or Vercel IPs)
- [ ] Database user has proper permissions
- [ ] Connection string is production-ready

### Cloudinary
- [ ] Production API keys configured
- [ ] Upload presets configured (if needed)

### Stripe (if using)
- [ ] Webhook endpoint configured: `https://your-domain.vercel.app/api/payments/stripe/webhook`
- [ ] Using live keys (not test keys)
- [ ] Webhook events configured

## ✅ Build & Test

- [ ] `npm run build` succeeds locally
- [ ] No build warnings or errors
- [ ] All pages load correctly
- [ ] API routes respond correctly
- [ ] Authentication works
- [ ] QR code generation works
- [ ] QR code scanning works
- [ ] Admin portal accessible
- [ ] Embed functionality works

## ✅ Security

- [ ] All `.env` files in `.gitignore`
- [ ] No API keys in code
- [ ] Strong `NEXTAUTH_SECRET` generated
- [ ] Database password is strong
- [ ] CORS properly configured
- [ ] Rate limiting enabled (where needed)

## ✅ Git Repository

- [ ] All code committed
- [ ] Repository pushed to GitHub/GitLab
- [ ] `.gitignore` includes all sensitive files
- [ ] No large files in repository
- [ ] Clean commit history

## ✅ Vercel Configuration

- [ ] Project imported from GitHub
- [ ] Framework preset: Next.js
- [ ] Build command: `npm run build` (auto-detected)
- [ ] Output directory: `.next` (auto-detected)
- [ ] Node.js version: 18.x or 20.x
- [ ] All environment variables added
- [ ] Custom domain configured (if using)

## ✅ Post-Deployment

- [ ] Homepage loads
- [ ] Sign up works
- [ ] Sign in works (email & Google)
- [ ] QR code creation works
- [ ] QR code scanning works
- [ ] Analytics display correctly
- [ ] Admin portal accessible
- [ ] Embed codes work
- [ ] Error pages work (404, 500)
- [ ] Mobile responsive

## ✅ Monitoring

- [ ] Vercel Analytics enabled
- [ ] Error tracking set up
- [ ] Logs accessible
- [ ] Performance monitoring enabled

## 📝 Notes

- Test all features after deployment
- Monitor logs for first 24 hours
- Set up database backups
- Configure custom domain if needed
- Update documentation with production URLs

---

**Ready to deploy? Follow [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for step-by-step instructions.**







