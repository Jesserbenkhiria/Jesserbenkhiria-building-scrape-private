import fetch from 'node-fetch';
import { env } from '../config/env';
import { Throttle, delay } from '../lib/http';
import type { Company } from '../types';

const SERPAPI_ENDPOINT = 'https://serpapi.com/search.json';
const throttle = new Throttle(env.REQUESTS_PER_SECOND);

interface SerpApiLocalResult {
  position?: number;
  title?: string;
  rating?: number;
  reviews_original?: string;
  reviews?: number;
  price?: string;
  type?: string;
  address?: string;
  hours?: string;
  description?: string;
  place_id?: string;
  lsig?: string;
  thumbnail?: string;
  gps_coordinates?: {
    latitude?: number;
    longitude?: number;
  };
  links?: {
    website?: string;
    directions?: string;
    phone?: string;
    order?: string;
  };
}

interface SerpApiResponse {
  search_metadata?: any;
  local_results?: SerpApiLocalResult[];
}

export async function serpapiLocalSearch(q: string, city: string, num: number = 20): Promise<SerpApiLocalResult[]> {
  if (!env.SERPAPI_KEY) {
    throw new Error('SERPAPI_KEY manquante');
  }

  return throttle.execute(async () => {
    // Construire la requête: inclure la ville dans q pour éviter les erreurs de location non supportée
    const baseQuery = `${q} ${city} Tunisia`;

    const buildUrl = (query: string) => {
      const url = new URL(SERPAPI_ENDPOINT);
      url.searchParams.set('engine', 'google_local');
      url.searchParams.set('q', query);
      url.searchParams.set('hl', 'fr');
      url.searchParams.set('gl', 'tn');
      url.searchParams.set('api_key', env.SERPAPI_KEY!);
      // Optionnel: url.searchParams.set('device', 'desktop');
      return url.toString();
    };

    // Premier essai: q = baseQuery
    let response = await fetch(buildUrl(baseQuery), { method: 'GET' });

    // Fallback: si 400, essayer sans "Tunisia"
    if (!response.ok && response.status === 400) {
      const altQuery = `${q} ${city}`;
      response = await fetch(buildUrl(altQuery), { method: 'GET' });
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`SerpApi error ${response.status}: ${text}`);
    }

    const data = (await response.json()) as SerpApiResponse;
    return data.local_results || [];
  });
}

export function serpapiLocalToCompanies(results: SerpApiLocalResult[], city: string, searchKeyword: string): Company[] {
  return results.map((r): Company => {
    const c: any = {
      name: r.title || searchKeyword,
      category: 'fournisseur',
      searchKeyword,
      phones: r.links?.phone ? [r.links.phone] : [],
      emails: [],
      website: r.links?.website,
      social: [],
      address: r.address,
      city,
      country: 'Tunisie',
      lat: r.gps_coordinates?.latitude,
      lng: r.gps_coordinates?.longitude,
      sources: [
        {
          kind: 'serper', // compat existante
          url: undefined,
          timestamp: new Date().toISOString(),
        },
      ],
      confidence: 0.65,
    };
    if (typeof r.rating === 'number') c.rating = r.rating;
    if (typeof r.reviews === 'number') c.reviews = r.reviews;
    return c as Company;
  });
}

export async function searchSerpApiLocalForKeywordCity(keyword: string, city: string, limit: number = 20): Promise<Company[]> {
  const pageSize = Math.min(limit, 20);
  const results = await serpapiLocalSearch(keyword, city, pageSize);
  const candidates = serpapiLocalToCompanies(results, city, keyword);
  await delay(200);
  return candidates;
}
