# New Features Architecture

## Feature 1: Optional PIN-based Folder Protection

### Current State
- Folders require password (minimum 6 characters)
- Password can be any string
- Password required to access folder

### New Design
- **Optional Protection**: Users can create folders without password/PIN
- **PIN Format**: Numeric only, 4-6 digits (e.g., 1234, 123456)
- **Backward Compatible**: Existing password-protected folders continue to work

### Database Changes
No schema changes needed. The `passwordHash` field remains optional.

### API Changes
- `POST /api/folders` - Make password optional in validation
- `POST /api/folders/[id]/verify` - Skip verification for unprotected folders
- `PATCH /api/folders/[id]` - Allow removing/adding PIN

### UI Changes
- Checkbox: "Protect this folder with a PIN"
- PIN input: Only show when checkbox is enabled
- Numeric keypad for PIN entry
- Unprotected folders: Direct access (no password modal)

---

## Feature 2: Nested Folders (Folders within Folders)

### Database Schema Design

#### Folder Model Updates
```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  folderName: string,
  description?: string,
  passwordHash?: string,
  
  // NEW FIELDS
  parentFolderId?: ObjectId,  // null for root folders
  path: string[],              // [rootId, parentId, thisId] for quick queries
  depth: number,               // 0 for root, 1 for first level, etc.
  isRoot: boolean,             // true if parentFolderId is null
  
  documentCount: number,
  totalSize: number,
  createdAt: Date,
  updatedAt: Date,
  lastAccessedAt?: Date
}
```

#### Example Structure
```
Root Folders (parentFolderId: null)
├── Family Documents (id: 1)
│   ├── 2023 (id: 2, parentFolderId: 1)
│   │   ├── January (id: 3, parentFolderId: 2)
│   │   └── February (id: 4, parentFolderId: 2)
│   └── 2024 (id: 5, parentFolderId: 1)
└── Work Documents (id: 6)
    └── Projects (id: 7, parentFolderId: 6)
```

### Path Array Benefits
- Fast ancestor queries
- Easy breadcrumb generation
- Efficient permission checks
- Quick depth calculation

### API Changes

#### Create Folder
```
POST /api/folders
Body: {
  folderName: string,
  description?: string,
  password?: string,
  parentFolderId?: string  // NEW
}
```

#### List Folders
```
GET /api/folders?parentId={id}
// If parentId is null/undefined: return root folders
// If parentId is provided: return child folders
```

#### Get Folder Hierarchy
```
GET /api/folders/[id]/tree
Response: {
  folder: {...},
  subfolders: [...],
  breadcrumb: [...]
}
```

#### Move Folder
```
PATCH /api/folders/[id]/move
Body: {
  newParentId: string | null
}
```

### Constraints & Limits
- **Max Depth**: 5 levels (to prevent infinite nesting)
- **Circular References**: Prevent folder from being its own ancestor
- **Permissions**: Child folders inherit parent's access control
- **Deletion**: Cascade delete all subfolders and documents

### UI Changes
- Dashboard: Show only root folders initially
- Folder view: Show subfolders + documents
- Breadcrumb navigation: Home > Parent > Current
- "Create Subfolder" button inside folder view
- Folder tree view (optional sidebar)

---

## Feature 3: Upload Whole Folders

### Browser API
Use HTML5 Directory Upload:
```html
<input type="file" webkitdirectory directory multiple />
```

### Upload Process

#### 1. Client Side (Browser)
```typescript
// User selects folder
const files = event.target.files; // FileList with webkitRelativePath

// Group by directory structure
const structure = {
  'folder1/': [],
  'folder1/subfolder/': [],
  'folder1/file.pdf': File,
  'folder1/subfolder/doc.txt': File
}
```

#### 2. Upload Flow
```
1. Parse directory structure from webkitRelativePath
2. Create nested folders in database (POST /api/folders)
3. Upload files to respective folders (POST /api/folders/[id]/documents)
4. Show progress: "Uploading 15 of 50 files..."
5. Handle errors gracefully (continue on failure)
```

#### 3. API Endpoints

**Batch Folder Creation**
```
POST /api/folders/batch
Body: {
  folders: [
    { folderName: 'folder1', parentPath: [] },
    { folderName: 'subfolder', parentPath: ['folder1'] }
  ]
}
Response: {
  folderMap: {
    'folder1': 'folderId1',
    'folder1/subfolder': 'folderId2'
  }
}
```

**Batch File Upload**
```
POST /api/folders/[id]/documents/batch
Body: FormData with multiple files
```

### Progress Tracking
```typescript
interface UploadProgress {
  totalFolders: number,
  createdFolders: number,
  totalFiles: number,
  uploadedFiles: number,
  failedFiles: string[],
  currentFile: string,
  percentage: number
}
```

