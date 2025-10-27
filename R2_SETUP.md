# Cloudflare R2 Storage Setup Guide

This application uses Cloudflare R2 object storage for document storage. Follow these steps to configure R2:

## Step 1: Create R2 Bucket

1. Log in to your Cloudflare dashboard
2. Navigate to R2 Object Storage
3. Click Create bucket
4. Enter a bucket name (e.g., `family-docs-vault`)
5. Click Create bucket

## Step 2: Generate R2 API Tokens

1. In the R2 dashboard, click Manage R2 API Tokens
2. Click Create API token
3. Configure the token:
   - Token name: `family-docs-vault-api`
   - Permissions: Object Read & Write
   - Bucket: Select your bucket or "Apply to all buckets"
4. Click Create API Token
5. Important: Copy the credentials immediately (they won't be shown again)
   - Access Key ID
   - Secret Access Key

## Step 3: Get Your R2 Endpoint

Your R2 endpoint URL format is:
```
https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

To find your Account ID:
1. Go to Cloudflare dashboard
2. Look at the URL or sidebar
3. Your Account ID is visible in the R2 overview page

## Step 4: Configure Environment Variables

Add these variables to your `.env.local` file (create it if it doesn't exist):

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/family-docs-vault

# JWT Secret for authentication tokens
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Cloudflare R2 Configuration
R2_ENDPOINT=https://YOUR-ACCOUNT-ID.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=your-bucket-name

# Optional: Production URL (auto-detected if not set)
# NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

Note: The `NEXT_PUBLIC_APP_URL` is optional. If not set, the app will automatically detect the URL from the request headers. This works in both development and production.

## Step 5: Verify Configuration

Run your application and try uploading a document. The system will:
- Validate R2 configuration on startup
- Upload files to R2 instead of local storage
- Store the R2 object key in MongoDB
- Download files directly from R2

## Optional: Custom Domain Setup

For production, you can set up a custom domain for your R2 bucket:

1. Go to your R2 bucket settings
2. Click Settings > Public access
3. Connect a custom domain
4. Add the custom domain to your environment variables:

```env
R2_PUBLIC_URL=https://files.yourdomain.com
```

## Security Best Practices

1. Never commit `.env.local` to version control
2. Use different R2 buckets for development and production
3. Rotate API tokens regularly
4. Enable CORS settings if accessing from browser directly
5. Consider enabling R2 bucket encryption

## Troubleshooting

### Error: "R2_ENDPOINT not configured"
- Check that all R2 environment variables are set
- Restart your development server after adding variables

### Error: "Failed to upload file to R2"
- Verify your API token has write permissions
- Check that the bucket name is correct
- Ensure the endpoint URL is correct

### Error: "Access Denied"
- Verify API credentials are correct
- Check token permissions include the specific bucket
- Ensure token is not expired

## Migration from Local Storage

If you have existing files in local storage (`uploads/` folder):

1. The new system will automatically use R2 for all new uploads
2. Old files will remain in local storage but won't be accessible
3. To migrate existing files, you'll need to:
   - Re-upload documents through the UI, or
   - Create a migration script to upload existing files to R2

## Benefits of Using R2

- Scalability: No local disk space limitations
- Reliability: Cloudflare's global network ensures high availability
- Performance: Fast access from anywhere in the world
- Cost-effective: Cheaper than traditional cloud storage
- No egress fees: Free data transfer out


