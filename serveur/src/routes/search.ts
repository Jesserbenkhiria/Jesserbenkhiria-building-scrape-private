import { Router, Request, Response } from 'express';
import { SearchQuerySchema, CompaniesQuerySchema } from '../types';
import { getKeywordsForCategory, GOVERNORATES } from '../lib/keywords';
import { searchGooglePlacesForKeywordCity } from '../datasources/googlePlaces';
import { searchSerperForKeywordCity } from '../datasources/serper';
import { dedupeCompanies } from '../lib/dedupe';
import { bulkUpsertConstruction, bulkUpsertFournisseur, listCompanies } from '../store/mongo-repo';
import { extractContacts, findSocialLinks } from '../lib/extract';
import { fetchWithRetry } from '../lib/http';
import { filterRelevantCompanies, adjustConfidence } from '../lib/filters';
import type { Company } from '../types';

const router = Router();

/**
 * GET /api/search
 * Recherche d'entreprises avec filtres
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    // Valider les paramètres
    const parsed = SearchQuerySchema.safeParse({
      category: req.query.category,
      source: req.query.source || 'all',
      city: req.query.city,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    });

    if (!parsed.success) {
      return res.status(400).json({
        error: 'Paramètres invalides',
        details: parsed.error.format(),
      });
    }

    const query = parsed.data;

    // Déterminer les villes cibles
    const targetCities = query.city ? [query.city] : GOVERNORATES;

    // Récupérer les mots-clés pour la catégorie
    const keywords = getKeywordsForCategory(query.category);

    // Statistiques de collecte
    let totalCollected = 0;
    let totalFiltered = 0;
    let totalSaved = 0;
    const allResultsForResponse: Company[] = [];

    // Utiliser tous les mots-clés ou limiter selon les besoins
    const maxKeywords = keywords.length; // TOUS les mots-clés
    const maxCities = query.city ? 1 : GOVERNORATES.length; // Toutes les villes ou une seule

    const limitedKeywords = keywords.slice(0, maxKeywords);
    const limitedCities = targetCities.slice(0, maxCities);

    console.log(
      `🔍 Recherche: ${query.category} | Source: ${query.source} | Villes: ${limitedCities.join(
        ', '
      )}`
    );

    for (const keyword of limitedKeywords) {
      for (const city of limitedCities) {
        try {
          const batchCandidates: Company[] = [];

          // Source Google Places (only Google Places and Serper are used)
          if (query.source === 'places' || query.source === 'all') {
            console.log(`  → Google Places: "${keyword}" à ${city}`);
            const placesResults = await searchGooglePlacesForKeywordCity(
              keyword,
              city,
              query.category,
              20
            );
            batchCandidates.push(...placesResults);
          }

          // Source Serper
          if (query.source === 'serper' || query.source === 'all') {
            console.log(`  → Serper (Google Search): "${keyword}" à ${city}`);
            const serperResults = await searchSerperForKeywordCity(
              keyword,
              city,
              query.category,
              20
            );
            batchCandidates.push(...serperResults);
          }

          totalCollected += batchCandidates.length;

          // Filtrer les entreprises non pertinentes
          const relevantCompanies = filterRelevantCompanies(batchCandidates);
          totalFiltered += batchCandidates.length - relevantCompanies.length;

          if (relevantCompanies.length > 0) {
            // Ajuster la confiance
            const adjustedCompanies = relevantCompanies.map(adjustConfidence);

            // Dédoublonner ce batch
            const dedupedBatch = dedupeCompanies(adjustedCompanies);

            // Sauvegarder immédiatement dans MongoDB (par catégorie)
            let inserted = 0;
            if (query.category === 'construction') {
              const companiesWithoutCategory = dedupedBatch.map(({ category, id, ...rest }) => rest);
              inserted = await bulkUpsertConstruction(companiesWithoutCategory);
            } else {
              const companiesWithoutCategory = dedupedBatch.map(({ category, id, ...rest }) => rest);
              inserted = await bulkUpsertFournisseur(companiesWithoutCategory);
            }

            totalSaved += inserted;
            allResultsForResponse.push(...dedupedBatch);

            console.log(
              `    ✅ ${dedupedBatch.length} entreprises trouvées (${inserted} nouvelles sauvegardées) | ${batchCandidates.length - relevantCompanies.length} filtrées`
            );
          } else {
            console.log(`    ⚠️ Aucune entreprise pertinente trouvée`);
          }
        } catch (error) {
          console.error(`Erreur pour ${keyword} à ${city}:`, error);
        }
      }
    }

    console.log(
      `\n✅ Recherche terminée: ${totalCollected} collectés | ${totalFiltered} filtrés | ${totalSaved} sauvegardés`
    );

    // Limiter les résultats retournés
    const paginated = allResultsForResponse.slice(query.offset, query.offset + query.limit);

    res.json({
      count: paginated.length,
      total: allResultsForResponse.length,
      items: paginated,
      meta: {
        category: query.category,
        source: query.source,
        city: query.city,
      },
      stats: {
        totalCollected,
        totalFiltered,
        totalSaved,
        totalUnique: allResultsForResponse.length,
      },
    });
  } catch (error) {
    console.error('Erreur dans /api/search:', error);
    res.status(500).json({
      error: 'Erreur lors de la recherche',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/companies
 * Liste les entreprises enregistrées avec filtres
 */
router.get('/companies', async (req: Request, res: Response) => {
  try {
    const parsed = CompaniesQuerySchema.safeParse({
      q: req.query.q,
      category: req.query.category,
      city: req.query.city,
      hasPhone: req.query.hasPhone === 'true',
      limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    });

    if (!parsed.success) {
      return res.status(400).json({
        error: 'Paramètres invalides',
        details: parsed.error.format(),
      });
    }

    const result = await listCompanies(parsed.data);

    res.json({
      count: result.items.length,
      total: result.total,
      items: result.items,
      meta: {
        query: parsed.data.q,
        category: parsed.data.category,
        city: parsed.data.city,
        hasPhone: parsed.data.hasPhone,
      },
    });
  } catch (error) {
    console.error('Erreur dans /api/companies:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des entreprises',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * Enrichit les candidats en récupérant les contacts depuis leurs sites web
 */
async function enrichCandidates(candidates: Company[]): Promise<void> {
  const promises = candidates.map(async candidate => {
    if (!candidate.website) return;

    try {
      const html = await fetchWithRetry(candidate.website, {
        timeout: 5000,
        retries: 1,
      });

      // Extraire les contacts
      const contacts = extractContacts(html);
      candidate.emails.push(...contacts.emails);
      candidate.phones.push(...contacts.phones);

      // Extraire les liens sociaux
      const social = findSocialLinks(html);
      candidate.social.push(...social);

      // Ajouter la source d'enrichissement
      candidate.sources.push({
        kind: 'enrichment',
        url: candidate.website,
        timestamp: new Date().toISOString(),
      });

      // Augmenter légèrement la confiance
      candidate.confidence = Math.min(candidate.confidence + 0.1, 1);
    } catch (error) {
      // Ignorer silencieusement les erreurs d'enrichissement
      console.debug(`Impossible d'enrichir ${candidate.website}`);
    }
  });

  await Promise.allSettled(promises);
}

export default router;
