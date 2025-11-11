import type Database from 'better-sqlite3';
import { getDb, transaction } from './db';
import type { Company, CompaniesQuery } from '../types';
import { normalizeName, normalizePhoneTN, normalizeUrlDomain } from '../lib/normalize';

/**
 * Sérialise un objet en JSON pour SQLite
 */
function serialize(value: any): string {
  return JSON.stringify(value || []);
}

/**
 * Désérialise un JSON de SQLite
 */
function deserialize<T>(value: string): T {
  try {
    return JSON.parse(value || '[]');
  } catch {
    return [] as T;
  }
}

/**
 * Convertit une ligne DB en Company
 */
function rowToCompany(row: any): Company {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    phones: deserialize<string[]>(row.phones),
    emails: deserialize<string[]>(row.emails),
    website: row.website,
    social: deserialize<string[]>(row.social),
    address: row.address,
    city: row.city,
    country: row.country,
    lat: row.lat,
    lng: row.lng,
    sources: deserialize<any[]>(row.sources),
    confidence: row.confidence,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Insère ou met à jour une entreprise
 */
export function upsertCompany(company: Company): number {
  const db = getDb();
  const now = new Date().toISOString();
  
  // Chercher une entreprise existante
  const existing = findSimilar(company);
  
  if (existing) {
    // Mise à jour
    const stmt = db.prepare(`
      UPDATE companies
      SET name = ?,
          category = ?,
          phones = ?,
          emails = ?,
          website = ?,
          social = ?,
          address = ?,
          city = ?,
          country = ?,
          lat = ?,
          lng = ?,
          sources = ?,
          confidence = ?,
          updated_at = ?
      WHERE id = ?
    `);
    
    stmt.run(
      company.name,
      company.category,
      serialize(company.phones),
      serialize(company.emails),
      company.website || null,
      serialize(company.social),
      company.address || null,
      company.city || null,
      company.country,
      company.lat ?? null,
      company.lng ?? null,
      serialize(company.sources),
      company.confidence,
      now,
      existing.id
    );
    
    return existing.id!;
  } else {
    // Insertion
    const stmt = db.prepare(`
      INSERT INTO companies (
        name, category, phones, emails, website, social,
        address, city, country, lat, lng, sources,
        confidence, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      company.name,
      company.category,
      serialize(company.phones),
      serialize(company.emails),
      company.website || null,
      serialize(company.social),
      company.address || null,
      company.city || null,
      company.country,
      company.lat ?? null,
      company.lng ?? null,
      serialize(company.sources),
      company.confidence,
      now,
      now
    );
    
    return result.lastInsertRowid as number;
  }
}

/**
 * Trouve une entreprise similaire (pour éviter les doublons)
 */
function findSimilar(company: Company): Company | null {
  const db = getDb();
  
  // Chercher par site web
  if (company.website) {
    const domain = normalizeUrlDomain(company.website);
    if (domain) {
      const stmt = db.prepare(`
        SELECT * FROM companies
        WHERE website LIKE ?
        LIMIT 1
      `);
      const row = stmt.get(`%${domain}%`);
      if (row) return rowToCompany(row);
    }
  }
  
  // Chercher par téléphone
  if (company.phones.length > 0) {
    const normalized = normalizePhoneTN(company.phones[0]);
    const stmt = db.prepare(`
      SELECT * FROM companies
      WHERE phones LIKE ?
      LIMIT 1
    `);
    const row = stmt.get(`%${normalized}%`);
    if (row) return rowToCompany(row);
  }
  
  // Chercher par nom + ville
  if (company.name && company.city) {
    const normalizedName = normalizeName(company.name);
    const stmt = db.prepare(`
      SELECT * FROM companies
      WHERE LOWER(name) = ? AND LOWER(city) = ?
      LIMIT 1
    `);
    const row = stmt.get(normalizedName, company.city.toLowerCase());
    if (row) return rowToCompany(row);
  }
  
  return null;
}

/**
 * Liste les entreprises avec filtres
 */
export function listCompanies(query: CompaniesQuery): { items: Company[]; total: number } {
  const db = getDb();
  
  const conditions: string[] = [];
  const params: any[] = [];
  
  if (query.category) {
    conditions.push('category = ?');
    params.push(query.category);
  }
  
  if (query.city) {
    conditions.push('LOWER(city) = LOWER(?)');
    params.push(query.city);
  }
  
  if (query.hasPhone) {
    conditions.push("phones != '[]'");
  }
  
  if (query.q) {
    conditions.push('(LOWER(name) LIKE ? OR LOWER(address) LIKE ?)');
    const searchTerm = `%${query.q.toLowerCase()}%`;
    params.push(searchTerm, searchTerm);
  }
  
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  
  // Compter le total
  const countStmt = db.prepare(`SELECT COUNT(*) as count FROM companies ${whereClause}`);
  const countResult = countStmt.get(...params) as { count: number };
  const total = countResult.count;
  
  // Récupérer les résultats paginés
  const selectStmt = db.prepare(`
    SELECT * FROM companies
    ${whereClause}
    ORDER BY confidence DESC, updated_at DESC
    LIMIT ? OFFSET ?
  `);
  
  const rows = selectStmt.all(...params, query.limit, query.offset);
  const items = rows.map(rowToCompany);
  
  return { items, total };
}

/**
 * Récupère une entreprise par ID
 */
export function getCompanyById(id: number): Company | null {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM companies WHERE id = ?');
  const row = stmt.get(id);
  
  return row ? rowToCompany(row) : null;
}

/**
 * Supprime toutes les entreprises (pour les tests)
 */
export function deleteAllCompanies(): void {
  const db = getDb();
  db.prepare('DELETE FROM companies').run();
}

/**
 * Compte le nombre total d'entreprises
 */
export function countCompanies(): number {
  const db = getDb();
  const result = db.prepare('SELECT COUNT(*) as count FROM companies').get() as { count: number };
  return result.count;
}

/**
 * Insère plusieurs entreprises en transaction
 */
export function bulkUpsertCompanies(companies: Company[]): number {
  return transaction(() => {
    let inserted = 0;
    for (const company of companies) {
      upsertCompany(company);
      inserted++;
    }
    return inserted;
  });
}

/**
 * Insère ou met à jour une entreprise dans la table construction
 */
export function upsertConstruction(company: Omit<Company, 'category' | 'id'>): number {
  const db = getDb();
  const now = new Date().toISOString();
  
  // Chercher une entreprise existante
  const existing = findSimilarInTable(company, 'construction');
  
  if (existing) {
    const stmt = db.prepare(`
      UPDATE construction
      SET name = ?,
          phones = ?,
          emails = ?,
          website = ?,
          social = ?,
          address = ?,
          city = ?,
          country = ?,
          lat = ?,
          lng = ?,
          sources = ?,
          confidence = ?,
          updated_at = ?
      WHERE id = ?
    `);
    
    stmt.run(
      company.name,
      serialize(company.phones),
      serialize(company.emails),
      company.website || null,
      serialize(company.social),
      company.address || null,
      company.city || null,
      company.country,
      company.lat ?? null,
      company.lng ?? null,
      serialize(company.sources),
      company.confidence,
      now,
      existing.id
    );
    
    return existing.id!;
  } else {
    const stmt = db.prepare(`
      INSERT INTO construction (
        name, phones, emails, website, social,
        address, city, country, lat, lng, sources,
        confidence, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      company.name,
      serialize(company.phones),
      serialize(company.emails),
      company.website || null,
      serialize(company.social),
      company.address || null,
      company.city || null,
      company.country,
      company.lat ?? null,
      company.lng ?? null,
      serialize(company.sources),
      company.confidence,
      now,
      now
    );
    
    return result.lastInsertRowid as number;
  }
}

/**
 * Insère ou met à jour une entreprise dans la table fournisseur
 */
export function upsertFournisseur(company: Omit<Company, 'category' | 'id'>): number {
  const db = getDb();
  const now = new Date().toISOString();
  
  // Chercher une entreprise existante
  const existing = findSimilarInTable(company, 'fournisseur');
  
  if (existing) {
    const stmt = db.prepare(`
      UPDATE fournisseur
      SET name = ?,
          phones = ?,
          emails = ?,
          website = ?,
          social = ?,
          address = ?,
          city = ?,
          country = ?,
          lat = ?,
          lng = ?,
          sources = ?,
          confidence = ?,
          updated_at = ?
      WHERE id = ?
    `);
    
    stmt.run(
      company.name,
      serialize(company.phones),
      serialize(company.emails),
      company.website || null,
      serialize(company.social),
      company.address || null,
      company.city || null,
      company.country,
      company.lat ?? null,
      company.lng ?? null,
      serialize(company.sources),
      company.confidence,
      now,
      existing.id
    );
    
    return existing.id!;
  } else {
    const stmt = db.prepare(`
      INSERT INTO fournisseur (
        name, phones, emails, website, social,
        address, city, country, lat, lng, sources,
        confidence, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      company.name,
      serialize(company.phones),
      serialize(company.emails),
      company.website || null,
      serialize(company.social),
      company.address || null,
      company.city || null,
      company.country,
      company.lat ?? null,
      company.lng ?? null,
      serialize(company.sources),
      company.confidence,
      now,
      now
    );
    
    return result.lastInsertRowid as number;
  }
}

/**
 * Trouve une entreprise similaire dans une table spécifique
 */
function findSimilarInTable(company: Omit<Company, 'category' | 'id'>, table: 'construction' | 'fournisseur'): { id: number } | null {
  const db = getDb();
  
  // Chercher par site web
  if (company.website) {
    const domain = normalizeUrlDomain(company.website);
    if (domain) {
      const stmt = db.prepare(`
        SELECT id FROM ${table}
        WHERE website LIKE ?
        LIMIT 1
      `);
      const row = stmt.get(`%${domain}%`) as { id: number } | undefined;
      if (row) return row;
    }
  }
  
  // Chercher par téléphone
  if (company.phones.length > 0) {
    const normalized = normalizePhoneTN(company.phones[0]);
    const stmt = db.prepare(`
      SELECT id FROM ${table}
      WHERE phones LIKE ?
      LIMIT 1
    `);
    const row = stmt.get(`%${normalized}%`) as { id: number } | undefined;
    if (row) return row;
  }
  
  // Chercher par nom + ville
  if (company.name && company.city) {
    const normalizedName = normalizeName(company.name);
    const stmt = db.prepare(`
      SELECT id FROM ${table}
      WHERE LOWER(name) = ? AND LOWER(city) = ?
      LIMIT 1
    `);
    const row = stmt.get(normalizedName, company.city.toLowerCase()) as { id: number } | undefined;
    if (row) return row;
  }
  
  return null;
}

/**
 * Insère plusieurs entreprises dans la table construction
 */
export function bulkUpsertConstruction(companies: Omit<Company, 'category' | 'id'>[]): number {
  return transaction(() => {
    let inserted = 0;
    for (const company of companies) {
      upsertConstruction(company);
      inserted++;
    }
    return inserted;
  });
}

/**
 * Insère plusieurs entreprises dans la table fournisseur
 */
export function bulkUpsertFournisseur(companies: Omit<Company, 'category' | 'id'>[]): number {
  return transaction(() => {
    let inserted = 0;
    for (const company of companies) {
      upsertFournisseur(company);
      inserted++;
    }
    return inserted;
  });
}

/**
 * Convertit une ligne de construction/fournisseur en objet
 */
function rowToCompanyWithoutCategory(row: any): Omit<Company, 'category' | 'id'> {
  return {
    name: row.name,
    phones: deserialize<string[]>(row.phones),
    emails: deserialize<string[]>(row.emails),
    website: row.website,
    social: deserialize<string[]>(row.social),
    address: row.address,
    city: row.city,
    country: row.country,
    lat: row.lat,
    lng: row.lng,
    sources: deserialize<any[]>(row.sources),
    confidence: row.confidence,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Récupère toutes les entreprises de construction
 */
export function getAllConstruction(limit?: number, offset?: number): {
  items: Omit<Company, 'category' | 'id'>[];
  total: number;
} {
  const db = getDb();
  
  // Compter le total
  const countResult = db.prepare('SELECT COUNT(*) as count FROM construction').get() as { count: number };
  const total = countResult.count;
  
  // Récupérer les résultats
  let query = 'SELECT * FROM construction ORDER BY confidence DESC, updated_at DESC';
  const params: any[] = [];
  
  if (limit !== undefined) {
    query += ' LIMIT ?';
    params.push(limit);
    
    if (offset !== undefined) {
      query += ' OFFSET ?';
      params.push(offset);
    }
  }
  
  const stmt = db.prepare(query);
  const rows = stmt.all(...params);
  const items = rows.map(rowToCompanyWithoutCategory);
  
  return { items, total };
}

/**
 * Récupère toutes les entreprises fournisseur
 */
export function getAllFournisseur(limit?: number, offset?: number): {
  items: Omit<Company, 'category' | 'id'>[];
  total: number;
} {
  const db = getDb();
  
  // Compter le total
  const countResult = db.prepare('SELECT COUNT(*) as count FROM fournisseur').get() as { count: number };
  const total = countResult.count;
  
  // Récupérer les résultats
  let query = 'SELECT * FROM fournisseur ORDER BY confidence DESC, updated_at DESC';
  const params: any[] = [];
  
  if (limit !== undefined) {
    query += ' LIMIT ?';
    params.push(limit);
    
    if (offset !== undefined) {
      query += ' OFFSET ?';
      params.push(offset);
    }
  }
  
  const stmt = db.prepare(query);
  const rows = stmt.all(...params);
  const items = rows.map(rowToCompanyWithoutCategory);
  
  return { items, total };
}

