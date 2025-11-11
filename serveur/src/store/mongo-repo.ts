import { getMongo } from './mongo';
import type { Company, CompaniesQuery, Usine } from '../types';
import { normalizeName, normalizePhoneTN, normalizeUrlDomain } from '../lib/normalize';
import { ObjectId } from 'mongodb';

/**
 * Convert Company to MongoDB document
 */
function companyToDocument(company: Company): any {
  const doc: any = {
    name: company.name,
    category: company.category,
    searchKeyword: company.searchKeyword || undefined,
    phones: company.phones || [],
    emails: company.emails || [],
    website: company.website || undefined,
    social: company.social || [],
    address: company.address || undefined,
    city: company.city || undefined,
    country: company.country || 'Tunisie',
    lat: company.lat ?? undefined,
    lng: company.lng ?? undefined,
    sources: company.sources || [],
    confidence: company.confidence || 0.5,
    created_at: company.created_at ? new Date(company.created_at) : new Date(),
    updated_at: company.updated_at ? new Date(company.updated_at) : new Date(),
  };

  // Remove undefined values
  Object.keys(doc).forEach(key => {
    if (doc[key] === undefined) {
      delete doc[key];
    }
  });

  return doc;
}

/**
 * Convert MongoDB document to Company
 */
function documentToCompany(doc: any): Company {
  return {
    id: doc._id instanceof ObjectId ? doc._id.toString() : doc._id,
    name: doc.name,
    category: doc.category,
    searchKeyword: doc.searchKeyword,
    phones: doc.phones || [],
    emails: doc.emails || [],
    website: doc.website,
    social: doc.social || [],
    address: doc.address,
    city: doc.city,
    country: doc.country || 'Tunisie',
    lat: doc.lat,
    lng: doc.lng,
    sources: doc.sources || [],
    confidence: doc.confidence || 0.5,
    created_at: doc.created_at ? (doc.created_at instanceof Date ? doc.created_at.toISOString() : doc.created_at) : new Date().toISOString(),
    updated_at: doc.updated_at ? (doc.updated_at instanceof Date ? doc.updated_at.toISOString() : doc.updated_at) : new Date().toISOString(),
  };
}

/**
 * Upsert a company
 */
export async function upsertCompany(company: Company): Promise<string> {
  const db = await getMongo();
  const collection = db.collection('companies');

  const normalizedName = normalizeName(company.name);
  const normalizedPhones = company.phones?.map(p => normalizePhoneTN(p)) || [];
  const normalizedWebsite = company.website ? normalizeUrlDomain(company.website) : undefined;

  // Find existing company
  const existing = await collection.findOne({
    $or: [
      { name: { $regex: new RegExp(`^${normalizedName}$`, 'i') } },
      ...(normalizedWebsite ? [{ website: normalizedWebsite }] : []),
      ...(normalizedPhones.length > 0 ? [{ phones: { $in: normalizedPhones } }] : []),
    ],
  });

  const doc = companyToDocument(company);

  if (existing) {
    // Update existing
    if (existing._id instanceof ObjectId) {
      doc._id = existing._id;
    } else {
      doc._id = new ObjectId(String(existing._id));
    }
    await collection.updateOne({ _id: doc._id }, { $set: doc });
    return doc._id.toString();
  } else {
    // Insert new
    if (company.id) {
      try {
        doc._id = new ObjectId(String(company.id));
      } catch (e) {
        // Invalid ObjectId, let MongoDB generate one
      }
    }
    const result = await collection.insertOne(doc);
    return result.insertedId.toString();
  }
}

/**
 * Bulk upsert companies
 */
export async function bulkUpsertCompanies(companies: Company[]): Promise<number> {
  const db = await getMongo();
  const collection = db.collection('companies');

  let inserted = 0;

  for (const company of companies) {
    try {
      await upsertCompany(company);
      inserted++;
    } catch (error) {
      console.error(`Error upserting company ${company.name}:`, error);
    }
  }

  return inserted;
}

/**
 * List companies with filters
 */
export async function listCompanies(query: CompaniesQuery): Promise<{ items: Company[]; total: number }> {
  const db = await getMongo();
  const collection = db.collection('companies');

  const filter: any = {};

  if (query.category) {
    filter.category = query.category;
  }

  if (query.city) {
    filter.city = { $regex: `^${query.city}$`, $options: 'i' };
  }

  if (query.hasPhone) {
    filter.phones = { $ne: [], $exists: true };
  }

  if (query.q) {
    filter.$or = [
      { name: { $regex: query.q, $options: 'i' } },
      { address: { $regex: query.q, $options: 'i' } },
    ];
  }

  const total = await collection.countDocuments(filter);

  const docs = await collection
    .find(filter)
    .sort({ confidence: -1, updated_at: -1 })
    .skip(query.offset)
    .limit(query.limit)
    .toArray();

  const items = docs.map(documentToCompany);

  return { items, total };
}

/**
 * Get company by ID
 */
export async function getCompanyById(id: string): Promise<Company | null> {
  const db = await getMongo();
  const collection = db.collection('companies');
  
  let doc;
  try {
    doc = await collection.findOne({ _id: new ObjectId(id) });
  } catch {
    return null;
  }
  return doc ? documentToCompany(doc) : null;
}

/**
 * Count companies
 */
export async function countCompanies(): Promise<number> {
  const db = await getMongo();
  const collection = db.collection('companies');
  return await collection.countDocuments({});
}

