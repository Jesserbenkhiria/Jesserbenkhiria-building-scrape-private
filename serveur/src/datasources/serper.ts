import fetch from 'node-fetch';
import { env } from '../config/env';
import { Throttle, delay } from '../lib/http';
import type { Company } from '../types';

const SERPER_ENDPOINT = 'https://google.serper.dev/search';

const throttle = new Throttle(env.REQUESTS_PER_SECOND);

interface SerperResult {
  title: string;
  link: string;
  snippet: string;
  position?: number;
}

interface SerperResponse {
  organic?: SerperResult[];
  answerBox?: any;
  peopleAlsoAsk?: any[];
  relatedSearches?: any[];
}

/**
 * Recherche via Serper.dev (Google Search)
 * Serper API supports up to 100 results per query
 */
export async function searchSerper(query: string, num: number = 100): Promise<SerperResult[]> {
  if (!env.SERPER_KEY) {
    throw new Error('SERPER_KEY manquante');
  }

  return throttle.execute(async () => {
    const response = await fetch(SERPER_ENDPOINT, {
      method: 'POST',
      headers: {
        'X-API-KEY': env.SERPER_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        num,
        gl: 'tn', // Tunisie
        hl: 'fr', // Français
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Serper API error ${response.status}: ${text}`);
    }

    const data = (await response.json()) as SerperResponse;

    return data.organic || [];
  });
}

/**
 * Construit des requêtes pour Serper
 * Note: Serper doesn't allow site: operator or certain query patterns
 * Using simple, clean queries that Serper accepts
 */
export function buildSerperQueries(keyword: string, city: string): string[] {
  const queries = [];

  // Requête principale - simple format
  queries.push(`${keyword} ${city} Tunisie`);

  // Alternative variation
  queries.push(`${keyword} à ${city}`);

  return queries;
}

/**
 * Convertit les résultats Serper en candidats Company
 */
export function serperResultsToCandidates(
  results: SerperResult[],
  category: 'construction' | 'fournisseur',
  city: string,
  searchKeyword?: string
): Company[] {
  return results.map(result => ({
    name: result.title,
    category,
    searchKeyword, // Ajout du mot-clé de recherche
    city,
    website: result.link,
    phones: [],
    emails: [],
    social: [],
    country: 'Tunisie',
    sources: [
      {
        kind: 'serper' as const,
        url: result.link,
        timestamp: new Date().toISOString(),
      },
    ],
    confidence: 0.6, // Confiance moyenne pour Serper
  }));
}

/**
 * Recherche complète pour une paire keyword/city
 * Serper API allows up to 100 results per query, but we'll use 100 to get maximum
 */
export async function searchSerperForKeywordCity(
  keyword: string,
  city: string,
  category: 'construction' | 'fournisseur',
  limit: number = 100 // Increased default to get more results
): Promise<Company[]> {
  const queries = buildSerperQueries(keyword, city);
  const allCandidates: Company[] = [];

  for (const query of queries) {
    try {
      // Serper allows up to 100 results per query
      const maxResults = Math.min(limit, 100);
      const results = await searchSerper(query, maxResults);
      const candidates = serperResultsToCandidates(results, category, city, keyword);
      allCandidates.push(...candidates);

      // Petit délai entre les requêtes
      await delay(300);
    } catch (error) {
      console.error(`Erreur recherche Serper pour "${query}":`, error);
    }
  }

  return allCandidates;
}
