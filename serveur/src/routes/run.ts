import { Router, Request, Response } from 'express';
import { RunSeedBodySchema } from '../types';
import { getKeywordsForCategory } from '../lib/keywords';
import { searchGooglePlacesForKeywordCity } from '../datasources/googlePlaces';
import { searchSerperForKeywordCity } from '../datasources/serper';
import { dedupeCompanies } from '../lib/dedupe';
import { bulkUpsertConstruction, bulkUpsertFournisseur } from '../store/mongo-repo';
import { filterRelevantCompanies, adjustConfidence } from '../lib/filters';
import type { Company } from '../types';

const router = Router();

/**
 * POST /api/run-seed
 * Exécute une collecte complète de données
 */
router.post('/run-seed', async (req: Request, res: Response) => {
  try {
    // Valider le body
    const parsed = RunSeedBodySchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: 'Corps de requête invalide',
        details: parsed.error.format(),
      });
    }

    const config = parsed.data;

    console.log('🚀 Démarrage de la collecte de données...');
    console.log(`   Catégories: ${config.categories.join(', ')}`);
    console.log(`   Villes: ${config.cities.join(', ')}`);
    console.log(`   Sources: ${config.sources.join(', ')}`);
    console.log(`   Limite par requête: ${config.limitPerQuery}`);

    const stats = {
      queried: 0,
      inserted: 0,
      filtered: 0,
      deduped: 0,
      bySource: {
        places: 0,
        serper: 0,
      },
      byCategory: {} as Record<string, number>,
    };

    // Pour chaque catégorie
    for (const category of config.categories) {
      const keywords = getKeywordsForCategory(category);
      stats.byCategory[category] = 0;

      console.log(`\n📋 Catégorie: ${category} (${keywords.length} mots-clés)`);

      // Pour chaque mot-clé
      for (const keyword of keywords) {
        // Pour chaque ville
        for (const city of config.cities) {
          stats.queried++;

          try {
            const batchCandidates: Company[] = [];

            // Source: Google Places (only Google Places and Serper are used)
            if (config.sources.includes('all') || config.sources.includes('places')) {
              console.log(`  📍 Google Places: "${keyword}" à ${city}`);
              const placesResults = await searchGooglePlacesForKeywordCity(
                keyword,
                city,
                category,
                config.limitPerQuery
              );

              batchCandidates.push(...placesResults);
              stats.bySource.places += placesResults.length;
            }

            // Source: Serper
            if (config.sources.includes('all') || config.sources.includes('serper')) {
              console.log(`  🔍 Serper (Google Search): "${keyword}" à ${city}`);
              const serperResults = await searchSerperForKeywordCity(
                keyword,
                city,
                category,
                config.limitPerQuery
              );

              batchCandidates.push(...serperResults);
              stats.bySource.serper += serperResults.length;
            }

            // Filtrer les entreprises non pertinentes
            const relevantCompanies = filterRelevantCompanies(batchCandidates);
            const filteredCount = batchCandidates.length - relevantCompanies.length;
            stats.filtered += filteredCount;

            if (relevantCompanies.length > 0) {
              // Ajuster la confiance
              const adjustedCompanies = relevantCompanies.map(adjustConfidence);

              // Dédoublonner ce batch
              const dedupedBatch = dedupeCompanies(adjustedCompanies);

              // Sauvegarder immédiatement dans MongoDB (par catégorie)
              let inserted = 0;
              if (category === 'construction') {
                const companiesWithoutCategory = dedupedBatch.map(({ category: cat, id, ...rest }) => rest);
                inserted = await bulkUpsertConstruction(companiesWithoutCategory);
              } else {
                const companiesWithoutCategory = dedupedBatch.map(({ category: cat, id, ...rest }) => rest);
                inserted = await bulkUpsertFournisseur(companiesWithoutCategory);
              }

              stats.inserted += inserted;
              stats.byCategory[category] = (stats.byCategory[category] || 0) + inserted;

              console.log(
                `    ✅ ${dedupedBatch.length} entreprises (${inserted} nouvelles) | ${filteredCount} filtrées`
              );
            } else {
              console.log(`    ⚠️ Aucune entreprise pertinente | ${filteredCount} filtrées`);
            }
          } catch (error) {
            console.error(`  ❌ Erreur pour "${keyword}" à ${city}:`, error);
          }
        }
      }
    }

    console.log(`\n✅ Collecte terminée`);
    console.log(`   📊 Total filtré: ${stats.filtered}`);
    console.log(`   💾 Total enregistré: ${stats.inserted}`);

    res.json({
      success: true,
      stats,
      summary: {
        totalQueried: stats.queried,
        totalFiltered: stats.filtered,
        totalInserted: stats.inserted,
        byCategory: stats.byCategory,
      },
    });
  } catch (error) {
    console.error('❌ Erreur dans /api/run-seed:', error);
    res.status(500).json({
      error: 'Erreur lors de la collecte de données',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
