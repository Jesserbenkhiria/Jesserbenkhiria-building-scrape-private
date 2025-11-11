import { Router, Request, Response } from 'express';
import { CONSTRUCTION_KEYWORDS, FOURNISSEUR_KEYWORDS, GOVERNORATES } from '../lib/keywords';
import { searchGooglePlacesForKeywordCity } from '../datasources/googlePlaces';
import { searchSerperForKeywordCity } from '../datasources/serper';
import { dedupeCompanies } from '../lib/dedupe';
import { bulkUpsertConstruction, bulkUpsertFournisseur } from '../store/mongo-repo';
import type { Company } from '../types';
import { delay } from '../lib/http';

const router = Router();

/**
 * POST /api/full-search
 * Fires all searches: CONSTRUCTION_KEYWORDS × GOVERNORATES and FOURNISSEUR_KEYWORDS × GOVERNORATES
 * Saves results to separate tables: construction and fournisseur
 */
router.post('/full-search', async (req: Request, res: Response) => {
  try {
    // No limit - get maximum results from each API
    const limitPerQuery = req.body.limitPerQuery || 1000; // Very high limit to get all results
    
    console.log('🚀 Démarrage de la recherche complète...');
    console.log(`   CONSTRUCTION_KEYWORDS: ${CONSTRUCTION_KEYWORDS.length} mots-clés`);
    console.log(`   FOURNISSEUR_KEYWORDS: ${FOURNISSEUR_KEYWORDS.length} mots-clés`);
    console.log(`   GOVERNORATES: ${GOVERNORATES.length} gouvernorats`);
    console.log(`   Mode: MAXIMUM (pas de limite)`);
    
    const stats = {
      construction: {
        queried: 0,
        candidates: 0,
        unique: 0,
        inserted: 0,
        bySource: {
          places: 0,
          serper: 0,
        },
      },
      fournisseur: {
        queried: 0,
        candidates: 0,
        unique: 0,
        inserted: 0,
        bySource: {
          places: 0,
          serper: 0,
        },
      },
    };

    // ============================================
    // CONSTRUCTION: All keywords × All governorates
    // ============================================
    console.log('\n📋 === RECHERCHE CONSTRUCTION ===');
    const allConstructionCandidates: Omit<Company, 'category' | 'id'>[] = [];
    
    for (const keyword of CONSTRUCTION_KEYWORDS) {
      for (const city of GOVERNORATES) {
        stats.construction.queried++;
        
        try {
          // Google Places
          console.log(`  📍 Google Places: "${keyword}" à ${city}`);
          const placesResults = await searchGooglePlacesForKeywordCity(
            keyword,
            city,
            'construction',
            limitPerQuery
          );
          
          // Remove category from results
          const placesWithoutCategory = placesResults.map(({ category, id, ...rest }) => rest);
          allConstructionCandidates.push(...placesWithoutCategory);
          stats.construction.bySource.places += placesResults.length;
          
          await delay(300); // Small delay between requests
          
          // Serper (with error handling - continue even if Serper fails)
          try {
            console.log(`  🔍 Serper: "${keyword}" à ${city}`);
            const serperResults = await searchSerperForKeywordCity(
              keyword,
              city,
              'construction',
              limitPerQuery
            );
            
            // Remove category from results
            const serperWithoutCategory = serperResults.map(({ category, id, ...rest }) => rest);
            allConstructionCandidates.push(...serperWithoutCategory);
            stats.construction.bySource.serper += serperResults.length;
          } catch (serperError) {
            console.warn(`  ⚠️  Serper échoué pour "${keyword}" à ${city}, continuation...`);
            // Continue processing even if Serper fails
          }
          
          await delay(300); // Small delay between requests
        } catch (error) {
          console.error(`  ❌ Erreur pour "${keyword}" à ${city}:`, error);
        }
      }
    }
    
    stats.construction.candidates = allConstructionCandidates.length;
    console.log(`\n✅ Construction: ${allConstructionCandidates.length} candidats collectés`);
    
    // Deduplicate construction candidates
    console.log('🔄 Dédoublonnage construction...');
    const constructionWithCategory: Company[] = allConstructionCandidates.map(c => ({ 
      ...c, 
      category: 'construction' as const,
      id: undefined 
    }));
    const dedupedConstruction = dedupeCompanies(constructionWithCategory);
    const dedupedConstructionWithoutCategory = dedupedConstruction.map(({ category, id, ...rest }) => rest);
    stats.construction.unique = dedupedConstructionWithoutCategory.length;
    
    console.log(`✅ Construction: ${dedupedConstructionWithoutCategory.length} entreprises uniques`);
    
    // Save to construction table
    console.log('💾 Sauvegarde dans la table construction...');
    const insertedConstruction = await bulkUpsertConstruction(dedupedConstructionWithoutCategory);
    stats.construction.inserted = insertedConstruction;
    console.log(`✅ ${insertedConstruction} entreprises construction enregistrées`);

    // ============================================
    // FOURNISSEUR: All keywords × All governorates
    // ============================================
    console.log('\n📋 === RECHERCHE FOURNISSEUR ===');
    const allFournisseurCandidates: Omit<Company, 'category' | 'id'>[] = [];
    
    for (const keyword of FOURNISSEUR_KEYWORDS) {
      for (const city of GOVERNORATES) {
        stats.fournisseur.queried++;
        
        try {
          // Google Places
          console.log(`  📍 Google Places: "${keyword}" à ${city}`);
          const placesResults = await searchGooglePlacesForKeywordCity(
            keyword,
            city,
            'fournisseur',
            limitPerQuery
          );
          
          // Remove category from results
          const placesWithoutCategory = placesResults.map(({ category, id, ...rest }) => rest);
          allFournisseurCandidates.push(...placesWithoutCategory);
          stats.fournisseur.bySource.places += placesResults.length;
          
          await delay(300); // Small delay between requests
          
          // Serper (with error handling - continue even if Serper fails)
          try {
            console.log(`  🔍 Serper: "${keyword}" à ${city}`);
            const serperResults = await searchSerperForKeywordCity(
              keyword,
              city,
              'fournisseur',
              limitPerQuery
            );
            
            // Remove category from results
            const serperWithoutCategory = serperResults.map(({ category, id, ...rest }) => rest);
            allFournisseurCandidates.push(...serperWithoutCategory);
            stats.fournisseur.bySource.serper += serperResults.length;
          } catch (serperError) {
            console.warn(`  ⚠️  Serper échoué pour "${keyword}" à ${city}, continuation...`);
            // Continue processing even if Serper fails
          }
          
          await delay(300); // Small delay between requests
        } catch (error) {
          console.error(`  ❌ Erreur pour "${keyword}" à ${city}:`, error);
        }
      }
    }
    
    stats.fournisseur.candidates = allFournisseurCandidates.length;
    console.log(`\n✅ Fournisseur: ${allFournisseurCandidates.length} candidats collectés`);
    
    // Deduplicate fournisseur candidates
    console.log('🔄 Dédoublonnage fournisseur...');
    const fournisseurWithCategory: Company[] = allFournisseurCandidates.map(c => ({ 
      ...c, 
      category: 'fournisseur' as const,
      id: undefined 
    }));
    const dedupedFournisseur = dedupeCompanies(fournisseurWithCategory);
    const dedupedFournisseurWithoutCategory = dedupedFournisseur.map(({ category, id, ...rest }) => rest);
    stats.fournisseur.unique = dedupedFournisseurWithoutCategory.length;
    
    console.log(`✅ Fournisseur: ${dedupedFournisseurWithoutCategory.length} entreprises uniques`);
    
    // Save to fournisseur table
    console.log('💾 Sauvegarde dans la table fournisseur...');
    const insertedFournisseur = await bulkUpsertFournisseur(dedupedFournisseurWithoutCategory);
    stats.fournisseur.inserted = insertedFournisseur;
    console.log(`✅ ${insertedFournisseur} entreprises fournisseur enregistrées`);

    // ============================================
    // Summary
    // ============================================
    console.log('\n📊 === RÉSUMÉ FINAL ===');
    console.log(`Construction: ${stats.construction.inserted} entreprises sauvegardées`);
    console.log(`Fournisseur: ${stats.fournisseur.inserted} entreprises sauvegardées`);
    console.log(`Total: ${stats.construction.inserted + stats.fournisseur.inserted} entreprises`);

    res.json({
      success: true,
      stats,
      summary: {
        totalQueries: stats.construction.queried + stats.fournisseur.queried,
        totalCandidates: stats.construction.candidates + stats.fournisseur.candidates,
        totalUnique: stats.construction.unique + stats.fournisseur.unique,
        totalInserted: stats.construction.inserted + stats.fournisseur.inserted,
      },
    });
  } catch (error) {
    console.error('❌ Erreur dans /api/full-search:', error);
    res.status(500).json({
      error: 'Erreur lors de la recherche complète',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;

