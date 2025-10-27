/**
 * Migration Script: Add path and level to existing folders
 * Run this once to update all existing folders in the database
 * 
 * Usage: node scripts/migrate-folders.js
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Manually load environment variables from .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const lines = envContent.split('\n');
    lines.forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        process.env[key] = value;
      }
    });
  }
}

async function migrateFolders() {
  try {
    // Load environment variables
    loadEnv();
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in .env.local file');
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Define the Folder schema (simplified for migration)
    const folderSchema = new mongoose.Schema({
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      folderName: String,
      passwordHash: String,
      description: String,
      parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder' },
      path: String,
      level: Number,
      documentCount: { type: Number, default: 0 },
      totalSize: { type: Number, default: 0 },
      lastAccessedAt: Date,
    }, { timestamps: true });

    // Get or create the Folder model
    const Folder = mongoose.models.Folder || mongoose.model('Folder', folderSchema);

    // Find all folders without path or level
    console.log('\n🔍 Finding folders that need migration...');
    const foldersToMigrate = await Folder.find({
      $or: [
        { path: { $exists: false } },
        { path: null },
        { level: { $exists: false } },
        { level: null }
      ]
    });

    console.log(`📦 Found ${foldersToMigrate.length} folders to migrate`);

    if (foldersToMigrate.length === 0) {
      console.log('✨ All folders are already up to date!');
      return;
    }

    let migratedCount = 0;
    let errorCount = 0;

    // Migrate each folder
    for (const folder of foldersToMigrate) {
      try {
        // Set default values for root folders
        if (!folder.path) {
          folder.path = `/${folder.folderName}`;
        }
        if (folder.level === undefined || folder.level === null) {
          folder.level = 0;
        }
        if (!folder.parentId) {
          folder.parentId = null;
        }

        await folder.save();
        migratedCount++;
        console.log(`  ✓ Migrated: ${folder.folderName} (ID: ${folder._id})`);
      } catch (error) {
        errorCount++;
        console.error(`  ✗ Error migrating folder ${folder._id}:`, error.message);
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Successfully migrated: ${migratedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📦 Total processed: ${foldersToMigrate.length}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the migration
migrateFolders()
  .then(() => {
    console.log('\n✨ Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });

