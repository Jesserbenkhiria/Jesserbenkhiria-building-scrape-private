import Database from 'better-sqlite3';
import { join } from 'path';

const DB_PATH = join(process.cwd(), 'data.db');

let db: Database.Database | null = null;

/**
 * Initialise la base de données SQLite
 */
export function initDb(): Database.Database {
  if (db) return db;
  
  db = new Database(DB_PATH);
  
  // Activer les clés étrangères
  db.pragma('foreign_keys = ON');
  
  // Créer les tables séparées pour CONSTRUCTION et FOURNISSEUR
  db.exec(`
    CREATE TABLE IF NOT EXISTS construction (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phones TEXT DEFAULT '[]',
      emails TEXT DEFAULT '[]',
      website TEXT,
      social TEXT DEFAULT '[]',
      address TEXT,
      city TEXT,
      country TEXT DEFAULT 'Tunisie',
      lat REAL,
      lng REAL,
      sources TEXT DEFAULT '[]',
      confidence REAL DEFAULT 0.5,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS fournisseur (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phones TEXT DEFAULT '[]',
      emails TEXT DEFAULT '[]',
      website TEXT,
      social TEXT DEFAULT '[]',
      address TEXT,
      city TEXT,
      country TEXT DEFAULT 'Tunisie',
      lat REAL,
      lng REAL,
      sources TEXT DEFAULT '[]',
      confidence REAL DEFAULT 0.5,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    
    -- Index pour construction
    CREATE INDEX IF NOT EXISTS idx_construction_city ON construction(city);
    CREATE INDEX IF NOT EXISTS idx_construction_website ON construction(website);
    CREATE INDEX IF NOT EXISTS idx_construction_name_city ON construction(name, city);
    
    -- Index pour fournisseur
    CREATE INDEX IF NOT EXISTS idx_fournisseur_city ON fournisseur(city);
    CREATE INDEX IF NOT EXISTS idx_fournisseur_website ON fournisseur(website);
    CREATE INDEX IF NOT EXISTS idx_fournisseur_name_city ON fournisseur(name, city);
    
    -- Garder la table companies pour compatibilité (optionnel)
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('construction', 'fournisseur')),
      phones TEXT DEFAULT '[]',
      emails TEXT DEFAULT '[]',
      website TEXT,
      social TEXT DEFAULT '[]',
      address TEXT,
      city TEXT,
      country TEXT DEFAULT 'Tunisie',
      lat REAL,
      lng REAL,
      sources TEXT DEFAULT '[]',
      confidence REAL DEFAULT 0.5,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    
    CREATE INDEX IF NOT EXISTS idx_companies_category ON companies(category);
    CREATE INDEX IF NOT EXISTS idx_companies_city ON companies(city);
    CREATE INDEX IF NOT EXISTS idx_companies_website ON companies(website);
    CREATE INDEX IF NOT EXISTS idx_companies_name_city ON companies(name, city);
  `);
  
  console.log(`✅ Base de données initialisée: ${DB_PATH}`);
  
  return db;
}

/**
 * Obtient l'instance de la base de données
 */
export function getDb(): Database.Database {
  if (!db) {
    return initDb();
  }
  return db;
}

/**
 * Ferme la connexion à la base de données
 */
export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * Exécute une transaction
 */
export function transaction<T>(fn: (db: Database.Database) => T): T {
  const database = getDb();
  const transact = database.transaction(fn);
  return transact(database);
}

