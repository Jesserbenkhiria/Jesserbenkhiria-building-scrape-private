import fetch from 'node-fetch';
import { env } from '../config/env';
import { Throttle, delay } from '../lib/http';
import { buildGooglePlacesQuery } from '../lib/keywords';
import type { GooglePlaceResult, Company } from '../types';

const TEXT_SEARCH_ENDPOINT = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
const DETAILS_ENDPOINT = 'https://maps.googleapis.com/maps/api/place/details/json';

const throttle = new Throttle(env.REQUESTS_PER_SECOND);

/**
 * Recherche textuelle Google Places
 */
export async function textSearch(
  query: string,
  pageToken?: string
): Promise<{ results: GooglePlaceResult[]; nextPageToken?: string }> {
  if (!env.GOOGLE_PLACES_KEY) {
    throw new Error('GOOGLE_PLACES_KEY manquante');
  }

  return throttle.execute(async () => {
    const url = new URL(TEXT_SEARCH_ENDPOINT);
    url.searchParams.set('query', query);
    url.searchParams.set('key', env.GOOGLE_PLACES_KEY!);

    if (pageToken) {
      url.searchParams.set('pagetoken', pageToken);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Google Places API error ${response.status}: ${text}`);
    }

    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API status: ${data.status}`);
    }

    return {
      results: data.results || [],
      nextPageToken: data.next_page_token,
    };
  });
}

/**
 * Obtient les détails d'un lieu
 */
export async function placeDetails(placeId: string): Promise<GooglePlaceResult | null> {
  if (!env.GOOGLE_PLACES_KEY) {
    throw new Error('GOOGLE_PLACES_KEY manquante');
  }

  return throttle.execute(async () => {
    const url = new URL(DETAILS_ENDPOINT);
    url.searchParams.set('place_id', placeId);
    url.searchParams.set('key', env.GOOGLE_PLACES_KEY!);
    url.searchParams.set(
      'fields',
      'place_id,name,formatted_address,formatted_phone_number,website,geometry,types'
    );

    const response = await fetch(url.toString());

    if (!response.ok) {
      const text = await response.text();
      console.error(`Google Places Details error ${response.status}: ${text}`);
      return null;
    }

    const data = await response.json();

    if (data.status !== 'OK') {
      console.error(`Google Places Details status: ${data.status}`);
      return null;
    }

    return data.result;
  });
}

/**
 * Convertit un résultat Google Places en Company
 */
export function placeToCompany(
  place: GooglePlaceResult,
  category: 'construction' | 'fournisseur' | 'usine',
  city: string,
  searchKeyword?: string
): Company {
  const phones = place.formatted_phone_number ? [place.formatted_phone_number] : [];

  return {
    name: place.name,
    category,
    searchKeyword, // Ajout du mot-clé de recherche
    city,
    website: place.website,
    phones,
    emails: [],
    social: [],
    address: place.formatted_address,
    country: 'Tunisie',
    lat: place.geometry?.location.lat,
    lng: place.geometry?.location.lng,
    sources: [
      {
        kind: 'googlePlaces' as const,
        id: place.place_id,
        url: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
        timestamp: new Date().toISOString(),
      },
    ],
    confidence: 0.9, // Haute confiance pour Google Places
  };
}

/**
 * Recherche complète Google Places pour une paire keyword/city
 */
export async function searchGooglePlacesForKeywordCity(
  keyword: string,
  city: string,
  category: 'construction' | 'fournisseur' | 'usine',
  limit: number = 100 // Par défaut 100 résultats par recherche
): Promise<Company[]> {
  const query = buildGooglePlacesQuery(keyword, city);
  const companies: Company[] = [];

  try {
    let pageToken: string | undefined;
    let collected = 0;
    const maxResults = limit; // Utiliser la limite fournie

    // Première recherche
    const firstSearch = await textSearch(query);

    for (const place of firstSearch.results) {
      if (collected >= maxResults) break;

      // Obtenir les détails complets
      let detailedPlace = place;

      // Si on a besoin de plus de détails
      if (!place.formatted_phone_number || !place.website) {
        const details = await placeDetails(place.place_id);
        if (details) {
          detailedPlace = { ...place, ...details };
        }
        await delay(100); // Petit délai entre les appels details
      }

      const company = placeToCompany(detailedPlace, category, city, keyword);
      companies.push(company);
      collected++;
    }

    // Pagination - continue until no more pages or limit reached
    pageToken = firstSearch.nextPageToken;
    let pageCount = 0;
    const maxPages = 5; // Google Places permet jusqu'à 3 pages (60 résultats), mais on essaie d'en obtenir plus

    while (pageToken && collected < maxResults && pageCount < maxPages) {
      // Google nécessite un délai de 2 secondes pour le next_page_token
      await delay(2000);
      pageCount++;

      const nextSearch = await textSearch(query, pageToken);

      if (!nextSearch.results || nextSearch.results.length === 0) {
        break; // No more results
      }

      for (const place of nextSearch.results) {
        if (collected >= maxResults) break;

        let detailedPlace = place;

        if (!place.formatted_phone_number || !place.website) {
          const details = await placeDetails(place.place_id);
          if (details) {
            detailedPlace = { ...place, ...details };
          }
          await delay(100);
        }

        const company = placeToCompany(detailedPlace, category, city, keyword);
        companies.push(company);
        collected++;
      }

      pageToken = nextSearch.nextPageToken;
    }
  } catch (error) {
    console.error(`Erreur recherche Google Places pour "${query}":`, error);
  }

  return companies;
}