/**
 * Upsert construction company
 * Returns an object with the ID and whether it's a new company
 */
export async function upsertConstruction(company: Omit<Company, 'category' | 'id'>): Promise<{ id: string; isNew: boolean }> {
  const db = await getMongo();
  const collection = db.collection('construction');

  const normalizedName = normalizeName(company.name);
  const normalizedPhones = company.phones?.map(p => normalizePhoneTN(p)) || [];
  const normalizedWebsite = company.website ? normalizeUrlDomain(company.website) : undefined;

  // Find existing company
  const existing = await collection.findOne({
    $or: [
      { name: { $regex: new RegExp(`^${normalizedName}$`, 'i') } },
      ...(normalizedWebsite ? [{ website: normalizedWebsite }] : []),
      ...(normalizedPhones.length > 0 ? [{ phones: { $in: normalizedPhones } }] : []),
    ],
  });

  const doc: any = {
    name: company.name,
    searchKeyword: company.searchKeyword || undefined,
    phones: company.phones || [],
    emails: company.emails || [],
    website: company.website || undefined,
    social: company.social || [],
    address: company.address || undefined,
    city: company.city || undefined,
    country: company.country || 'Tunisie',
    lat: company.lat ?? undefined,
    lng: company.lng ?? undefined,
    sources: company.sources || [],
    confidence: company.confidence || 0.5,
    created_at: company.created_at ? new Date(company.created_at) : new Date(),
    updated_at: company.updated_at ? new Date(company.updated_at) : new Date(),
  };

  // Remove undefined values
  Object.keys(doc).forEach(key => {
    if (doc[key] === undefined) {
      delete doc[key];
    }
  });

  if (existing) {
    // Company already exists - merge data but don't count as new
    if (existing._id instanceof ObjectId) {
      doc._id = existing._id;
    } else {
      doc._id = new ObjectId(String(existing._id));
    }
    
    // Merge with existing data (keep best info)
    const mergedDoc = {
      ...doc,
      phones: Array.from(new Set([...(existing.phones || []), ...(doc.phones || [])])),
      emails: Array.from(new Set([...(existing.emails || []), ...(doc.emails || [])])),
      social: Array.from(new Set([...(existing.social || []), ...(doc.social || [])])),
      sources: [...(existing.sources || []), ...(doc.sources || [])],
      website: doc.website || existing.website,
      address: doc.address || existing.address,
      lat: doc.lat ?? existing.lat,
      lng: doc.lng ?? existing.lng,
      confidence: Math.max(doc.confidence || 0, existing.confidence || 0),
      updated_at: new Date(),
    };
    
    await collection.updateOne({ _id: doc._id }, { $set: mergedDoc });
    console.log(`   ⚠️  Entreprise existante mise à jour: ${company.name}`);
    return { id: doc._id.toString(), isNew: false };
  } else {
    // Insert new company
    const result = await collection.insertOne(doc);
    console.log(`   ✅ Nouvelle entreprise: ${company.name}`);
    return { id: result.insertedId.toString(), isNew: true };
  }
}

/**
 * Bulk upsert construction companies
 * Returns the number of NEW companies inserted (not updates)
 */
export async function bulkUpsertConstruction(companies: Omit<Company, 'category' | 'id'>[]): Promise<number> {
  const db = await getMongo();
  const collection = db.collection('construction');

  let inserted = 0;

  for (const company of companies) {
    try {
      const result = await upsertConstruction(company);
      // Only count as inserted if it's a new company (not an update)
      if (result.isNew) {
        inserted++;
      }
    } catch (error) {
      console.error(`Error upserting construction company ${company.name}:`, error);
    }
  }

  return inserted;
}

/**
 * Upsert fournisseur company
 * Returns an object with the ID and whether it's a new company
 */
