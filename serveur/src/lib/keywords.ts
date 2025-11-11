// Mots-clés pour les recherches - Liste complète étendue
export const CONSTRUCTION_KEYWORDS = [
  'bureau de construction',
  "bureau d'études",
  "bureau d'études bâtiment",
  "bureau d'études génie civil",
  "bureau d'études structure",
  'entreprise de construction',
  'entreprise construction',
  'entreprise bâtiment',
  'entreprise bâtiment Tunisie',
  'constructeur bâtiment',
  "maître d'œuvre",
  "maître d'ouvrage",
  'contractant général',
  'entreprise travaux publics',
  'travaux de construction',
  'ingénierie bâtiment',
  'génie civil Tunisie',
  'bureau architecte',
  "cabinet d'architecture",
  'architecte Tunisie',
  'bureau ingénieur',
  "bureau d'ingénierie",
  'construction gros œuvre',
  'chantier bâtiment',
  'bureau étude',
  'bureau etude',
  'bureau études',
  'bureau architecture',
  'entreprise bâtiment génie civil',
  'entreprise aménagement extérieur',
  'entreprise terrassement',
  'entreprise maçonnerie',
  'entreprise charpente',
  'entreprise couverture',
  'entreprise plomberie',
  'entreprise électricité',
  'entreprise peinture',
  'entreprise menuiserie',
  'entreprise plâtrerie',
  'entreprise étanchéité',
  'entreprise second œuvre',
  'société de construction',
  'entrepreneur bâtiment',
  'construction métallique',
  'construction béton',
];

// Mots-clés à EXCLURE (immobilier non pertinent)
export const EXCLUDED_KEYWORDS = [
  'agence immobilière',
  'agence immobiliere',
  'immobilier',
  'location',
  'vente appartement',
  'vente maison',
  'achat',
  'investissement immobilier',
  'résidence',
  'lotissement résidentiel',
  'promoteur résidentiel',
];

export const FOURNISSEUR_KEYWORDS = [
  'fournisseur matériaux',
  'fournisseur matériaux de construction',
  'dépôt matériaux',
  'dépôt matériaux de construction',
  'vente matériaux de construction',
  'grossiste matériaux de construction',
  'magasin matériaux',
  'distributeur matériaux',
  'commerce matériaux bâtiment',
  'fournisseur béton',
  'fournisseur acier',
  'fournisseur ciment',
  'magasin sanitaire',
  'fournisseur sanitaire',
  'fournisseur outils bâtiment',
  'quincaillerie',
  'quincaillerie matériaux',
  'quincaillerie bâtiment',
  'magasin quincaillerie',
  'canqueri',
  'canquerie',
  'cancrerie',
  'canqueri matériaux',
  'canquerie bâtiment',
  'dépôt canquerie',
  'fournisseur canquerie',
  'magasin canquerie',
  'magasin bricolage',
  'fournisseur peinture',
  'fournisseur aluminium',
  'fournisseur menuiserie',
  'fournisseur électricité bâtiment',
  'fournisseur plomberie bâtiment',
  'quincaillerie Tunisie',
  'canquerie Tunisie',
];

export const USINE_KEYWORDS = [
  "verre usine",
  // 'usine fabrication Tunisie',
  // 'usine de production Tunisie',
  // 'usine métallurgie Tunisie',
  // 'usine chimique Tunisie',
  // 'usine textile Tunisie',
  // 'usine agroalimentaire Tunisie',
  // 'usine ciment Tunisie',
  // 'cimenterie Tunisie',
  // 'usine sidérurgie Tunisie',
  // 'usine acier Tunisie',
  // 'usine emballage Tunisie',
  // 'usine plastique Tunisie',
  // 'usine pharmaceutique Tunisie',
  // 'usine électronique Tunisie',
  // 'usine bois Tunisie',
  // 'usine menuiserie aluminium Tunisie',
  // 'usine équipements industriels Tunisie',
  // 'zone industrielle Tunisie',
  // 'usine mécanique Tunisie',
  // 'fabrication industrielle Tunisie',
];

// Gouvernorats de Tunisie
export const GOVERNORATES = [
  'Tunis',
  'Ariana',
  'Ben Arous',
  'Manouba',
  'Nabeul',
  'Bizerte',
  // 'Beja',
  // 'Jendouba',
  // 'Kef',
  // 'Siliana',
  // 'Zaghouan',
  // 'Sousse',
  // 'Monastir',
  // 'Mahdia',
  // 'Kairouan',
  // 'Kasserine',
  // 'Sidi Bouzid',
  'Sfax',
  // 'Gabès',
  // 'Medenine',
  // 'Tataouine',
  // 'Gafsa',
  // 'Tozeur',
  // 'Kebili',
];

export function getKeywordsForCategory(
  category: 'construction' | 'fournisseur' | 'usine'
): string[] {
  if (category === 'construction') return CONSTRUCTION_KEYWORDS;
  if (category === 'fournisseur') return FOURNISSEUR_KEYWORDS;
  return USINE_KEYWORDS;
}

export function* generateQueries(
  category: 'construction' | 'fournisseur' | 'usine',
  cities?: string[]
): Generator<{ keyword: string; city: string; query: string }> {
  const keywords = getKeywordsForCategory(category);
  const targetCities = cities && cities.length > 0 ? cities : GOVERNORATES;

  for (const keyword of keywords) {
    for (const city of targetCities) {
      yield {
        keyword,
        city,
        query: `${keyword} ${city} Tunisie`,
      };
    }
  }
}

export function buildBingQuery(keyword: string, city: string): string {
  return `${keyword} ${city} Tunisie site:.tn`;
}

export function buildGooglePlacesQuery(keyword: string, city: string): string {
  return `${keyword} ${city}, Tunisie`;
}
