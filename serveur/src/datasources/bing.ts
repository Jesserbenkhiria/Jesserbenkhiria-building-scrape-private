import fetch from 'node-fetch';
import { env } from '../config/env';
import { Throttle, delay } from '../lib/http';
import { buildBingQuery } from '../lib/keywords';
import type { BingResult, Company } from '../types';

const BING_ENDPOINT = 'https://api.bing.microsoft.com/v7.0/search';

const throttle = new Throttle(env.REQUESTS_PER_SECOND);

/**
 * Recherche sur Bing Web Search API
 */
export async function searchBing(
  query: string,
  count: number = 20,
  offset: number = 0
): Promise<BingResult[]> {
  if (!env.BING_KEY) {
    throw new Error('BING_KEY manquante');
  }
  
  return throttle.execute(async () => {
    const url = new URL(BING_ENDPOINT);
    url.searchParams.set('q', query);
    url.searchParams.set('count', count.toString());
    url.searchParams.set('offset', offset.toString());
    url.searchParams.set('mkt', 'fr-TN');
    
    const headers: Record<string, string> = {};
    if (env.BING_KEY) {
      headers['Ocp-Apim-Subscription-Key'] = env.BING_KEY;
    }
    
    const response = await fetch(url.toString(), {
      headers,
    });
    
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Bing API error ${response.status}: ${text}`);
    }
    
    const data = await response.json();
    
    if (!data.webPages?.value) {
      return [];
    }
    
    return data.webPages.value.map((item: any) => ({
      name: item.name,
      url: item.url,
      snippet: item.snippet || '',
    }));
  });
}

/**
 * Construit des requêtes pour Bing
 */
export function buildBingQueries(
  keyword: string,
  city: string
): string[] {
  const queries = [];
  
  // Requête principale avec site:.tn
  queries.push(buildBingQuery(keyword, city));
  
  // Requête sans restriction de site pour trouver des pages Facebook/Instagram
  queries.push(`${keyword} ${city} Tunisie`);
  
  return queries;
}

/**
 * Convertit les résultats Bing en candidats Company
 */
export function resultsToCandidates(
  results: BingResult[],
  category: 'construction' | 'fournisseur',
  city: string
): Company[] {
  return results.map(result => ({
    name: result.name,
    category,
    city,
    website: result.url,
    phones: [],
    emails: [],
    social: [],
    country: 'Tunisie',
    sources: [
      {
        kind: 'bing' as const,
        url: result.url,
        timestamp: new Date().toISOString(),
      },
    ],
    confidence: 0.5, // Confiance moyenne pour Bing
  }));
}

/**
 * Recherche complète pour une paire keyword/city
 */
export async function searchBingForKeywordCity(
  keyword: string,
  city: string,
  category: 'construction' | 'fournisseur',
  limit: number = 30
): Promise<Company[]> {
  const queries = buildBingQueries(keyword, city);
  const allCandidates: Company[] = [];
  
  for (const query of queries) {
    try {
      const results = await searchBing(query, limit);
      const candidates = resultsToCandidates(results, category, city);
      allCandidates.push(...candidates);
      
      // Petit délai entre les requêtes
      await delay(300);
    } catch (error) {
      console.error(`Erreur recherche Bing pour "${query}":`, error);
    }
  }
  
  return allCandidates;
}

