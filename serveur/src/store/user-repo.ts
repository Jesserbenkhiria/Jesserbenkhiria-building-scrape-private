import { getMongo } from './mongo';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';

export interface User {
  id?: string;
  username: string;
  password: string; // Hashed password
  created_at: Date;
  updated_at: Date;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Compare a password with a hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Create a new user
 */
export async function createUser(username: string, password: string): Promise<User> {
  const db = await getMongo();
  const collection = db.collection('users');

  // Check if user already exists
  const existing = await collection.findOne({ username: username.toLowerCase() });
  if (existing) {
    throw new Error('Un utilisateur avec ce nom existe déjà');
  }

  // Hash the password
  const hashedPassword = await hashPassword(password);

  // Create user document
  const user: Omit<User, 'id'> = {
    username: username.toLowerCase(),
    password: hashedPassword,
    created_at: new Date(),
    updated_at: new Date(),
  };

  // Insert user
  const result = await collection.insertOne(user);

  return {
    id: result.insertedId.toString(),
    ...user,
  };
}

/**
 * Find a user by username
 */
export async function findUserByUsername(username: string): Promise<User | null> {
  const db = await getMongo();
  const collection = db.collection('users');

  const user = await collection.findOne({ username: username.toLowerCase() });
  if (!user) {
    return null;
  }

  return {
    id: user._id instanceof ObjectId ? user._id.toString() : String(user._id),
    username: user.username,
    password: user.password,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

/**
 * Verify user credentials
 */
export async function verifyUser(username: string, password: string): Promise<User | null> {
  const user = await findUserByUsername(username);
  if (!user) {
    return null;
  }

  const isValid = await comparePassword(password, user.password);
  if (!isValid) {
    return null;
  }

  return user;
}

/**
 * Initialize users collection (create index)
 */
export async function initUsersCollection(): Promise<void> {
  const db = await getMongo();
  const collection = db.collection('users');

  // Create unique index on username
  await collection.createIndex({ username: 1 }, { unique: true });
}

