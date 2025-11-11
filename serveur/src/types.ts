import { z } from 'zod';

// Schéma pour la source d'information
export const SourceRefSchema = z.object({
  kind: z.enum(['bing', 'googlePlaces', 'serper', 'enrichment']),
  id: z.string().optional(),
  url: z.string().optional(),
  timestamp: z.string().optional(),
});

export type SourceRef = z.infer<typeof SourceRefSchema>;

// Schéma pour une entreprise
export const CompanySchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  category: z.enum(['construction', 'fournisseur', 'usine']),
  searchKeyword: z.string().optional(), // Le mot-clé qui a permis de trouver l'entreprise
  phones: z.array(z.string()).default([]),
  emails: z.array(z.string()).default([]),
  website: z.string().optional(),
  social: z.array(z.string()).default([]),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().default('Tunisie'),
  lat: z.number().optional(),
  lng: z.number().optional(),
  sources: z.array(SourceRefSchema).default([]),
  confidence: z.number().min(0).max(1).default(0.5),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Company = z.infer<typeof CompanySchema>;

// Schéma pour une usine (identique à Company)
export const UsineSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  category: z.enum(['construction', 'fournisseur', 'usine']),
  searchKeyword: z.string().optional(), // Le mot-clé qui a permis de trouver l'usine
  phones: z.array(z.string()).default([]),
  emails: z.array(z.string()).default([]),
  website: z.string().optional(),
  social: z.array(z.string()).default([]),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().default('Tunisie'),
  lat: z.number().optional(),
  lng: z.number().optional(),
  sources: z.array(SourceRefSchema).default([]),
  confidence: z.number().min(0).max(1).default(0.5),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Usine = z.infer<typeof UsineSchema>;

// Schémas pour les requêtes API
export const SearchQuerySchema = z.object({
  category: z.enum(['construction', 'fournisseur']),
  source: z.enum(['places', 'serper', 'all']).default('all'),
  city: z.string().optional(),
  limit: z.number().default(100),
  offset: z.number().default(0),
});

export type SearchQuery = z.infer<typeof SearchQuerySchema>;

export const RunSeedBodySchema = z.object({
  categories: z.array(z.enum(['construction', 'fournisseur'])),
  cities: z.array(z.string()),
  sources: z.array(z.string()).default(['all']),
  limitPerQuery: z.number().default(30),
});

export type RunSeedBody = z.infer<typeof RunSeedBodySchema>;

export const CompaniesQuerySchema = z.object({
  q: z.string().optional(),
  category: z.enum(['construction', 'fournisseur']).optional(),
  city: z.string().optional(),
  hasPhone: z.boolean().optional(),
  limit: z.number().default(100),
  offset: z.number().default(0),
});

export type CompaniesQuery = z.infer<typeof CompaniesQuerySchema>;

// Types pour les résultats des sources de données
export interface BingResult {
  name: string;
  url: string;
  snippet: string;
}

export interface GooglePlaceResult {
  place_id: string;
  name: string;
  formatted_address?: string;
  formatted_phone_number?: string;
  website?: string;
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types?: string[];
}

// Type pour les contacts extraits
export interface ExtractedContacts {
  emails: string[];
  phones: string[];
}
