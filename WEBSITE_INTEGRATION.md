# Website Integration Guide

SmartQR provides multiple ways to embed your QR codes on any website. Choose the method that best fits your needs.

---

## 🎯 Quick Access

To get integration code for any QR code:
1. Go to **My QR Codes** (`/qrs`)
2. Click on any QR code thumbnail
3. Click the **"Website Integration"** tab
4. Copy the code you need

---

## 📋 Integration Methods

### 1. iframe Embed

**Best for**: Simple HTML websites, WordPress, CMS platforms

**How to use**:
```html
<iframe src="https://yourdomain.com/embed/{shortUrl}" width="400" height="400" frameborder="0" style="border: none;"></iframe>
```

**Example**:
```html
<iframe src="https://smartqr.com/embed/abc123" width="400" height="400" frameborder="0" style="border: none;"></iframe>
```

**Customization**:
- Adjust `width` and `height` to fit your design
- The QR code will automatically scale to fit the iframe

---

### 2. Script Embed

**Best for**: Dynamic websites, JavaScript-heavy applications

**How to use**:
```html
<!-- 1. Add a container div -->
<div id="smartqr-embed-{shortUrl}"></div>

<!-- 2. Load the embed script -->
<script src="https://yourdomain.com/embed.js" data-shorturl="{shortUrl}"></script>
```

**Example**:
```html
<div id="smartqr-embed-abc123"></div>
<script src="https://smartqr.com/embed.js" data-shorturl="abc123"></script>
```

**Custom Container**:
```html
<div id="my-custom-qr-container"></div>
<script src="https://smartqr.com/embed.js" data-shorturl="abc123" data-selector="#my-custom-qr-container"></script>
```

**Features**:
- Automatically loads and displays the QR code
- Responsive and mobile-friendly
- No iframe restrictions

---

### 3. Direct Image URL

**Best for**: Simple img tags, email templates, static sites

**How to use**:
```html
<img src="https://yourdomain.com/api/qr/embed/{shortUrl}" alt="QR Code" />
```

**Example**:
```html
<img src="https://smartqr.com/api/qr/embed/abc123" alt="QR Code" style="max-width: 300px;" />
```

**Note**: This requires the QR code to be active. For static images, use the `qrImageUrl` from your dashboard.

---

### 4. React / Next.js Component

**Best for**: React, Next.js, and modern JavaScript frameworks

**Installation** (if using as a package):
```bash
npm install @smartqr/react
```

**Usage**:
```tsx
import { SmartQR } from '@smartqr/react';

function MyPage() {
  return (
    <div>
      <h1>Scan this QR code</h1>
      <SmartQR shortUrl="abc123" />
    </div>
  );
}
```

**Or use the local component**:
```tsx
import SmartQR from '@/components/SmartQR';

function MyPage() {
  return (
    <div>
      <SmartQR shortUrl="abc123" width={300} height={300} />
    </div>
  );
}
```

**Component Props**:
- `shortUrl` (required): The short URL of your QR code
- `className` (optional): CSS classes for styling
- `width` (optional): Image width in pixels
- `height` (optional): Image height in pixels

---

## 🔧 API Endpoint

For custom integrations, you can use the embed API directly:

**Endpoint**: `GET /api/qr/embed/{shortUrl}`

**Response**:
```json
{
  "success": true,
  "data": {
    "qrImageUrl": "https://cloudinary.com/...",
    "qrName": "My QR Code",
    "shortUrl": "abc123"
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "message": "QR code not found or inactive"
}
```

---

## 📱 Responsive Design

All embed methods are responsive by default:

**iframe**:
```html
<iframe 
  src="https://yourdomain.com/embed/{shortUrl}" 
  width="100%" 
  height="400" 
  style="max-width: 400px; border: none;"
></iframe>
```

**Script Embed**:
The script automatically makes the QR code responsive. Add custom CSS if needed:
```css
#smartqr-embed-{shortUrl} img {
  max-width: 100%;
  height: auto;
}
```

**React Component**:
```tsx
<SmartQR 
  shortUrl="abc123" 
  className="w-full max-w-md mx-auto"
/>
```

---

## 🎨 Styling Options

### iframe Styling
```html
<iframe 
  src="https://yourdomain.com/embed/{shortUrl}"
  style="
    width: 300px;
    height: 300px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  "
></iframe>
```

### Script Embed Styling
```html
<div 
  id="smartqr-embed-{shortUrl}"
  style="
    display: flex;
    justify-content: center;
    padding: 20px;
    background: #f9fafb;
    border-radius: 8px;
  "
></div>
```

---

## 🔒 Security & Privacy

- **Public Access**: Embed endpoints are public (no authentication required)
- **Active QR Only**: Only active QR codes can be embedded
- **CORS**: Embed API supports CORS for cross-origin requests
- **Rate Limiting**: Standard rate limits apply

---

## 🐛 Troubleshooting

### QR Code Not Showing

1. **Check if QR is active**: Inactive QR codes won't display
2. **Verify shortUrl**: Make sure the `shortUrl` is correct
3. **Check console**: Look for JavaScript errors in browser console
4. **CORS issues**: If embedding on a different domain, ensure CORS is enabled

### iframe Not Loading

1. **Check URL**: Ensure the embed URL is correct
2. **X-Frame-Options**: Some sites block iframes - use script embed instead
3. **HTTPS**: Use HTTPS URLs for secure sites

### Script Embed Not Working

1. **Container exists**: Make sure the container div exists before script loads
2. **Script order**: Load the script after the container div
3. **data-shorturl**: Verify the `data-shorturl` attribute is set correctly

---

## 📚 Examples

### WordPress
```html
<!-- Add to a WordPress post/page -->
<iframe src="https://smartqr.com/embed/abc123" width="300" height="300" frameborder="0"></iframe>
```

### Shopify
```liquid
<!-- In a Shopify theme -->
<div id="smartqr-embed-abc123"></div>
<script src="https://smartqr.com/embed.js" data-shorturl="abc123"></script>
```

### React App
```tsx
import SmartQR from '@/components/SmartQR';

export default function ProductPage() {
  return (
    <div className="product">
      <h1>Product Name</h1>
      <SmartQR shortUrl="abc123" width={200} height={200} />
    </div>
  );
}
```

### Static HTML
```html
<!DOCTYPE html>
<html>
<head>
  <title>My Page</title>
</head>
<body>
  <h1>Scan to Connect</h1>
  <div id="smartqr-embed-abc123"></div>
  <script src="https://smartqr.com/embed.js" data-shorturl="abc123"></script>
</body>
</html>
```

---

## 🚀 Best Practices

1. **Use HTTPS**: Always use HTTPS URLs for security
2. **Responsive Design**: Make sure embeds work on mobile devices
3. **Loading States**: Show a loading indicator while QR code loads
4. **Error Handling**: Handle cases where QR code might not load
5. **Performance**: Use direct image URL for static sites to reduce JavaScript

---

## 📞 Support

For integration help:
- Check the integration tab in your QR code dashboard
- Review this documentation
- Contact support if you encounter issues

---

## 🔄 Updates

QR codes update automatically when you change the destination URL. No need to update embed code!

