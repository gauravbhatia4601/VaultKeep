# Cloudflare R2 Integration Complete

## Summary

The application has been successfully integrated with Cloudflare R2 object storage for document management. All file operations now use R2 instead of local file storage.

## Changes Made

### 1. New Dependencies

- **@aws-sdk/client-s3**: AWS SDK for S3 (R2 is S3-compatible)

### 2. New Files Created

#### `/lib/r2Storage.ts`
Core R2 storage library with the following functions:
- `uploadToR2()` - Upload files to R2 bucket
- `downloadFromR2()` - Download files from R2 bucket
- `deleteFromR2()` - Delete files from R2 bucket
- `validateR2Config()` - Validate R2 environment variables
- `generateUniqueKey()` - Generate unique storage keys

### 3. Updated API Routes

All document CRUD operations now use R2:

#### **POST** `/api/folders/[id]/documents` - Upload Document
- Validates R2 configuration before upload
- Uploads file to R2 with folder structure: `folders/{folderId}/{uniqueFileName}`
- Stores R2 object key in database
- Calculates SHA-256 checksum
- Updates folder statistics

#### **GET** `/api/folders/[id]/documents/[docId]` - Download Document
- Downloads file from R2 using stored key
- Updates last accessed timestamp
- Returns file with proper content headers

#### **DELETE** `/api/folders/[id]/documents/[docId]` - Delete Document
- Deletes file from R2 bucket
- Removes document record from database
- Updates folder statistics
- Continues with DB deletion even if R2 deletion fails

#### **GET** `/api/share/[token]/download` - Download Shared Document
- Downloads shared file from R2
- Validates share token and expiration
- Returns file for download

### 4. Storage Structure

Files are organized in R2 with the following structure:
```
your-bucket-name/
  └── folders/
      └── {folderId}/
          ├── {uniqueFileName1}.pdf
          ├── {uniqueFileName2}.png
          └── {uniqueFileName3}.txt
```

### 5. Document Model

The `Document` model's `storagePath` field now stores:
- **Before**: Local file path (e.g., `abc123.pdf`)
- **After**: R2 object key (e.g., `folders/507f1f77bcf86cd799439011/abc123.pdf`)

## Environment Variables Required

Add these to your `.env.local` file:

```env
# Cloudflare R2 Configuration
R2_ENDPOINT=https://YOUR-ACCOUNT-ID.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=your-bucket-name
```

## How to Set Up

### Step 1: Create R2 Bucket
1. Go to Cloudflare Dashboard → R2 Object Storage
2. Click "Create bucket"
3. Name your bucket (e.g., `family-docs-vault`)

### Step 2: Generate API Token
1. Click "Manage R2 API Tokens"
2. Click "Create API token"
3. Set permissions: Object Read & Write
4. Copy the Access Key ID and Secret Access Key

### Step 3: Get Account ID
Your endpoint format: `https://{ACCOUNT-ID}.r2.cloudflarestorage.com`
Find your Account ID in the Cloudflare dashboard URL or R2 overview page.

### Step 4: Update Environment Variables
Create or update `.env.local` with your R2 credentials.

### Step 5: Restart Development Server
```bash
npm run dev
```

## API Error Handling

The integration includes comprehensive error handling:

- **Configuration Errors**: Returns 500 with specific error message if R2 is not configured
- **Upload Errors**: Catches and logs R2 upload failures
- **Download Errors**: Returns 404 if file not found in R2
- **Delete Errors**: Logs errors but continues with DB cleanup

## Features

### ✅ Automatic Validation
- R2 configuration is validated before any upload operation
- Clear error messages guide developers to fix configuration issues

### ✅ Unique File Keys
- Files are stored with unique crypto-generated names
- Organized by folder ID for easy management
- Original filenames preserved in database

### ✅ Metadata Storage
- Original filename and checksum stored in R2 metadata
- Enables file verification and audit trails

### ✅ Folder Organization
- Files organized by folder ID in R2
- Makes bulk operations and cleanup easier
- Matches application structure

### ✅ Seamless Migration
- All existing APIs work without changes
- Drop-in replacement for local storage
- No frontend changes required

## Performance Benefits

1. **No Disk Space Limits**: Store unlimited files
2. **Global CDN**: Fast access from anywhere
3. **Scalability**: Handles high traffic automatically
4. **Reliability**: Built-in redundancy and backups

## Cost Optimization

Cloudflare R2 pricing:
- **Storage**: $0.015/GB per month
- **Operations**: Class A (writes) $4.50/million, Class B (reads) $0.36/million
- **Egress**: FREE (no bandwidth charges)

## Security Features

1. **Access Control**: API tokens with specific permissions
2. **Secure Transport**: HTTPS for all operations
3. **Checksums**: SHA-256 verification for file integrity
4. **Token Expiration**: Share links expire after 30 days

## Testing the Integration

1. **Upload Test**: Upload a new document through the UI
2. **Download Test**: Download the document
3. **Delete Test**: Delete the document
4. **Share Test**: Generate and use a share link

Check the browser console and server logs for any R2-related errors.

## Troubleshooting

### "R2_ENDPOINT not configured"
- Ensure all four R2 environment variables are set
- Restart the development server

### "Failed to upload file to R2"
- Verify API credentials are correct
- Check bucket name matches exactly
- Ensure token has write permissions

### "File not found or could not be downloaded from R2"
- File may not exist in R2 (check R2 dashboard)
- Storage path in database may be incorrect
- Verify bucket name in environment variables

### CORS Errors (if applicable)
If accessing R2 directly from the browser:
1. Go to R2 bucket settings
2. Configure CORS rules for your domain

## Migration Notes

### Existing Files
Files uploaded before this integration remain in the local `uploads/` folder and won't be accessible through the new system. Options:
1. Re-upload documents through the UI
2. Create a migration script to upload to R2
3. Keep old files in local storage (two-tier approach)

### Database Updates
The `storagePath` field now stores R2 keys instead of local paths. No migration needed for new uploads.

## Future Enhancements

Potential improvements:
1. **Pre-signed URLs**: Generate temporary direct download links
2. **Multi-part Upload**: Handle large files (>100MB)
3. **Compression**: Auto-compress images and PDFs
4. **Thumbnails**: Generate preview images for documents
5. **Versioning**: Enable R2 object versioning
6. **Lifecycle Policies**: Auto-delete old files
7. **Custom Domains**: Use custom domain for R2 bucket

## Support

For issues or questions:
1. Check R2 configuration in `.env.local`
2. Review Cloudflare R2 documentation
3. Check server logs for detailed error messages
4. Verify API token permissions in Cloudflare dashboard

## References

- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [AWS S3 SDK Documentation](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/)
- [R2 API Token Management](https://developers.cloudflare.com/r2/api/s3/tokens/)


