# Unified Upload Feature Guide

## 🎯 Overview

The **Unified Upload Zone** is a smart, single component that automatically detects and handles both individual file uploads and complete folder uploads with nested structure preservation.

## ✨ Key Features

### 1. **Automatic Detection**
- Intelligently detects whether you're uploading files or folders
- No need to choose between "Upload Files" or "Upload Folder"
- Single, unified interface for all upload scenarios

### 2. **Multiple Upload Methods**
- **Drag & Drop**: Drag files or folders directly into the upload zone
- **Select Files Button**: Choose individual files
- **Select Folder Button**: Choose entire folders with structure

### 3. **Smart Handling**
- **For Files**: Uploads directly to current folder
- **For Folders**: 
  - Auto-creates nested folder structure
  - Preserves complete directory hierarchy
  - Uploads files to their respective folders

### 4. **Real-Time Progress**
- Overall progress bar with percentage
- Live file count: "X / Y files"
- Individual file status with icons:
  - ✅ Completed (green checkmark)
  - 🔄 Uploading (spinning loader)
  - ❌ Error (red X)

### 5. **Visual Feedback**
- Shows upload type detected (Files or Folder)
- Displays icon indicator (file or folder)
- Shows last 5 files being processed
- Completion summary with success message

## 🚀 How It Works

### Detection Logic

```typescript
// Auto-detect based on webkitRelativePath
const detectUploadType = (files: FileWithPath[]): 'files' | 'folder' => {
  return files.some(f => f.webkitRelativePath && f.webkitRelativePath.includes('/')) 
    ? 'folder' 
    : 'files';
};
```

- If any file has a path with `/`, it's a folder upload
- Otherwise, it's individual files

### Upload Flow

**For Individual Files:**
1. Files uploaded directly to current folder
2. Each file processed sequentially
3. Progress tracked individually

**For Folders:**
1. Parse folder structure from file paths
2. Create parent folders first (if needed)
3. Upload files to respective folders
4. Track progress for all files

### Example Folder Upload

**Input Structure:**
```
📁 My Documents/
  ├── 📁 Reports/
  │   ├── Q1.pdf
  │   └── Q2.pdf
  ├── 📁 Images/
  │   ├── logo.png
  │   └── banner.jpg
  └── README.txt
```

**Process:**
1. Creates "Reports" subfolder
2. Uploads Q1.pdf and Q2.pdf to Reports/
3. Creates "Images" subfolder
4. Uploads logo.png and banner.jpg to Images/
5. Uploads README.txt to root (current folder)

**Result in Vault:**
```
Current Folder/
  ├── 📁 Reports/
  │   ├── Q1.pdf
  │   └── Q2.pdf
  ├── 📁 Images/
  │   ├── logo.png
  │   └── banner.jpg
  └── README.txt
```

## 💡 User Experience

### Upload States

**1. Initial State**
- Shows drag & drop zone
- Two buttons: "Select Files" and "Select Folder"
- Info tip about smart detection

**2. Uploading State**
- Shows upload type icon and label
- Overall progress bar with percentage
- Live file processing list (last 5 files)
- Each file shows status icon

**3. Complete State**
- Green success message
- Summary of files uploaded
- "Upload More" button to reset

**4. Error State**
- Red error message if any files fail
- Shows count of successful vs failed uploads
- Allows retry with "Upload More"

### Visual Indicators

| Status | Icon | Color |
|--------|------|-------|
| Pending | - | Gray |
| Uploading | 🔄 Spinner | Purple |
| Completed | ✅ Checkmark | Green |
| Error | ❌ X | Red |

## 🎨 UI Components

### Drag & Drop Zone
- Dashed border that highlights on drag over
- Hover effects for better UX
- Clear visual feedback

### Buttons
- **Select Files**: Secondary style, file icon
- **Select Folder**: Primary style (purple gradient), folder icon

