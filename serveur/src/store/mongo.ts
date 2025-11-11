import { MongoClient, Db } from 'mongodb';
import { env } from '../config/env';

let client: MongoClient | null = null;
let db: Db | null = null;

/**
 * Initialize MongoDB connection
 */
export async function initMongo(): Promise<Db> {
  if (db) return db;

  if (!env.MONGO_URI) {
    throw new Error('MONGO_URI environment variable is not set');
  }

  client = new MongoClient(env.MONGO_URI);
  await client.connect();
  db = client.db();
  
  console.log('✅ MongoDB connected');
  
  return db;
}

/**
 * Get MongoDB database instance
 */
export async function getMongo(): Promise<Db> {
  if (!db) {
    return await initMongo();
  }
  return db;
}

/**
 * Close MongoDB connection
 */
export async function closeMongo(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('🔌 MongoDB connection closed');
  }
}

