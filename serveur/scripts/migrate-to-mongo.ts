#!/usr/bin/env node

/**
 * Migration script to transfer data from SQLite to MongoDB
 * Usage: npm run migrate-to-mongo
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import Database from 'better-sqlite3';
import { MongoClient } from 'mongodb';
import { join } from 'path';

// Load environment variables
const envPath = resolve(process.cwd(), '.env');
config({ path: envPath });

const DB_PATH = join(process.cwd(), 'data.db');
const MONGO_URI = process.env.MONGO_URI;
const CLEAR_EXISTING = process.argv.includes('--clear');

if (!MONGO_URI) {
  console.error('❌ MONGO_URI environment variable is not set');
  process.exit(1);
}

/**
 * Deserialize JSON string from SQLite
 */
function deserialize<T>(value: string): T {
  try {
    return JSON.parse(value || '[]');
  } catch {
    return [] as T;
  }
}

/**
 * Convert SQLite row to MongoDB document
 */
function rowToDocument(row: any, category?: string) {
  const doc: any = {
    name: row.name,
    phones: deserialize<string[]>(row.phones),
    emails: deserialize<string[]>(row.emails),
    website: row.website || undefined,
    social: deserialize<string[]>(row.social),
    address: row.address || undefined,
    city: row.city || undefined,
    country: row.country || 'Tunisie',
    lat: row.lat ?? undefined,
    lng: row.lng ?? undefined,
    sources: deserialize<any[]>(row.sources),
    confidence: row.confidence || 0.5,
    created_at: row.created_at ? new Date(row.created_at) : new Date(),
    updated_at: row.updated_at ? new Date(row.updated_at) : new Date(),
  };

  // Add category if provided
  if (category) {
    doc.category = category;
  }

  // Remove undefined values
  Object.keys(doc).forEach(key => {
    if (doc[key] === undefined) {
      delete doc[key];
    }
  });

  return doc;
}

async function migrate() {
  console.log('🚀 Starting migration from SQLite to MongoDB\n');

  // Connect to SQLite
  console.log('📂 Connecting to SQLite...');
  const sqliteDb = new Database(DB_PATH);
  console.log('✅ Connected to SQLite\n');

  // Connect to MongoDB
  console.log('🔌 Connecting to MongoDB...');
  const mongoClient = new MongoClient(MONGO_URI!);
  await mongoClient.connect();
  const db = mongoClient.db();
  console.log('✅ Connected to MongoDB\n');

  try {
    let totalMigrated = 0;

    // Clear existing data if requested
    if (CLEAR_EXISTING) {
      console.log('🗑️  Clearing existing MongoDB collections...');
      await db.collection('companies').deleteMany({});
      await db.collection('construction').deleteMany({});
      await db.collection('fournisseur').deleteMany({});
      console.log('   ✅ Collections cleared\n');
    }

    // Migrate companies table
    console.log('📦 Migrating companies table...');
    const companiesRows = sqliteDb.prepare('SELECT * FROM companies').all();
    if (companiesRows.length > 0) {
      const companiesCollection = db.collection('companies');
      const companiesDocs = companiesRows.map((row: any) => rowToDocument(row, row.category));
      
      // Use bulkWrite with upsert to handle duplicates
      const operations = companiesDocs.map(doc => ({
        updateOne: {
          filter: { 
            name: doc.name,
            city: doc.city || '',
          },
          update: { $set: doc },
          upsert: true,
        },
      }));
      
      // Execute in batches of 100
      for (let i = 0; i < operations.length; i += 100) {
        const batch = operations.slice(i, i + 100);
        await companiesCollection.bulkWrite(batch, { ordered: false });
      }
      
      totalMigrated += companiesRows.length;
      console.log(`   ✅ Migrated ${companiesRows.length} companies`);
    } else {
      console.log('   ℹ️  No companies to migrate');
    }

    // Migrate construction table
    console.log('\n📦 Migrating construction table...');
    const constructionRows = sqliteDb.prepare('SELECT * FROM construction').all();
    if (constructionRows.length > 0) {
      const constructionCollection = db.collection('construction');
      const constructionDocs = constructionRows.map((row: any) => ({
        ...rowToDocument(row),
        category: 'construction',
      }));
      
      // Use bulkWrite with upsert to handle duplicates
      const operations = constructionDocs.map(doc => ({
        updateOne: {
          filter: { 
            name: doc.name,
            city: doc.city || '',
          },
          update: { $set: doc },
          upsert: true,
        },
      }));
      
      // Execute in batches of 100
      for (let i = 0; i < operations.length; i += 100) {
        const batch = operations.slice(i, i + 100);
        await constructionCollection.bulkWrite(batch, { ordered: false });
      }
      
      totalMigrated += constructionRows.length;
      console.log(`   ✅ Migrated ${constructionRows.length} construction companies`);
    } else {
      console.log('   ℹ️  No construction companies to migrate');
    }

    // Migrate fournisseur table
    console.log('\n📦 Migrating fournisseur table...');
    const fournisseurRows = sqliteDb.prepare('SELECT * FROM fournisseur').all();
    if (fournisseurRows.length > 0) {
      const fournisseurCollection = db.collection('fournisseur');
      const fournisseurDocs = fournisseurRows.map((row: any) => ({
        ...rowToDocument(row),
        category: 'fournisseur',
      }));
      
      // Use bulkWrite with upsert to handle duplicates
      const operations = fournisseurDocs.map(doc => ({
        updateOne: {
          filter: { 
            name: doc.name,
            city: doc.city || '',
          },
          update: { $set: doc },
          upsert: true,
        },
      }));
      
      // Execute in batches of 100
      for (let i = 0; i < operations.length; i += 100) {
        const batch = operations.slice(i, i + 100);
        await fournisseurCollection.bulkWrite(batch, { ordered: false });
      }
      
      totalMigrated += fournisseurRows.length;
      console.log(`   ✅ Migrated ${fournisseurRows.length} fournisseur companies`);
    } else {
      console.log('   ℹ️  No fournisseur companies to migrate');
    }

    // Create indexes
    console.log('\n📇 Creating indexes...');
    const companiesCollection = db.collection('companies');
    await companiesCollection.createIndex({ name: 1, city: 1 });
    await companiesCollection.createIndex({ city: 1 });
    await companiesCollection.createIndex({ website: 1 });
    await companiesCollection.createIndex({ category: 1 });
    
    const constructionCollection = db.collection('construction');
    await constructionCollection.createIndex({ name: 1, city: 1 });
    await constructionCollection.createIndex({ city: 1 });
    await constructionCollection.createIndex({ website: 1 });
    
    const fournisseurCollection = db.collection('fournisseur');
    await fournisseurCollection.createIndex({ name: 1, city: 1 });
    await fournisseurCollection.createIndex({ city: 1 });
    await fournisseurCollection.createIndex({ website: 1 });
    
    console.log('   ✅ Indexes created');

    console.log(`\n✅ Migration completed successfully!`);
    console.log(`   Total documents migrated: ${totalMigrated}`);
    console.log(`   Collections: companies, construction, fournisseur\n`);

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    throw error;
  } finally {
    // Close connections
    sqliteDb.close();
    await mongoClient.close();
    console.log('🔌 Connections closed');
  }
}

// Run migration
migrate().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