export async function upsertFournisseur(company: Omit<Company, 'category' | 'id'>): Promise<{ id: string; isNew: boolean }> {
  const db = await getMongo();
  const collection = db.collection('fournisseur');

  const normalizedName = normalizeName(company.name);
  const normalizedPhones = company.phones?.map(p => normalizePhoneTN(p)) || [];
  const normalizedWebsite = company.website ? normalizeUrlDomain(company.website) : undefined;

  // Find existing company - chercher par similarité de nom ET par site web/téléphone
  let existing = null;
  
  // D'abord chercher par site web (le plus fiable)
  if (normalizedWebsite) {
    existing = await collection.findOne({ website: normalizedWebsite });
  }
  
  // Ensuite par téléphone
  if (!existing && normalizedPhones.length > 0) {
    existing = await collection.findOne({ phones: { $in: normalizedPhones } });
  }
  
  // Enfin par nom normalisé (attention aux doublons)
  if (!existing) {
    // Chercher une correspondance exacte du nom normalisé
    const namePattern = normalizedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    existing = await collection.findOne({
      name: { $regex: new RegExp(`^${namePattern}$`, 'i') },
    });
  }

  const doc: any = {
    name: company.name,
    searchKeyword: company.searchKeyword || undefined,
    phones: company.phones || [],
    emails: company.emails || [],
    website: company.website || undefined,
    social: company.social || [],
    address: company.address || undefined,
    city: company.city || undefined,
    country: company.country || 'Tunisie',
    lat: company.lat ?? undefined,
    lng: company.lng ?? undefined,
    sources: company.sources || [],
    confidence: company.confidence || 0.5,
    created_at: company.created_at ? new Date(company.created_at) : new Date(),
    updated_at: company.updated_at ? new Date(company.updated_at) : new Date(),
  };

  // Remove undefined values
  Object.keys(doc).forEach(key => {
    if (doc[key] === undefined) {
      delete doc[key];
    }
  });

  if (existing) {
    // Company already exists - merge data but don't count as new
    if (existing._id instanceof ObjectId) {
      doc._id = existing._id;
    } else {
      doc._id = new ObjectId(String(existing._id));
    }
    
    // Merge with existing data (keep best info)
    const mergedDoc = {
      ...doc,
      phones: Array.from(new Set([...(existing.phones || []), ...(doc.phones || [])])),
      emails: Array.from(new Set([...(existing.emails || []), ...(doc.emails || [])])),
      social: Array.from(new Set([...(existing.social || []), ...(doc.social || [])])),
      sources: [...(existing.sources || []), ...(doc.sources || [])],
      website: doc.website || existing.website,
      address: doc.address || existing.address,
      lat: doc.lat ?? existing.lat,
      lng: doc.lng ?? existing.lng,
      confidence: Math.max(doc.confidence || 0, existing.confidence || 0),
      updated_at: new Date(),
    };
    
    await collection.updateOne({ _id: doc._id }, { $set: mergedDoc });
    console.log(`   ⚠️  Entreprise existante mise à jour: ${company.name}`);
    return { id: doc._id.toString(), isNew: false };
  } else {
    // Insert new company
    const result = await collection.insertOne(doc);
    console.log(`   ✅ Nouvelle entreprise: ${company.name}`);
    return { id: result.insertedId.toString(), isNew: true };
  }
}

/**
 * Bulk upsert fournisseur companies
 * Returns the number of NEW companies inserted (not updates)
 */
export async function bulkUpsertFournisseur(companies: Omit<Company, 'category' | 'id'>[]): Promise<number> {
  const db = await getMongo();
  const collection = db.collection('fournisseur');

  let inserted = 0;

  for (const company of companies) {
    try {
      const result = await upsertFournisseur(company);
      // Only count as inserted if it's a new company (not an update)
      if (result.isNew) {
        inserted++;
      }
    } catch (error) {
      console.error(`Error upserting fournisseur company ${company.name}:`, error);
    }
  }

  return inserted;
}

/**
 * Get all construction companies
 */
export async function getAllConstruction(limit?: number, offset?: number, city?: string, searchQuery?: string, keyword?: string): Promise<{
  items: Omit<Company, 'category' | 'id'>[];
  total: number;
}> {
  const db = await getMongo();
  const collection = db.collection('construction');

  const filter: any = {};
  if (city) {
    filter.city = { $regex: `^${city}$`, $options: 'i' };
  }
  
  if (keyword && keyword.trim()) {
    filter.searchKeyword = { $regex: keyword.trim(), $options: 'i' };
  }
  
  if (searchQuery && searchQuery.trim()) {
    const searchRegex = { $regex: searchQuery.trim(), $options: 'i' };
    filter.$or = [
      { name: searchRegex },
      { address: searchRegex },
      { website: searchRegex },
    ];
  }

  const total = await collection.countDocuments(filter);

  let query = collection.find(filter).sort({ created_at: 1 });
  
  if (offset !== undefined) {
    query = query.skip(offset);
  }
  
  if (limit !== undefined) {
    query = query.limit(limit);
  }

  const docs = await query.toArray();
  const items = docs.map(doc => {
    const company = documentToCompany(doc);
    const { category, id, ...rest } = company;
    return rest;
  });

  return { items, total };
}

/**
 * Get all fournisseur companies
 */
export async function getAllFournisseur(limit?: number, offset?: number, city?: string, searchQuery?: string, keyword?: string): Promise<{
  items: Omit<Company, 'category' | 'id'>[];
  total: number;
}> {
  const db = await getMongo();
  const collection = db.collection('fournisseur');

  const filter: any = {};
  if (city) {
    filter.city = { $regex: `^${city}$`, $options: 'i' };
  }
  
  if (keyword && keyword.trim()) {
    filter.searchKeyword = { $regex: keyword.trim(), $options: 'i' };
  }
  
  if (searchQuery && searchQuery.trim()) {
    const searchRegex = { $regex: searchQuery.trim(), $options: 'i' };
    filter.$or = [
      { name: searchRegex },
      { address: searchRegex },
      { website: searchRegex },
    ];
  }

  const total = await collection.countDocuments(filter);

  let query = collection.find(filter).sort({ created_at: 1 });
  
  if (offset !== undefined) {
    query = query.skip(offset);
  }
  
  if (limit !== undefined) {
    query = query.limit(limit);
  }

  const docs = await query.toArray();
  const items = docs.map(doc => {
    const company = documentToCompany(doc);
    const { category, id, ...rest } = company;
    return rest;
  });

  return { items, total };
}

/**
 * Get all unique keywords from a collection
 */
export async function getAllKeywords(category: 'construction' | 'fournisseur'): Promise<string[]> {
  const db = await getMongo();
  const collectionName = category === 'construction' ? 'construction' : 'fournisseur';
  const collection = db.collection(collectionName);

  const keywords = await collection.aggregate([
    { 
      $match: { 
        searchKeyword: { 
          $exists: true, 
          $ne: null,
          $not: { $eq: '' }
        } 
      } 
    },
    { $group: { _id: '$searchKeyword' } },
    { $sort: { _id: 1 } },
  ]).toArray();

  return keywords.map(k => k._id).filter(Boolean).sort();
}

