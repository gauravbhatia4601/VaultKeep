# Dynamic Share URLs Implementation

## Overview

The share document feature now generates dynamic URLs based on the actual request, eliminating the hardcoded `localhost:3000` limitation. This ensures share links work correctly in any environment.

## Implementation Details

### File Modified
`app/api/folders/[id]/documents/[docId]/share/route.ts`

### How It Works

```typescript
// Generate shareable URL dynamically based on request
const host = request.headers.get('host') || 'localhost:3000';
const protocol = request.headers.get('x-forwarded-proto') || 
                (host.includes('localhost') ? 'http' : 'https');
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
const shareUrl = `${baseUrl}/share/${shareToken}`;
```

### Priority Order

1. `NEXT_PUBLIC_APP_URL` environment variable (highest priority)
   - If set, always uses this URL
   - Best for production with custom domains
   - Example: `https://vault.yourdomain.com`

2. Dynamic detection from request headers
   - Uses `host` header from the incoming request
   - Uses `x-forwarded-proto` header for protocol detection
   - Automatically detects:
     - Development: `http://localhost:3000`
     - Production: `https://yourdomain.com`
     - Custom ports: `http://localhost:8080`
     - Reverse proxy setups via `x-forwarded-proto`

3. Fallback
   - If no headers available: `localhost:3000`

## Environment Configuration

### Development (No Config Needed)
The app automatically detects the development URL:
```
# No NEXT_PUBLIC_APP_URL needed
# Automatically uses: http://localhost:3000
```

### Production (Optional Config)
You can optionally set a fixed URL in `.env.local` or `.env.production`:
```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Examples

### Development Environment
Request from: `http://localhost:3000`
Generated share link: `http://localhost:3000/share/abc123...`

### Development with Custom Port
Request from: `http://localhost:8080`
Generated share link: `http://localhost:8080/share/abc123...`

### Production
Request from: `https://vault.example.com`
Generated share link: `https://vault.example.com/share/abc123...`

### Production with Environment Variable
Config: `NEXT_PUBLIC_APP_URL=https://files.mycompany.com`
Generated share link: `https://files.mycompany.com/share/abc123...`

### Behind Reverse Proxy
Request headers:
```
Host: vault.company.com
X-Forwarded-Proto: https
```
Generated share link: `https://vault.company.com/share/abc123...`

## Protocol Detection

### HTTP vs HTTPS
The system automatically determines the correct protocol:

1. If `x-forwarded-proto` header exists → Use that value
2. If host contains "localhost" → Use `http`
3. Otherwise → Use `https` (production default)

This ensures:
- ✅ Development uses HTTP (localhost)
- ✅ Production uses HTTPS (secure)
- ✅ Reverse proxies work correctly

## Benefits

### 1. Works Everywhere
- ✅ Local development
- ✅ Staging environments
- ✅ Production deployments
- ✅ Custom domains
- ✅ Different ports

### 2. No Configuration Required
- ✅ Zero config for development
- ✅ Automatically adapts to environment
- ✅ Optional override for special cases

### 3. Secure by Default
- ✅ Production automatically uses HTTPS
- ✅ Respects reverse proxy headers
- ✅ Falls back to secure defaults

### 4. Flexible Deployment
- ✅ Deploy to any domain
- ✅ No hardcoded URLs to change
- ✅ Preview deployments work automatically

## Testing

### Local Development
```bash
# Start dev server
npm run dev

# Create share link - should generate:
# http://localhost:3000/share/{token}
```

### Custom Port
```bash
# Start with custom port
PORT=8080 npm run dev

# Share link should generate:
# http://localhost:8080/share/{token}
```

### Production
```bash
# Deploy to production
# Share links automatically use your domain:
# https://yourdomain.com/share/{token}
```

### With Environment Variable
```bash
# .env.production
NEXT_PUBLIC_APP_URL=https://vault.mycompany.com

# All share links will use:
# https://vault.mycompany.com/share/{token}
```

## Reverse Proxy Configuration

If you're using a reverse proxy (Nginx, Apache, etc.), ensure it passes the correct headers:

### Nginx Example
```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

### Apache Example
```apache
ProxyPass / http://localhost:3000/
ProxyPassReverse / http://localhost:3000/
RequestHeader set X-Forwarded-Proto "https"
RequestHeader set Host %{HTTP_HOST}e
```

### Cloudflare / CDN
Cloudflare and most CDNs automatically set these headers:
- ✅ `Host` - The requested domain
- ✅ `X-Forwarded-Proto` - The original protocol (http/https)

## Deployment Platforms

### Vercel
No configuration needed. Automatically detects:
- ✅ Production domain
- ✅ Preview deployments
- ✅ Custom domains

### Netlify
No configuration needed. Works automatically with:
- ✅ Main site
- ✅ Branch deploys
- ✅ Custom domains

### Railway / Render / Fly.io
Automatically detects the assigned domain:
- ✅ Platform-provided URLs
- ✅ Custom domains

### Self-Hosted
Two options:
1. Auto-detect (recommended): No config needed
2. Fixed URL: Set `NEXT_PUBLIC_APP_URL` for consistency

## Troubleshooting

### Issue: Share links use localhost in production

Solution:
Set the environment variable:
```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Issue: Wrong protocol (http instead of https)

Possible causes:
1. Reverse proxy not passing `x-forwarded-proto` header
2. Load balancer configuration

Solution:
Ensure your reverse proxy/load balancer passes the correct headers.

### Issue: Share links use internal IP/hostname

Solution:
Set `NEXT_PUBLIC_APP_URL` to your public domain:
```env
NEXT_PUBLIC_APP_URL=https://public.domain.com
```

### Issue: Different domains for different features

Solution:
Use the environment variable to force a specific domain:
```env
NEXT_PUBLIC_APP_URL=https://main.domain.com
```

## Migration from Previous Version

### Before (Hardcoded)
```typescript
const shareUrl = `http://localhost:3000/share/${shareToken}`;
```
❌ Only worked in development
❌ Broke in production
❌ Required manual changes for deployment

### After (Dynamic)
```typescript
const host = request.headers.get('host') || 'localhost:3000';
const protocol = request.headers.get('x-forwarded-proto') || 
                (host.includes('localhost') ? 'http' : 'https');
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
const shareUrl = `${baseUrl}/share/${shareToken}`;
```
✅ Works everywhere automatically
✅ Production ready
✅ No configuration needed
✅ Optional override available

## Best Practices

### Development
```env
# No NEXT_PUBLIC_APP_URL needed
# Let the system auto-detect
```

### Staging
```env
# Optional: Force specific staging URL
NEXT_PUBLIC_APP_URL=https://staging.yourdomain.com
```

### Production
```env
# Optional: Force specific production URL
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Multi-Environment
Use different `.env` files:
- `.env.development` - Auto-detect (no config)
- `.env.staging` - Staging URL
- `.env.production` - Production URL

## Summary

✅ No hardcoded URLs - Works in any environment
✅ Auto-detection - Reads from request headers
✅ Optional override - Via `NEXT_PUBLIC_APP_URL`
✅ Protocol smart - HTTP for dev, HTTPS for prod
✅ Reverse proxy aware - Respects `x-forwarded-proto`
✅ Zero config - Works out of the box
✅ Production ready - Secure by default

The share link feature now generates correct URLs automatically, regardless of where the application is deployed!