### Progress Display
```
Uploading Folder                    ← Type indicator
Creating folder structure...         ← Status message

Progress: 5 / 10 files      75%     ← Progress bar
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Recent files:                       ← Last 5 files
✅ Reports/Q1.pdf                    ← Completed
🔄 Images/logo.png                   ← Uploading
⏳ Images/banner.jpg                 ← Pending
```

## 🔧 Technical Implementation

### Component Structure

```tsx
<UnifiedUploadZone
  folderId={folderId}       // Current folder ID
  accessToken={accessToken} // Auth token for API
  onUploadSuccess={() => {  // Callback on success
    refreshFolderData();
  }}
/>
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `folderId` | string | ID of the folder to upload to |
| `accessToken` | string | Authentication token |
| `onUploadSuccess` | () => void | Callback after upload completes |

### State Management

```typescript
const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
const [uploadType, setUploadType] = useState<'files' | 'folder' | null>(null);
const [isUploading, setIsUploading] = useState(false);
```

### File Processing

**Individual Files:**
- Direct upload to current folder
- Sequential processing
- Real-time progress updates

**Folders:**
- Parse directory structure
- Create nested folders first
- Upload files to correct locations
- Preserve complete hierarchy

## 📊 Performance

### Optimizations

1. **Sequential Upload**: Files uploaded one at a time to avoid overwhelming the server
2. **Progress Throttling**: Shows only last 5 files to keep UI responsive
3. **Lazy Folder Creation**: Folders created only when needed
4. **Path Caching**: Remembers created folders to avoid duplicates

### Limitations

- Maximum 5 levels of folder nesting
- Files upload sequentially (not parallel)
- Large folders may take time (intentional for stability)

## 🐛 Error Handling

### Scenarios Covered

1. **Individual File Failure**: Continues with remaining files
2. **Folder Creation Failure**: Skips that branch, continues others
3. **Network Issues**: Shows error, allows retry
4. **Partial Success**: Shows count of successful vs failed uploads

### Error Messages

- **Upload Failed**: General upload error
- **Failed to create folder: X**: Specific folder creation error
- **Uploaded X of Y files**: Partial success indicator

## 🎯 Use Cases

### 1. Uploading Documents
- Select multiple PDFs, images, or files
- All go to current folder
- Quick and simple

### 2. Migrating Project Folders
- Select entire project directory
- Preserves folder structure
- All files organized automatically

### 3. Organizing Archives
- Upload compressed folder contents
- Structure maintained
- Easy browsing afterward

### 4. Team Collaboration
- Share complete folder hierarchies
- Everyone sees same structure
- No manual reorganization needed

## 🔒 Security

- All uploads require authentication token
- Server validates folder ownership
- Files stored securely in Cloudflare R2
- No client-side file processing (paths only)

## 🚀 Browser Compatibility

| Feature | Support |
|---------|---------|
| Drag & Drop | ✅ All modern browsers |
| File Input | ✅ All browsers |
| Folder Input | ✅ Chrome, Edge, Safari, Firefox |
| webkitdirectory | ✅ Widely supported |

## 💡 Tips & Best Practices

### For Users

1. **Small Batches**: Upload folders in smaller batches for faster processing
2. **Watch Progress**: Monitor the upload to catch any errors early
3. **Network**: Use stable internet connection for large uploads
4. **Browser**: Use Chrome/Edge for best folder upload experience

### For Developers

1. **Token Management**: Ensure access token is valid before upload
2. **Error Recovery**: Always show partial success information
3. **UI Feedback**: Keep user informed at every step
4. **State Cleanup**: Reset state after completion

## 📝 Future Enhancements

Potential improvements:
- [ ] Parallel file uploads (with concurrency limit)
- [ ] Upload pause/resume functionality
- [ ] File type filtering before upload
- [ ] Duplicate detection
- [ ] Estimated time remaining
- [ ] Upload queue management
- [ ] Compress before upload option

---

**Status**: ✅ Fully Implemented and Production Ready
**Version**: 1.0
**Last Updated**: October 27, 2025