/**
 * Get detailed statistics for a specific category
 */
export async function getCategoryStatistics(category: 'construction' | 'fournisseur'): Promise<any> {
  const db = await getMongo();
  const collectionName = category === 'construction' ? 'construction' : 'fournisseur';
  const collection = db.collection(collectionName);

  // Run all queries in parallel for better performance
  const [
    totalCount,
    companiesByCity,
    companiesByKeyword,
    completeness,
    avgConfidence,
    confidenceHistogram,
    companiesByDate,
    companiesBySource,
    companiesWithCoords,
    topDomains,
    cityKeywordCross,
  ] = await Promise.all([
    // 1. Total count
    collection.countDocuments({}),
    
    // 2. Companies per city
    collection.aggregate([
      { $match: { city: { $exists: true, $ne: null } } },
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 50 },
    ]).toArray(),
    
    // 3. Companies per searchKeyword
    collection.aggregate([
      { $match: { searchKeyword: { $exists: true, $ne: null, $not: { $eq: '' } } } },
      { $group: { _id: '$searchKeyword', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 50 },
    ]).toArray(),
    
    // 4-7. Data completeness (phone, email, website, social)
    collection.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          withPhone: { $sum: { $cond: [{ $gt: [{ $size: { $ifNull: ['$phones', []] } }, 0] }, 1, 0] } },
          withEmail: { $sum: { $cond: [{ $gt: [{ $size: { $ifNull: ['$emails', []] } }, 0] }, 1, 0] } },
          withWebsite: { $sum: { $cond: [{ $ne: ['$website', null] }, 1, 0] } },
          withSocial: { $sum: { $cond: [{ $gt: [{ $size: { $ifNull: ['$social', []] } }, 0] }, 1, 0] } },
        },
      },
    ]).toArray(),
    
    // 8. Average confidence score
    collection.aggregate([
      {
        $group: {
          _id: null,
          avgConfidence: { $avg: '$confidence' },
        },
      },
    ]).toArray(),
    
    // 9. Confidence histogram
    collection.aggregate([
      {
        $bucket: {
          groupBy: '$confidence',
          boundaries: [0, 0.5, 0.6, 0.7, 0.8, 0.9, 1.01],
          default: 'other',
          output: { count: { $sum: 1 } },
        },
      },
    ]).toArray(),
    
    // 10. Companies discovered per day/week (created_at)
    collection.aggregate([
      { $match: { created_at: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$created_at' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 90 }, // Last 90 days
    ]).toArray(),
    
    // 11. Companies per source
    collection.aggregate([
      { $unwind: { path: '$sources', preserveNullAndEmptyArrays: false } },
      { $group: { _id: '$sources.kind', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]).toArray(),
    
    // 12. Companies with coordinates (for heatmap)
    collection.aggregate([
      { $match: { lat: { $exists: true, $ne: null }, lng: { $exists: true, $ne: null } } },
      { $project: { lat: 1, lng: 1, name: 1, city: 1 } },
      { $limit: 10000 }, // Limit for performance
    ]).toArray(),
    
    // 13. Most frequent domains
    collection.aggregate([
      { $match: { website: { $exists: true, $ne: null } } },
      { $project: { website: 1 } },
      { $limit: 5000 },
    ]).toArray(),
    
    // 14. Cross analysis: city × keyword
    collection.aggregate([
      {
        $match: {
          city: { $exists: true, $ne: null },
          searchKeyword: { $exists: true, $ne: null, $not: { $eq: '' } },
        },
      },
      {
        $group: {
          _id: { city: '$city', keyword: '$searchKeyword' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 100 },
    ]).toArray(),
  ]);

  // Process completeness data
  const completenessData = completeness[0] || { total: 0, withPhone: 0, withEmail: 0, withWebsite: 0, withSocial: 0 };
  const total = completenessData.total || totalCount;

  // Process domains
  const domainMap = new Map<string, number>();
  topDomains.forEach((doc: any) => {
    if (doc.website) {
      try {
        const url = new URL(doc.website.startsWith('http') ? doc.website : `https://${doc.website}`);
        const domain = url.hostname.replace('www.', '');
        domainMap.set(domain, (domainMap.get(domain) || 0) + 1);
      } catch (e) {
        // Invalid URL, skip
      }
    }
  });
  const topDomainsList = Array.from(domainMap.entries())
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  // Calculate contactability score (companies with phone + website + email)
  const withAllContacts = await collection.countDocuments({
    $and: [
      { phones: { $exists: true, $ne: [], $not: { $size: 0 } } },
      { website: { $exists: true, $ne: null } },
      { emails: { $exists: true, $ne: [], $not: { $size: 0 } } },
    ],
  });

  // Prepare cross analysis chart data: For each keyword, how many companies in each city
  // Get top keywords
  const topKeywords = companiesByKeyword.slice(0, 10).map((item: any) => item._id);
  
  // Get top cities
  const topCities = companiesByCity.slice(0, 15).map((item: any) => item._id);
  
  // Build data structure: for each city, count companies per keyword
  const cityKeywordCounts = new Map<string, Map<string, number>>();
  topCities.forEach((city: string) => {
    cityKeywordCounts.set(city, new Map<string, number>());
    topKeywords.forEach((keyword: string) => {
      cityKeywordCounts.get(city)!.set(keyword, 0);
    });
  });
  
  // Fill in the counts from cityKeywordCross
  cityKeywordCross.forEach((item: any) => {
    const city = item._id.city;
    const keyword = item._id.keyword;
    if (topCities.includes(city) && topKeywords.includes(keyword)) {
      const cityMap = cityKeywordCounts.get(city);
      if (cityMap) {
        cityMap.set(keyword, item.count);
      }
    }
  });
  
  // Transform to chart data format
  const crossAnalysisChartData = topCities.map((city: string) => {
    const cityData: any = { city };
    const keywordMap = cityKeywordCounts.get(city);
    topKeywords.forEach((keyword: string) => {
      cityData[keyword] = keywordMap ? keywordMap.get(keyword) || 0 : 0;
    });
    return cityData;
  });

  return {
    // 1. Total
    total: totalCount,
    
    // 2. Companies per city
    companiesByCity: companiesByCity.map((item: any) => ({
      city: item._id,
      count: item.count,
    })),
    
    // 3. Companies per searchKeyword
    companiesByKeyword: companiesByKeyword.map((item: any) => ({
      keyword: item._id,
      count: item.count,
    })),
    
    // 4-7. Data completeness percentages
    completeness: {
      phone: total > 0 ? ((completenessData.withPhone / total) * 100).toFixed(2) : '0.00',
      email: total > 0 ? ((completenessData.withEmail / total) * 100).toFixed(2) : '0.00',
      website: total > 0 ? ((completenessData.withWebsite / total) * 100).toFixed(2) : '0.00',
      social: total > 0 ? ((completenessData.withSocial / total) * 100).toFixed(2) : '0.00',
      phoneCount: completenessData.withPhone,
      emailCount: completenessData.withEmail,
      websiteCount: completenessData.withWebsite,
      socialCount: completenessData.withSocial,
      total,
    },
    
    // 8. Average confidence score
    avgConfidence: avgConfidence[0]?.avgConfidence ? (avgConfidence[0].avgConfidence * 100).toFixed(2) : '0.00',
    
    // 9. Confidence histogram
    confidenceHistogram: confidenceHistogram.map((item: any) => ({
      range: item._id === 'other' ? 'other' : `${(item._id * 100).toFixed(0)}-${((item._id + 0.1) * 100).toFixed(0)}%`,
      count: item.count,
    })),
    
    // 10. Companies discovered per day
    companiesByDate: companiesByDate.map((item: any) => ({
      date: item._id,
      count: item.count,
    })),
    
    // 11. Companies per source
    companiesBySource: companiesBySource.map((item: any) => ({
      source: item._id || 'unknown',
      count: item.count,
    })),
    
    // 12. Companies with coordinates (for heatmap)
    companiesWithCoords: companiesWithCoords.map((doc: any) => ({
      lat: doc.lat,
      lng: doc.lng,
      name: doc.name,
      city: doc.city,
    })),
    
    // 13. Most frequent domains
    topDomains: topDomainsList,
    
    // 14. Cross analysis: city × keyword (raw data)
    cityKeywordCross: cityKeywordCross.map((item: any) => ({
      city: item._id.city,
      keyword: item._id.keyword,
      count: item.count,
    })),
    
    // 15. Contactability score
    contactabilityScore: total > 0 ? ((withAllContacts / total) * 100).toFixed(2) : '0.00',
    contactabilityCount: withAllContacts,
    
    // 16. Prepared chart data: Cross analysis chart (keywords per city)
    crossAnalysisChart: crossAnalysisChartData,
    crossAnalysisTopKeywords: topKeywords,
  };
}

/**
 * Convert Usine to MongoDB document
 */
function usineToDocument(usine: Usine): any {
  const doc: any = {
    name: usine.name,
    type: usine.type,
    searchKeyword: (usine as any).searchKeyword || undefined,
    rating: (usine as any).rating ?? undefined,
    reviews: (usine as any).reviews ?? undefined,
    capacity: usine.capacity || undefined,
    products: usine.products || [],
    certifications: usine.certifications || [],
    phones: usine.phones || [],
    emails: usine.emails || [],
    website: usine.website || undefined,
    social: usine.social || [],
    address: usine.address || undefined,
    city: usine.city || undefined,
    country: usine.country || 'Tunisie',
    lat: usine.lat ?? undefined,
    lng: usine.lng ?? undefined,
    sources: usine.sources || [],
    confidence: usine.confidence || 0.5,
    created_at: usine.created_at ? new Date(usine.created_at) : new Date(),
    updated_at: usine.updated_at ? new Date(usine.updated_at) : new Date(),
  };

  // Remove undefined values
  Object.keys(doc).forEach(key => {
    if (doc[key] === undefined) {
      delete doc[key];
    }
  });

  return doc;
}

/**
 * Convert MongoDB document to Usine
 */
function documentToUsine(doc: any): Usine {
  return {
    id: doc._id instanceof ObjectId ? doc._id.toString() : doc._id,
    name: doc.name,
    type: doc.type,
    searchKeyword: doc.searchKeyword,
    rating: doc.rating,
    reviews: doc.reviews,
    capacity: doc.capacity,
    products: doc.products || [],
    certifications: doc.certifications || [],
    phones: doc.phones || [],
    emails: doc.emails || [],
    website: doc.website,
    social: doc.social || [],
    address: doc.address,
    city: doc.city,
    country: doc.country || 'Tunisie',
    lat: doc.lat,
    lng: doc.lng,
    sources: doc.sources || [],
    confidence: doc.confidence || 0.5,
    created_at: doc.created_at ? (doc.created_at instanceof Date ? doc.created_at.toISOString() : doc.created_at) : new Date().toISOString(),
    updated_at: doc.updated_at ? (doc.updated_at instanceof Date ? doc.updated_at.toISOString() : doc.updated_at) : new Date().toISOString(),
  };
}

/**
 * Upsert usine
 * Returns an object with the ID and whether it's a new usine
 */
export async function upsertUsine(usine: Omit<Usine, 'id'>): Promise<{ id: string; isNew: boolean }> {
  const db = await getMongo();
  const collection = db.collection('usine');

  const normalizedName = normalizeName(usine.name);
  const normalizedPhones = usine.phones?.map(p => normalizePhoneTN(p)) || [];
  const normalizedWebsite = usine.website ? normalizeUrlDomain(usine.website) : undefined;

  // Find existing usine
  let existing = null;
  
  // First search by website (most reliable)
  if (normalizedWebsite) {
    existing = await collection.findOne({ website: normalizedWebsite });
  }
  
  // Then by phone
  if (!existing && normalizedPhones.length > 0) {
    existing = await collection.findOne({ phones: { $in: normalizedPhones } });
  }
  
  // Finally by normalized name
  if (!existing) {
    const namePattern = normalizedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    existing = await collection.findOne({
      name: { $regex: new RegExp(`^${namePattern}$`, 'i') },
    });
  }

  const doc = usineToDocument(usine as Usine);

  if (existing) {
    // Usine already exists - merge data
    if (existing._id instanceof ObjectId) {
      doc._id = existing._id;
    } else {
      doc._id = new ObjectId(String(existing._id));
    }
    
    // Merge with existing data (keep best info)
    const mergedDoc = {
      ...doc,
      phones: Array.from(new Set([...(existing.phones || []), ...(doc.phones || [])])),
      emails: Array.from(new Set([...(existing.emails || []), ...(doc.emails || [])])),
      social: Array.from(new Set([...(existing.social || []), ...(doc.social || [])])),
      products: Array.from(new Set([...(existing.products || []), ...(doc.products || [])])),
      certifications: Array.from(new Set([...(existing.certifications || []), ...(doc.certifications || [])])),
      sources: [...(existing.sources || []), ...(doc.sources || [])],
      website: doc.website || existing.website,
      address: doc.address || existing.address,
      capacity: doc.capacity || existing.capacity,
      lat: doc.lat ?? existing.lat,
      lng: doc.lng ?? existing.lng,
      confidence: Math.max(doc.confidence || 0, existing.confidence || 0),
      updated_at: new Date(),
    };
    
    await collection.updateOne({ _id: doc._id }, { $set: mergedDoc });
    console.log(`   ⚠️  Usine existante mise à jour: ${usine.name}`);
    return { id: doc._id.toString(), isNew: false };
  } else {
    // Insert new usine
    const result = await collection.insertOne(doc);
    console.log(`   ✅ Nouvelle usine: ${usine.name}`);
    return { id: result.insertedId.toString(), isNew: true };
  }
}

/**
 * Bulk upsert usines
 * Returns the number of NEW usines inserted (not updates)
 */
export async function bulkUpsertUsine(usines: Omit<Usine, 'id'>[]): Promise<number> {
  const db = await getMongo();
  const collection = db.collection('usine');

  let inserted = 0;

  for (const usine of usines) {
    try {
      const result = await upsertUsine(usine);
      if (result.isNew) {
        inserted++;
      }
    } catch (error) {
      console.error(`Error upserting usine ${usine.name}:`, error);
    }
  }

  return inserted;
}

/**
 * Get all usines
 */
export async function getAllUsines(
  limit?: number, 
  offset?: number, 
  city?: string, 
  searchQuery?: string,
  type?: string,
  keyword?: string
): Promise<{
  items: Omit<Usine, 'id'>[];
  total: number;
}> {
  const db = await getMongo();
  const collection = db.collection('usine');

  const filter: any = {};
  if (city) {
    filter.city = { $regex: `^${city}$`, $options: 'i' };
  }
  
  if (type && type.trim()) {
    filter.type = type.trim();
  }
  
  if (keyword && keyword.trim()) {
    filter.searchKeyword = { $regex: keyword.trim(), $options: 'i' };
  }
  
  if (searchQuery && searchQuery.trim()) {
    const searchRegex = { $regex: searchQuery.trim(), $options: 'i' };
    filter.$or = [
      { name: searchRegex },
      { address: searchRegex },
      { website: searchRegex },
      { products: searchRegex },
    ];
  }

  const total = await collection.countDocuments(filter);

  let query = collection.find(filter).sort({ created_at: -1 });
  
  if (offset !== undefined) {
    query = query.skip(offset);
  }
  
  if (limit !== undefined) {
    query = query.limit(limit);
  }

  const docs = await query.toArray();
  const items = docs.map(doc => {
    const usine = documentToUsine(doc);
    const { id, ...rest } = usine;
    return rest;
  });

  return { items, total };
}

/**
 * Get usine by ID
 */
export async function getUsineById(id: string): Promise<Usine | null> {
  const db = await getMongo();
  const collection = db.collection('usine');
  
  let doc;
  try {
    doc = await collection.findOne({ _id: new ObjectId(id) });
  } catch {
    return null;
  }
  return doc ? documentToUsine(doc) : null;
}

/**
 * Count usines
 */
export async function countUsines(): Promise<number> {
  const db = await getMongo();
  const collection = db.collection('usine');
  return await collection.countDocuments({});
}

/**
 * Get all unique types from usine collection
 */
export async function getAllUsineTypes(): Promise<string[]> {
  const db = await getMongo();
  const collection = db.collection('usine');

  const types = await collection.aggregate([
    { 
      $match: { 
        type: { 
          $exists: true, 
          $ne: null,
          $not: { $eq: '' }
        } 
      } 
    },
    { $group: { _id: '$type' } },
    { $sort: { _id: 1 } },
  ]).toArray();

  return types.map(t => t._id).filter(Boolean).sort();
}

/**
 * Get all unique search keywords from usine collection
 */
export async function getAllUsineKeywords(): Promise<string[]> {
  const db = await getMongo();
  const collection = db.collection('usine');

  const keywords = await collection.aggregate([
    { 
      $match: { 
        searchKeyword: { 
          $exists: true, 
          $ne: null,
          $not: { $eq: '' }
        } 
      } 
    },
    { $group: { _id: '$searchKeyword' } },
    { $sort: { _id: 1 } },
  ]).toArray();

  return keywords.map(k => k._id).filter(Boolean).sort();
}

/**
 * Get statistics for dashboard (optimized with MongoDB aggregations)
 */
export async function getStatistics(): Promise<any> {
  const db = await getMongo();
  const constructionCollection = db.collection('construction');
  const fournisseurCollection = db.collection('fournisseur');

  // Run all queries in parallel for better performance
  const [
    constructionCount,
    fournisseurCount,
    constructionByCity,
    fournisseurByCity,
    constructionCompleteness,
    fournisseurCompleteness,
    constructionSources,
    fournisseurSources,
    constructionConfidence,
    fournisseurConfidence,
    constructionDomains,
    fournisseurDomains,
  ] = await Promise.all([
    // Counts
    constructionCollection.countDocuments({}),
    fournisseurCollection.countDocuments({}),
    
    // Cities
    constructionCollection.aggregate([
      { $match: { city: { $exists: true, $ne: null } } },
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]).toArray(),
    fournisseurCollection.aggregate([
      { $match: { city: { $exists: true, $ne: null } } },
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]).toArray(),
    
    // Data completeness (using aggregation instead of loading all data)
    constructionCollection.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          withPhone: { $sum: { $cond: [{ $gt: [{ $size: { $ifNull: ['$phones', []] } }, 0] }, 1, 0] } },
          withEmail: { $sum: { $cond: [{ $gt: [{ $size: { $ifNull: ['$emails', []] } }, 0] }, 1, 0] } },
          withWebsite: { $sum: { $cond: [{ $ne: ['$website', null] }, 1, 0] } },
          withSocial: { $sum: { $cond: [{ $gt: [{ $size: { $ifNull: ['$social', []] } }, 0] }, 1, 0] } },
          withCoordinates: { $sum: { $cond: [{ $and: [{ $ne: ['$lat', null] }, { $ne: ['$lng', null] }] }, 1, 0] } },
        },
      },
    ]).toArray(),
    fournisseurCollection.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          withPhone: { $sum: { $cond: [{ $gt: [{ $size: { $ifNull: ['$phones', []] } }, 0] }, 1, 0] } },
          withEmail: { $sum: { $cond: [{ $gt: [{ $size: { $ifNull: ['$emails', []] } }, 0] }, 1, 0] } },
          withWebsite: { $sum: { $cond: [{ $ne: ['$website', null] }, 1, 0] } },
          withSocial: { $sum: { $cond: [{ $gt: [{ $size: { $ifNull: ['$social', []] } }, 0] }, 1, 0] } },
          withCoordinates: { $sum: { $cond: [{ $and: [{ $ne: ['$lat', null] }, { $ne: ['$lng', null] }] }, 1, 0] } },
        },
      },
    ]).toArray(),
    
    // Sources breakdown
    constructionCollection.aggregate([
      { $unwind: { path: '$sources', preserveNullAndEmptyArrays: true } },
      { $group: { _id: '$sources.kind', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]).toArray(),
    fournisseurCollection.aggregate([
      { $unwind: { path: '$sources', preserveNullAndEmptyArrays: true } },
      { $group: { _id: '$sources.kind', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]).toArray(),
    
    // Confidence distribution
    constructionCollection.aggregate([
      {
        $bucket: {
          groupBy: '$confidence',
          boundaries: [0, 0.6, 0.7, 0.8, 0.9, 1.01],
          default: 'other',
          output: { count: { $sum: 1 } },
        },
      },
    ]).toArray(),
    fournisseurCollection.aggregate([
      {
        $bucket: {
          groupBy: '$confidence',
          boundaries: [0, 0.6, 0.7, 0.8, 0.9, 1.01],
          default: 'other',
          output: { count: { $sum: 1 } },
        },
      },
    ]).toArray(),
    
    // Top domains (only fetch websites, not all data)
    constructionCollection.aggregate([
      { $match: { website: { $exists: true, $ne: null } } },
      { $project: { website: 1 } },
      { $limit: 1000 }, // Limit to avoid processing too many
    ]).toArray(),
    fournisseurCollection.aggregate([
      { $match: { website: { $exists: true, $ne: null } } },
      { $project: { website: 1 } },
      { $limit: 1000 }, // Limit to avoid processing too many
    ]).toArray(),
  ]);

  const totalCompanies = constructionCount + fournisseurCount;

  // Merge city stats
  const cityStatsMap = new Map<string, number>();
  constructionByCity.forEach((item: any) => {
    cityStatsMap.set(item._id, (cityStatsMap.get(item._id) || 0) + item.count);
  });
  fournisseurByCity.forEach((item: any) => {
    cityStatsMap.set(item._id, (cityStatsMap.get(item._id) || 0) + item.count);
  });
  const companiesByCity = Array.from(cityStatsMap.entries())
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  // Merge completeness stats
  const constCompleteness = constructionCompleteness[0] || { total: 0, withPhone: 0, withEmail: 0, withWebsite: 0, withSocial: 0, withCoordinates: 0 };
  const fourCompleteness = fournisseurCompleteness[0] || { total: 0, withPhone: 0, withEmail: 0, withWebsite: 0, withSocial: 0, withCoordinates: 0 };
  const withPhone = constCompleteness.withPhone + fourCompleteness.withPhone;
  const withEmail = constCompleteness.withEmail + fourCompleteness.withEmail;
  const withWebsite = constCompleteness.withWebsite + fourCompleteness.withWebsite;
  const withSocial = constCompleteness.withSocial + fourCompleteness.withSocial;
  const withCoordinates = constCompleteness.withCoordinates + fourCompleteness.withCoordinates;

  // Merge sources
  const sourcesMap = new Map<string, number>();
  [...constructionSources, ...fournisseurSources].forEach((item: any) => {
    if (item._id) {
      sourcesMap.set(item._id, (sourcesMap.get(item._id) || 0) + item.count);
    }
  });
  const sourcesBreakdown = Array.from(sourcesMap.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);

  // Merge confidence distribution
  const confidenceMap = new Map<string, number>();
  const ranges = ['0.0-0.6', '0.6-0.7', '0.7-0.8', '0.8-0.9', '0.9-1.0'];
  [...constructionConfidence, ...fournisseurConfidence].forEach((item: any, index: number) => {
    const range = ranges[Math.min(index, ranges.length - 1)];
    confidenceMap.set(range, (confidenceMap.get(range) || 0) + (item.count || 0));
  });
  const confidenceDistribution = ranges.map(range => ({
    range,
    count: confidenceMap.get(range) || 0,
  }));

  // Process domains (only from limited set)
  const domainMap = new Map<string, number>();
  [...constructionDomains, ...fournisseurDomains].forEach((item: any) => {
    if (item.website) {
      try {
        const url = new URL(item.website.startsWith('http') ? item.website : `https://${item.website}`);
        const domain = url.hostname.replace('www.', '');
        domainMap.set(domain, (domainMap.get(domain) || 0) + 1);
      } catch (e) {
        // Invalid URL
      }
    }
  });
  const topDomains = Array.from(domainMap.entries())
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Growth over time (optimized - single aggregation per collection)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const [constructionGrowth, fournisseurGrowth] = await Promise.all([
    constructionCollection.aggregate([
      { $match: { created_at: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]).toArray(),
    fournisseurCollection.aggregate([
      { $match: { created_at: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]).toArray(),
  ]);

  // Create growth map for last 30 days
  const growthMap = new Map<string, { construction: number; fournisseur: number }>();
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    date.setHours(0, 0, 0, 0);
    const dateStr = date.toISOString().split('T')[0];
    growthMap.set(dateStr, { construction: 0, fournisseur: 0 });
  }

  constructionGrowth.forEach((item: any) => {
    const existing = growthMap.get(item._id) || { construction: 0, fournisseur: 0 };
    existing.construction = item.count;
    growthMap.set(item._id, existing);
  });

  fournisseurGrowth.forEach((item: any) => {
    const existing = growthMap.get(item._id) || { construction: 0, fournisseur: 0 };
    existing.fournisseur = item.count;
    growthMap.set(item._id, existing);
  });

  const growthByDay = Array.from(growthMap.entries()).map(([date, counts]) => ({
    date,
    construction: counts.construction,
    fournisseur: counts.fournisseur,
    total: counts.construction + counts.fournisseur,
  }));

  return {
    overview: {
      totalCompanies,
      constructionCount,
      fournisseurCount,
    },
    companiesByCity,
    dataCompleteness: {
      total: totalCompanies,
      withPhone,
      withEmail,
      withWebsite,
      withSocial,
      withCoordinates,
      phonePercentage: totalCompanies > 0 ? Math.round((withPhone / totalCompanies) * 100) : 0,
      emailPercentage: totalCompanies > 0 ? Math.round((withEmail / totalCompanies) * 100) : 0,
      websitePercentage: totalCompanies > 0 ? Math.round((withWebsite / totalCompanies) * 100) : 0,
      socialPercentage: totalCompanies > 0 ? Math.round((withSocial / totalCompanies) * 100) : 0,
      coordinatesPercentage: totalCompanies > 0 ? Math.round((withCoordinates / totalCompanies) * 100) : 0,
    },
    sourcesBreakdown,
    confidenceDistribution,
    growthOverTime: growthByDay,
    topDomains,
  };
}
