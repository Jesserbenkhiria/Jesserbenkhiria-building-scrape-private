import { JaroWinklerDistance } from 'natural';
import type { Company } from '../types';
import {
  normalizeName,
  normalizePhoneTN,
  normalizeUrlDomain,
  makeDedupeKey,
  normalizeEmail,
} from './normalize';

const JARO_WINKLER_THRESHOLD = 0.92;

/**
 * Déduplique une liste d'entreprises
 */
export function dedupeCompanies(companies: Company[]): Company[] {
  if (companies.length === 0) return [];
  
  const deduped = new Map<string, Company>();
  const domainIndex = new Map<string, string>(); // domain -> dedupeKey
  const phoneIndex = new Map<string, string>(); // phone -> dedupeKey
  
  for (const company of companies) {
    const dedupeKey = makeDedupeKey(company.name, company.city || '');
    
    // Vérifier si on a déjà cette entreprise par clé exacte
    if (deduped.has(dedupeKey)) {
      const existing = deduped.get(dedupeKey)!;
      deduped.set(dedupeKey, mergeCompanies(existing, company));
      continue;
    }
    
    // Vérifier par domaine
    if (company.website) {
      const domain = normalizeUrlDomain(company.website);
      if (domain && domainIndex.has(domain)) {
        const existingKey = domainIndex.get(domain)!;
        const existing = deduped.get(existingKey)!;
        deduped.set(existingKey, mergeCompanies(existing, company));
        continue;
      }
    }
    
    // Vérifier par téléphone
    let foundByPhone = false;
    for (const phone of company.phones) {
      const normalized = normalizePhoneTN(phone);
      if (phoneIndex.has(normalized)) {
        const existingKey = phoneIndex.get(normalized)!;
        const existing = deduped.get(existingKey)!;
        deduped.set(existingKey, mergeCompanies(existing, company));
        foundByPhone = true;
        break;
      }
    }
    if (foundByPhone) continue;
    
    // Vérifier par similarité de nom (fuzzy match)
    // NE PAS se limiter à la même ville - une entreprise peut avoir plusieurs bureaux
    let foundBySimilarity = false;
    for (const [existingKey, existing] of deduped.entries()) {
      const similarity = JaroWinklerDistance(
        normalizeName(existing.name),
        normalizeName(company.name),
        { ignoreCase: true }
      );
      
      // Seuil plus strict (0.95) pour détecter les vrais doublons même dans différentes villes
      if (similarity >= 0.95) {
        deduped.set(existingKey, mergeCompanies(existing, company));
        foundBySimilarity = true;
        break;
      }
    }
    if (foundBySimilarity) continue;
    
    // Nouvelle entreprise unique
    deduped.set(dedupeKey, company);
    
    // Indexer pour les futures comparaisons
    if (company.website) {
      const domain = normalizeUrlDomain(company.website);
      if (domain) domainIndex.set(domain, dedupeKey);
    }
    
    for (const phone of company.phones) {
      const normalized = normalizePhoneTN(phone);
      phoneIndex.set(normalized, dedupeKey);
    }
  }
  
  return Array.from(deduped.values());
}

/**
 * Fusionne deux entreprises en gardant les meilleures informations
 */
function mergeCompanies(existing: Company, incoming: Company): Company {
  // Fusionner les tableaux de manière unique
  const mergeArrays = <T>(a: T[], b: T[]): T[] => {
    return Array.from(new Set([...a, ...b]));
  };
  
  // Normaliser et fusionner les emails
  const allEmails = mergeArrays(existing.emails, incoming.emails)
    .map(normalizeEmail)
    .filter(Boolean);
  
  // Normaliser et fusionner les téléphones
  const allPhones = mergeArrays(existing.phones, incoming.phones)
    .map(normalizePhoneTN)
    .filter(Boolean);
  
  return {
    ...existing,
    name: existing.name.length > incoming.name.length ? existing.name : incoming.name,
    phones: Array.from(new Set(allPhones)),
    emails: Array.from(new Set(allEmails)),
    website: existing.website || incoming.website,
    social: mergeArrays(existing.social, incoming.social),
    address: existing.address || incoming.address,
    city: existing.city || incoming.city,
    lat: existing.lat ?? incoming.lat,
    lng: existing.lng ?? incoming.lng,
    sources: mergeArrays(existing.sources, incoming.sources),
    confidence: Math.max(existing.confidence, incoming.confidence),
    updated_at: new Date().toISOString(),
  };
}

