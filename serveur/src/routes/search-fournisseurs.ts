import { Router, Request, Response } from 'express';
import { FOURNISSEUR_KEYWORDS, GOVERNORATES } from '../lib/keywords';
import { searchGooglePlacesForKeywordCity } from '../datasources/googlePlaces';
import { bulkUpsertFournisseur } from '../store/mongo-repo';
import { filterRelevantCompanies, adjustConfidence } from '../lib/filters';
import { normalizeName, normalizeUrlDomain, normalizePhoneTN } from '../lib/normalize';
import type { Company } from '../types';

const router = Router();

/**
 * POST /api/search-fournisseurs
 * Recherche exclusive des fournisseurs via Google Places
 * Avec détection avancée de doublons
 */
router.post('/search-fournisseurs', async (req: Request, res: Response) => {
  try {
    const {
      cities = GOVERNORATES, // Par défaut toutes les villes
      limitPerQuery = 100, // 100 résultats par recherche (Google Places max ~60)
    } = req.body;

    console.log('🔍 Recherche FOURNISSEURS via Google Places');
    console.log(`   Mots-clés: ${FOURNISSEUR_KEYWORDS.length}`);
    console.log(`   Villes: ${cities.length}`);
    console.log(`   Limite par requête: ${limitPerQuery}`);

    let totalCollected = 0;
    let totalFiltered = 0;
    let totalDuplicatesSkipped = 0;
    let totalSaved = 0;

    // Cache pour détecter les doublons en temps réel
    const seenCompanies = new Map<string, Company>();
    const seenWebsites = new Set<string>();
    const seenPhones = new Set<string>();

    for (const keyword of FOURNISSEUR_KEYWORDS) {
      for (const city of cities) {
        try {
          console.log(`\n  📍 Recherche: "${keyword}" à ${city}`);

          // Rechercher via Google Places uniquement
          const placesResults = await searchGooglePlacesForKeywordCity(
            keyword,
            city,
            'fournisseur',
            limitPerQuery
          );

          totalCollected += placesResults.length;
          console.log(`     Trouvé: ${placesResults.length} résultats`);

          // Filtrer les entreprises non pertinentes
          const relevantCompanies = filterRelevantCompanies(placesResults);
          const filteredCount = placesResults.length - relevantCompanies.length;
          totalFiltered += filteredCount;

          if (filteredCount > 0) {
            console.log(`     Filtré: ${filteredCount} non pertinents`);
          }

          if (relevantCompanies.length === 0) {
            console.log(`     ⚠️  Aucune entreprise pertinente`);
            continue;
          }

          // Détecter et éliminer les doublons AVANT la sauvegarde
          const uniqueCompanies: Company[] = [];
          let duplicatesInBatch = 0;

          for (const company of relevantCompanies) {
            // Ajuster la confiance
            const adjustedCompany = adjustConfidence(company);

            // Vérifier les doublons par plusieurs critères
            let isDuplicate = false;

            // 1. Vérifier par site web (le plus fiable)
            if (adjustedCompany.website) {
              const domain = normalizeUrlDomain(adjustedCompany.website);
              if (domain && seenWebsites.has(domain)) {
                isDuplicate = true;
                console.log(`     🔁 Doublon (site): ${adjustedCompany.name}`);
              } else if (domain) {
                seenWebsites.add(domain);
              }
            }

            // 2. Vérifier par téléphone
            if (!isDuplicate && adjustedCompany.phones && adjustedCompany.phones.length > 0) {
              for (const phone of adjustedCompany.phones) {
                const normalized = normalizePhoneTN(phone);
                if (normalized && seenPhones.has(normalized)) {
                  isDuplicate = true;
                  console.log(`     🔁 Doublon (tél): ${adjustedCompany.name}`);
                  break;
                }
              }
              if (!isDuplicate) {
                adjustedCompany.phones.forEach(p => {
                  const normalized = normalizePhoneTN(p);
                  if (normalized) seenPhones.add(normalized);
                });
              }
            }

            // 3. Vérifier par nom normalisé
            if (!isDuplicate) {
              const normalizedName = normalizeName(adjustedCompany.name);
              const dedupeKey = `${normalizedName}`;

              if (seenCompanies.has(dedupeKey)) {
                // Comparer avec l'entreprise existante
                const existing = seenCompanies.get(dedupeKey)!;
                
                // Si même nom ET même ville, c'est un doublon certain
                if (existing.city === adjustedCompany.city) {
                  isDuplicate = true;
                  console.log(`     🔁 Doublon (nom+ville): ${adjustedCompany.name}`);
                }
                // Si même nom mais ville différente, vérifier similarité
                else {
                  // Calculer similarité du nom complet
                  const similarity = calculateSimilarity(existing.name, adjustedCompany.name);
                  if (similarity > 0.95) {
                    isDuplicate = true;
                    console.log(`     🔁 Doublon (nom similaire): ${adjustedCompany.name}`);
                  }
                }
              }

              if (!isDuplicate) {
                seenCompanies.set(dedupeKey, adjustedCompany);
              }
            }

            if (isDuplicate) {
              duplicatesInBatch++;
              totalDuplicatesSkipped++;
            } else {
              uniqueCompanies.push(adjustedCompany);
            }
          }

          if (duplicatesInBatch > 0) {
            console.log(`     Doublons détectés: ${duplicatesInBatch}`);
          }

          // Sauvegarder uniquement les entreprises uniques
          if (uniqueCompanies.length > 0) {
            const companiesWithoutCategory = uniqueCompanies.map(({ category, id, ...rest }) => rest);
            const inserted = await bulkUpsertFournisseur(companiesWithoutCategory);

            totalSaved += inserted;
            console.log(`     ✅ Sauvegardé: ${inserted} nouvelles entreprises`);
          }

        } catch (error) {
          console.error(`  ❌ Erreur pour "${keyword}" à ${city}:`, error);
        }
      }
    }

    console.log(`\n✅ Recherche terminée !`);
    console.log(`   Total collecté: ${totalCollected}`);
    console.log(`   Total filtré: ${totalFiltered}`);
    console.log(`   Doublons évités: ${totalDuplicatesSkipped}`);
    console.log(`   Total sauvegardé: ${totalSaved}`);

    res.json({
      success: true,
      summary: {
        totalCollected,
        totalFiltered,
        totalDuplicatesSkipped,
        totalSaved,
        totalProcessed: totalCollected - totalFiltered - totalDuplicatesSkipped,
      },
      details: {
        keywords: FOURNISSEUR_KEYWORDS.length,
        cities: cities.length,
        queriesExecuted: FOURNISSEUR_KEYWORDS.length * cities.length,
      },
      message: `Recherche terminée: ${totalSaved} fournisseurs sauvegardés (${totalDuplicatesSkipped} doublons évités)`
    });

  } catch (error) {
    console.error('❌ Erreur dans /api/search-fournisseurs:', error);
    res.status(500).json({
      error: 'Erreur lors de la recherche des fournisseurs',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/search-fournisseurs/status
 * Retourne les statistiques actuelles des fournisseurs
 */
router.get('/search-fournisseurs/status', async (req: Request, res: Response) => {
  try {
    const { getMongo } = await import('../store/mongo');
    const db = await getMongo();
    const collection = db.collection('fournisseur');

    const total = await collection.countDocuments();
    const withWebsite = await collection.countDocuments({ website: { $exists: true, $ne: null } });
    const withPhone = await collection.countDocuments({ phones: { $exists: true, $ne: [] } });
    const withCoordinates = await collection.countDocuments({ 
      lat: { $exists: true, $ne: null }, 
      lng: { $exists: true, $ne: null } 
    });

    // Top 10 villes
    const topCities = await collection.aggregate([
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).toArray();

    // Top 10 mots-clés
    const topKeywords = await collection.aggregate([
      { $match: { searchKeyword: { $exists: true, $ne: null } } },
      { $group: { _id: '$searchKeyword', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).toArray();

    res.json({
      success: true,
      statistics: {
        total,
        withWebsite,
        withPhone,
        withCoordinates,
        completenessPercentage: {
          website: total > 0 ? ((withWebsite / total) * 100).toFixed(1) + '%' : '0%',
          phone: total > 0 ? ((withPhone / total) * 100).toFixed(1) + '%' : '0%',
          coordinates: total > 0 ? ((withCoordinates / total) * 100).toFixed(1) + '%' : '0%',
        }
      },
      topCities: topCities.map(c => ({ city: c._id, count: c.count })),
      topKeywords: topKeywords.map(k => ({ keyword: k._id, count: k.count })),
    });

  } catch (error) {
    console.error('❌ Erreur dans /api/search-fournisseurs/status:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des statistiques',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * Calcule la similarité entre deux chaînes (simple Levenshtein ratio)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Calcule la distance de Levenshtein entre deux chaînes
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

export default router;

