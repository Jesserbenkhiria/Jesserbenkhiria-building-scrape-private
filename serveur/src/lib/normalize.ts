import { remove as removeDiacritics } from 'diacritics';

/**
 * Normalise un nom d'entreprise
 */
export function normalizeName(name: string): string {
  if (!name) return '';
  
  let normalized = name.toLowerCase().trim();
  
  // Supprimer les diacritiques
  normalized = removeDiacritics(normalized);
  
  // Supprimer les suffixes légaux
  const legalSuffixes = [
    'sarl',
    's.a.r.l',
    's.a.r.l.',
    'sa',
    's.a',
    's.a.',
    'suarl',
    's.u.a.r.l',
    's.u.a.r.l.',
    'eurl',
    'entreprise',
    'ste',
    'societe',
    'société',
    'company',
    'co',
    'ltd',
    'limited',
  ];
  
  for (const suffix of legalSuffixes) {
    const pattern = new RegExp(`\\b${suffix}\\b`, 'gi');
    normalized = normalized.replace(pattern, '');
  }
  
  // Nettoyer les espaces multiples et la ponctuation
  normalized = normalized
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  return normalized;
}

/**
 * Normalise un numéro de téléphone tunisien
 */
export function normalizePhoneTN(phone: string): string {
  if (!phone) return '';
  
  // Supprimer tout sauf les chiffres et le +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // Si le numéro commence par 00216, le remplacer par +216
  if (cleaned.startsWith('00216')) {
    cleaned = '+216' + cleaned.slice(5);
  }
  
  // Si le numéro commence par 216 sans +, ajouter le +
  if (cleaned.startsWith('216') && !cleaned.startsWith('+216')) {
    cleaned = '+' + cleaned;
  }
  
  // Si le numéro commence par 0 ou autre chose, supposer qu'il est local
  if (!cleaned.startsWith('+216') && cleaned.length === 8) {
    cleaned = '+216' + cleaned;
  }
  
  // Formater : +216 XX XXX XXX
  if (cleaned.startsWith('+216') && cleaned.length === 12) {
    const digits = cleaned.slice(4);
    return `+216 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
  }
  
  return cleaned;
}

/**
 * Extrait le domaine d'une URL
 */
export function normalizeUrlDomain(url: string): string {
  if (!url) return '';
  
  try {
    const parsed = new URL(url);
    let domain = parsed.hostname.toLowerCase();
    
    // Supprimer www.
    domain = stripWww(domain);
    
    return domain;
  } catch {
    return '';
  }
}

/**
 * Supprime www. d'un domaine
 */
export function stripWww(domain: string): string {
  return domain.replace(/^www\./, '');
}

/**
 * Crée une clé déterministe pour le dédoublonnage
 */
export function makeDedupeKey(name: string, city: string): string {
  const normalizedName = normalizeName(name);
  const normalizedCity = city ? city.toLowerCase().trim() : '';
  return `${normalizedName}|${normalizedCity}`;
}

/**
 * Normalise une adresse email
 */
export function normalizeEmail(email: string): string {
  if (!email) return '';
  return email.toLowerCase().trim();
}

