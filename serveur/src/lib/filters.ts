import { Company } from '../types';
import { EXCLUDED_KEYWORDS } from './keywords';

/**
 * Filtre les entreprises non pertinentes
 * Exclut les agences immobilières et autres types non désirés
 */
export function isRelevantCompany(company: Company): boolean {
  const name = company.name.toLowerCase();
  const description = (company.address || '').toLowerCase();
  const website = (company.website || '').toLowerCase();
  
  // Vérifier si l'entreprise contient des mots-clés exclus
  for (const excludedKeyword of EXCLUDED_KEYWORDS) {
    const lowerKeyword = excludedKeyword.toLowerCase();
    if (name.includes(lowerKeyword) || description.includes(lowerKeyword) || website.includes(lowerKeyword)) {
      console.debug(`Filtré: "${company.name}" (contient "${excludedKeyword}")`);
      return false;
    }
  }
  
  // Filtrer les types Google Places non pertinents pour la construction
  if (company.category === 'construction') {
    // Vérifier si c'est une agence immobilière via les types
    const excludedTypes = [
      'real_estate_agency',
      'real_estate',
      'lodging',
      'hotel',
      'apartment',
      'residence',
    ];
    
    // Si l'entreprise a des sources avec des types, vérifier
    for (const source of company.sources) {
      if (source.kind === 'googlePlaces' && (source as any).types) {
        const types = (source as any).types as string[];
        for (const type of types) {
          if (excludedTypes.includes(type)) {
            console.debug(`Filtré: "${company.name}" (type Google Places: ${type})`);
            return false;
          }
        }
      }
    }
  }
  
  // Vérifier les patterns spécifiques à exclure
  const excludedPatterns = [
    /\b(agence|agency)\s+(immobilière|immobilier|real\s*estate)\b/i,
    /\b(vente|location)\s+(appartement|maison|villa)\b/i,
    /\b(achat|investissement)\s+immobilier\b/i,
    /\bresidence\s+(de\s+)?luxe\b/i,
    /\blotissement\s+résidentiel\b/i,
  ];
  
  for (const pattern of excludedPatterns) {
    if (pattern.test(name) || pattern.test(description)) {
      console.debug(`Filtré: "${company.name}" (pattern exclu)`);
      return false;
    }
  }
  
  return true;
}

/**
 * Filtre une liste d'entreprises
 */
export function filterRelevantCompanies(companies: Company[]): Company[] {
  return companies.filter(isRelevantCompany);
}

/**
 * Améliore la confiance d'une entreprise basée sur des critères
 */
export function adjustConfidence(company: Company): Company {
  let confidence = company.confidence || 0.5;
  
  // Augmenter la confiance si l'entreprise a beaucoup d'informations
  if (company.phones && company.phones.length > 0) confidence += 0.05;
  if (company.emails && company.emails.length > 0) confidence += 0.05;
  if (company.website) confidence += 0.05;
  if (company.lat && company.lng) confidence += 0.05;
  if (company.address) confidence += 0.03;
  
  // Diminuer la confiance si certaines informations sont suspectes
  if (company.name.length < 3) confidence -= 0.2; // Nom trop court
  if (company.website && company.website.includes('facebook.com')) confidence -= 0.1; // Pas de vrai site
  
  // Ajuster la confiance selon le mot-clé de recherche
  if (company.searchKeyword) {
    const keyword = company.searchKeyword.toLowerCase();
    // Si le mot-clé est très spécifique et pertinent
    const highQualityKeywords = [
      'bureau d\'études',
      'génie civil',
      'ingénierie',
      'maître d\'œuvre',
      'entreprise bâtiment',
    ];
    
    if (highQualityKeywords.some(k => keyword.includes(k))) {
      confidence += 0.1;
    }
  }
  
  // S'assurer que la confiance reste entre 0 et 1
  confidence = Math.max(0, Math.min(1, confidence));
  
  return {
    ...company,
    confidence,
  };
}

