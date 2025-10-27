# Quick R2 Setup Checklist

## 🚀 5-Minute Setup Guide

### 1️⃣ Create R2 Bucket (2 min)
```
Cloudflare Dashboard → R2 → Create bucket
Bucket name: family-docs-vault (or your choice)
```

### 2️⃣ Generate API Token (2 min)
```
R2 Dashboard → Manage R2 API Tokens → Create API token
Token name: family-docs-vault-api
Permissions: ✅ Object Read & Write
Scope: All buckets (or specific bucket)
```

⚠️ IMPORTANT: Copy credentials immediately (shown only once!)
- Access Key ID
- Secret Access Key

### 3️⃣ Create `.env.local` (1 min)

Create a new file `.env.local` in the project root:

```env
# MongoDB (if not already set)
MONGODB_URI=mongodb://localhost:27017/family-docs-vault

# JWT Secret (if not already set)
JWT_SECRET=your-super-secret-jwt-key-change-this

# Cloudflare R2 Configuration
R2_ENDPOINT=https://YOUR-ACCOUNT-ID.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=paste-your-access-key-id-here
R2_SECRET_ACCESS_KEY=paste-your-secret-key-here
R2_BUCKET_NAME=family-docs-vault

# Optional: Production URL (auto-detected if not set)
# NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 4️⃣ Find Your Account ID

Option A: From R2 Dashboard URL
```
https://dash.cloudflare.com/YOUR-ACCOUNT-ID/r2/overview
                            ^^^^^^^^^^^^^^^^^^^
```

Option B: From Account Home
```
Cloudflare Dashboard → Account Home → Account ID
```

Your R2 endpoint will be:
```
https://YOUR-ACCOUNT-ID.r2.cloudflarestorage.com
```

### 5️⃣ Verify Setup

```bash
# Restart dev server
npm run dev

# Try uploading a document through the UI
# Check console for any R2 errors
```

## ✅ Success Indicators

- ✅ No "R2 configuration error" in console
- ✅ Document uploads successfully
- ✅ Document downloads work
- ✅ Document deletion works

## ❌ Common Issues

### Error: "R2_ENDPOINT not configured"
Fix: Check all 4 R2 variables are in `.env.local`, restart server

### Error: "Access Denied" / "Invalid credentials"
Fix: 
1. Verify Access Key ID is correct
2. Verify Secret Access Key is correct
3. Check token hasn't expired
4. Ensure token has write permissions

### Error: "No such bucket"
Fix: Verify `R2_BUCKET_NAME` matches exactly (case-sensitive)

### Error: "Failed to upload"
Fix:
1. Check endpoint URL format (must include `https://`)
2. Verify Account ID in endpoint
3. Test bucket access in Cloudflare dashboard

## 🧪 Test Commands

```bash
# Check environment variables are loaded
node -e "console.log(process.env.R2_ENDPOINT)"

# Check AWS SDK is installed
npm list @aws-sdk/client-s3
```

## 📁 File Structure in R2

After upload, files will be organized as:
```
your-bucket-name/
  └── folders/
      └── 507f1f77bcf86cd799439011/  (folder ID)
          ├── a3f2b1c...def.pdf
          ├── e8d9c7b...ghi.png
          └── 1a2b3c4...jkl.txt
```

## 🔒 Security Checklist

- [ ] `.env.local` added to `.gitignore` (should already be there)
- [ ] R2 API token has minimum required permissions
- [ ] Different tokens for development and production
- [ ] Bucket is private (not publicly accessible)

## 📊 Monitor Usage

Check R2 usage in Cloudflare Dashboard:
```
R2 → Your Bucket → Usage tab
```

Monitor:
- Storage used
- Operations count
- Egress (should be free!)

## 🎯 Next Steps

After basic setup:
1. Test all CRUD operations (Create, Read, Update, Delete)
2. Test document sharing feature
3. Monitor R2 usage and costs
4. Consider enabling versioning for important files
5. Set up lifecycle rules for automatic cleanup (optional)

## 💰 Cost Estimate

Typical small family usage (~10GB, 1000 operations/month):
- Storage: 10GB × $0.015 = $0.15/month
- Operations: ~1000 × $0.0000045 = $0.005/month
- Total: ~$0.16/month 🎉

## 🆘 Still Having Issues?

1. Check browser console for errors
2. Check server terminal for errors
3. Verify all credentials in Cloudflare dashboard
4. Review `CLOUDFLARE_R2_INTEGRATION.md` for detailed guide
5. Check R2 bucket permissions and token scope

## 📚 Documentation

- Full integration guide: `CLOUDFLARE_R2_INTEGRATION.md`
- R2 setup details: `R2_SETUP.md`
- Cloudflare R2 docs: https://developers.cloudflare.com/r2/