### UI Components
- Folder upload button (separate from file upload)
- Progress modal with:
  - Overall progress bar
  - Current file being uploaded
  - Created folders count
  - Uploaded files count
  - Error list (expandable)
  - Cancel button

### Constraints
- **Max Files**: 100 files per folder upload
- **Total Size**: 500MB per folder upload
- **Depth**: Respect nested folder max depth (5 levels)
- **File Types**: Same validation as single file upload

---

## Implementation Order

### Phase 1: Optional PIN Protection (Simplest)
1. Update folder model validation
2. Update create folder API
3. Update verify folder API
4. Update UI components
5. Test backward compatibility

### Phase 2: Nested Folders (Complex)
1. Update database schema
2. Create migration for existing folders
3. Update folder APIs (CRUD)
4. Implement breadcrumb navigation
5. Update folder view UI
6. Test cascade deletion
7. Test permissions

### Phase 3: Folder Upload (Moderate)
1. Add directory picker to UI
2. Implement folder structure parser
3. Create batch folder API
4. Create batch upload API
5. Add progress tracking
6. Handle errors gracefully
7. Test with various folder structures

---

## Database Migration Strategy

### For Existing Folders
```javascript
// Add new fields to all existing folders
db.folders.updateMany(
  { parentFolderId: { $exists: false } },
  {
    $set: {
      parentFolderId: null,
      path: ['$_id'],
      depth: 0,
      isRoot: true
    }
  }
)
```

### Indexes
```javascript
// For efficient queries
db.folders.createIndex({ userId: 1, parentFolderId: 1 });
db.folders.createIndex({ userId: 1, isRoot: 1 });
db.folders.createIndex({ path: 1 });
```

---

## Security Considerations

### Nested Folders
- ✅ Verify user owns parent folder before creating child
- ✅ Prevent circular references
- ✅ Cascade permissions (child inherits parent's protection)
- ✅ Validate folder depth limit
- ✅ Check user owns entire folder tree for operations

### Optional PIN
- ✅ Clear indication when folder is unprotected
- ✅ Allow adding protection to unprotected folders
- ✅ Require current password to remove protection
- ✅ Backward compatible with existing passwords

### Folder Upload
- ✅ Same file validation as single upload
- ✅ Limit total upload size
- ✅ Prevent path traversal attacks
- ✅ Sanitize folder names
- ✅ Rate limiting for batch operations

---

## Backward Compatibility

### Existing Data
- ✅ All existing folders become root folders (parentFolderId: null)
- ✅ Existing password-protected folders continue to work
- ✅ No data migration breaks existing functionality

### API Compatibility
- ✅ Existing API calls work without parentFolderId parameter
- ✅ Default behavior: return root folders when parentId not specified
- ✅ Optional parameters don't break existing clients

---

## Testing Checklist

### Feature 1: Optional PIN
- [ ] Create folder without PIN
- [ ] Create folder with 4-digit PIN
- [ ] Create folder with 6-digit PIN
- [ ] Reject invalid PINs (< 4 or > 6 digits)
- [ ] Reject non-numeric PINs
- [ ] Add PIN to unprotected folder
- [ ] Remove PIN from protected folder
- [ ] Existing password folders still work

### Feature 2: Nested Folders
- [ ] Create subfolder in root folder
- [ ] Create 5 levels of nesting (max depth)
- [ ] Reject 6th level nesting
- [ ] Delete folder with subfolders (cascade)
- [ ] Move folder to different parent
- [ ] Prevent circular reference
- [ ] Breadcrumb navigation works
- [ ] Subfolder inherits parent protection
- [ ] List only root folders on dashboard
- [ ] List subfolders in folder view

### Feature 3: Folder Upload
- [ ] Upload folder with single file
- [ ] Upload folder with nested folders
- [ ] Upload folder with 50+ files
- [ ] Handle upload errors gracefully
- [ ] Progress tracking works correctly
- [ ] Cancel upload mid-process
- [ ] Respect file type validation
- [ ] Respect file size limits
- [ ] Create correct folder hierarchy
- [ ] Handle duplicate folder names

---

## Performance Considerations

### Database Queries
- Use indexes for `userId + parentFolderId` queries
- Cache folder tree structure (optional)
- Limit nested folder queries with depth field

### File Uploads
- Upload files in parallel (5 concurrent)
- Use chunked upload for large files
- Implement retry logic for failed uploads
- Show real-time progress updates

### R2 Storage
- Nested folder structure in R2: `folders/{rootId}/{subId}/{fileId}`
- Maintains same flat structure with path encoding
- No R2 schema changes needed

---

This architecture ensures scalability, security, and backward compatibility while adding powerful new features!

