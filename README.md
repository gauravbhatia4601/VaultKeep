# VaultKeep

VaultKeep is a secure family document vault application that allows users to create password-protected folders to organize and secure their important family documents.

## Features

- Secure user authentication with iron-session
- Password-protected document folders
- **Cloudflare R2 object storage** for scalable document management
- Document sharing with expiring links
- Progressive Web App (PWA) support
- Premium purple-themed UI with 3D animations
- Built with Next.js 15 and Framer Motion
- MongoDB database for data storage

## Tech Stack

- **Framework**: Next.js 15.5.5 with App Router and Turbopack
- **Database**: MongoDB with Mongoose
- **Storage**: Cloudflare R2 (S3-compatible object storage)
- **Authentication**: iron-session with bcrypt + JWT
- **UI**: Tailwind CSS 4 with Framer Motion animations
- **TypeScript**: Full type safety
- **PWA**: Service Worker with offline support

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the project root:

```bash
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/family-docs-vault

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this

# Cloudflare R2 Configuration
R2_ENDPOINT=https://YOUR-ACCOUNT-ID.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=your-bucket-name

# Optional: Production URL (auto-detected if not set)
# NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

**Quick R2 Setup**: See `QUICK_R2_SETUP.md` for a 5-minute setup guide.

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
vaultkeep/
├── app/
│   ├── (auth)/          # Authentication pages (login, register)
│   ├── api/             # API routes
│   ├── dashboard/       # Dashboard pages
│   └── page.tsx         # Landing page
├── components/
│   ├── auth/            # Auth forms
│   └── ui/              # Reusable UI components
├── lib/                 # Utility functions and database
└── models/              # MongoDB models
```

## Security Features

- Password hashing with bcrypt
- Secure session management with iron-session + JWT
- Input validation with Zod
- Protected API routes with middleware
- Server-side authentication checks
- Folder-level password protection
- Document access tokens
- Expiring share links (30 days)
- SHA-256 file checksums
- Secure R2 object storage with API tokens

## Development

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Documentation

- **Quick Setup**: `QUICK_R2_SETUP.md` - 5-minute R2 setup guide
- **R2 Integration**: `CLOUDFLARE_R2_INTEGRATION.md` - Complete integration details
- **R2 Setup Guide**: `R2_SETUP.md` - Detailed R2 configuration
- **PWA Guide**: `PWA_GUIDE.md` - Progressive Web App setup

## Storage Architecture

All documents are stored in **Cloudflare R2** (S3-compatible object storage):
- Unlimited storage capacity
- Global CDN distribution
- Free egress (no bandwidth charges)
- Cost-effective ($0.015/GB/month)
- Organized by folder structure: `folders/{folderId}/{filename}`

## License

Private project for family document management.
