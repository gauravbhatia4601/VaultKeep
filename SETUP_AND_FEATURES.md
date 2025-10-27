# VaultKeep - Setup and Features Guide

Complete guide for setting up and using VaultKeep, a secure family document storage application.

## 📋 Table of Contents

1. [Quick Setup](#quick-setup)
2. [Cloudflare R2 Configuration](#cloudflare-r2-configuration)
3. [Features Overview](#features-overview)
4. [Database Migration](#database-migration)
5. [Troubleshooting](#troubleshooting)

---

## Quick Setup

### Prerequisites
- Node.js 18+ installed
- MongoDB database
- Cloudflare R2 bucket (for storage)

### Installation

1. **Clone and Install**
```bash
git clone https://github.com/gauravbhatia4601/VaultKeep.git
cd VaultKeep
npm install
```

2. **Environment Setup**
Create a `.env.local` file in the root directory:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/vaultkeep
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vaultkeep

# JWT Secrets
JWT_SECRET=your-secret-key-here
BCRYPT_ROUNDS=12

# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_BUCKET_NAME=your-bucket-name
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com

# Optional: App URL for share links
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

3. **Run the Application**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Cloudflare R2 Configuration

### Why R2?
Cloudflare R2 provides S3-compatible object storage with zero egress fees, perfect for storing sensitive documents.

### Setup Steps

1. **Create R2 Bucket**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Navigate to R2 > Create Bucket
   - Name your bucket (e.g., `vaultkeep-docs`)

2. **Create API Token**
   - R2 > Manage R2 API Tokens
   - Create API token with Admin Read & Write permissions
   - Copy the credentials to your `.env.local`

3. **Bucket Settings**
   - Set public access if you need share links
   - Configure CORS for your domain
   - Set lifecycle rules if needed

### Quick Setup Verification
```bash
# Test R2 connection
npm run test:r2
```

---

## Features Overview

### 🔒 Password Protection (Optional PIN)
- Folders can be protected with a 4-6 digit numeric PIN
- Optional protection - folders can be left open
- Subfolders inherit parent folder protection
- Secure bcrypt hashing

### 📁 Nested Folder Structure
- Create unlimited folders and subfolders
- Maximum nesting depth: 5 levels
- Automatic folder path management
- Breadcrumb navigation

### 📤 Unified File Upload
- Automatic detection: Files or Folders
- Drag & drop support
- Batch upload with progress tracking
- Preserves folder structure
- Auto-skips hidden files (.DS_Store, .git, etc.)

### 🔍 Search Functionality
- Real-time folder search on dashboard
- Instant filtering
- Search by folder name

### 📊 Smart Display
- Compact list view for folders and documents
- Shows subfolder count and file count
- Space-efficient design
- Quick access actions

### 🔗 Document Sharing
- Generate secure share links
- Token-based access
- Expiration tracking
- Web Share API support
- Easy copy-to-clipboard

### 📱 Progressive Web App (PWA)
- Install on mobile/desktop
- Offline support
- App-like experience
- Push notifications ready

### 🎨 Modern UI with shadcn/ui
- Aceternity-styled components
- Animated backgrounds and transitions
- Glassmorphism effects
- Dark mode support
- Responsive design

---

## Database Migration

### Running Migration for Nested Folders

If you have existing folders without `path` and `level` fields:

```bash
# Connect to MongoDB and run migration
node scripts/migrate-folders.js
```

This script will:
- Find all folders missing `path` or `level`
- Calculate correct paths and levels
- Update database records

### Manual Migration
```javascript
// Connect via MongoDB shell
use vaultkeep

// Update missing fields
db.folders.updateMany(
  { $or: [{ path: { $exists: false } }, { level: { $exists: false } }] },
  { $set: { level: 0, path: "/" + "$folderName" } }
)
```

---

## Troubleshooting

### Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Clear node modules
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

### R2 Upload Issues
1. Verify credentials in `.env.local`
2. Check bucket permissions
3. Ensure CORS is configured
4. Verify network connectivity

### TypeScript Errors
The project uses TypeScript with strict mode enabled. If you see type errors:
```bash
# Type check specific files
npx tsc --noEmit

# Fix formatting
npm run lint:fix
```

### MongoDB Connection Issues
1. Verify `MONGODB_URI` is correct
2. Check network firewall
3. Test connection string in MongoDB Compass
4. Ensure database exists

### Folder Access Issues
- Verify folder token in sessionStorage
- Check browser console for errors
- Ensure API routes are accessible
- Verify authentication headers

---

## Development Tips

### File Structure
```
app/
  api/              # API routes
  dashboard/        # Dashboard pages
  folders/          # Folder views
  (auth)/           # Authentication pages

components/
  auth/             # Login/Register forms
  documents/        # Document management
  folders/          # Folder management
  ui/               # shadcn/ui components

lib/
  r2Storage.ts      # Cloudflare R2 utilities
  validation.ts     # Zod schemas
  mongodb.ts        # Database connection

models/
  Document.ts       # Document schema
  Folder.ts         # Folder schema
  User.ts           # User schema
```

### Adding New Features
1. Update `lib/validation.ts` for new schemas
2. Create API routes in `app/api/`
3. Update TypeScript interfaces
4. Add UI components in `components/`
5. Test with build: `npm run build`

### Environment Variables
All sensitive data stored in `.env.local`:
- Never commit to git
- Use strong secrets for production
- Rotate keys regularly
- Keep backups of credentials

---

## Production Deployment

### Environment Setup
1. Set production `MONGODB_URI`
2. Configure production R2 bucket
3. Set `NEXT_PUBLIC_APP_URL` to your domain
4. Use strong `JWT_SECRET` and `BCRYPT_ROUNDS`

### Build and Deploy
```bash
# Production build
npm run build

# Start production server
npm start

# Or use PM2
pm2 start npm --name vaultkeep -- start
```

### Security Checklist
- [ ] Strong JWT secret (32+ characters)
- [ ] HTTPS enabled
- [ ] MongoDB authentication enabled
- [ ] R2 bucket properly secured
- [ ] CORS configured
- [ ] Rate limiting active
- [ ] Error logging enabled

---

## License

MIT License - See LICENSE file for details.

## Support

For issues or questions:
- GitHub Issues: [https://github.com/gauravbhatia4601/VaultKeep/issues](https://github.com/gauravbhatia4601/VaultKeep/issues)
- Documentation: Check individual feature guides in this directory

---

**Last Updated**: October 2024
**Version**: 1.0.0

