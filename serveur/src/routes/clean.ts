import { Router, Request, Response } from 'express';
import { getMongo } from '../store/mongo';
import { normalizeName, normalizeUrlDomain, normalizePhoneTN } from '../lib/normalize';
import { ObjectId } from 'mongodb';

const router = Router();

interface Company {
  _id: any;
  name: string;
  searchKeyword?: string;
  phones: string[];
  emails: string[];
  website?: string;
  social: string[];
  address?: string;
  city?: string;
  country: string;
  lat?: number;
  lng?: number;
  sources: any[];
  confidence: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * POST /api/clean-duplicates
 * Nettoie les doublons dans les collections MongoDB
 */
router.post('/clean-duplicates', async (req: Request, res: Response) => {
  try {
    console.log('🧹 Début du nettoyage des doublons...');
    
    const db = await getMongo();
    
    // Nettoyer les deux collections
    const constructionResult = await cleanCollection(db, 'construction');
    const fournisseurResult = await cleanCollection(db, 'fournisseur');
    
    const totalRemoved = constructionResult.removed + fournisseurResult.removed;
    const totalBefore = constructionResult.before + fournisseurResult.before;
    const totalAfter = constructionResult.after + fournisseurResult.after;
    
    res.json({
      success: true,
      summary: {
        totalBefore,
        totalAfter,
        totalRemoved,
        reductionPercentage: totalBefore > 0 ? ((totalRemoved / totalBefore) * 100).toFixed(1) + '%' : '0%',
      },
      byCollection: {
        construction: constructionResult,
        fournisseur: fournisseurResult,
      },
      message: `Nettoyage terminé : ${totalRemoved} doublons supprimés (${totalBefore} → ${totalAfter})`
    });
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    res.status(500).json({
      error: 'Erreur lors du nettoyage des doublons',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/clean-duplicates/preview
 * Prévisualise les doublons sans les supprimer
 */
router.get('/clean-duplicates/preview', async (req: Request, res: Response) => {
  try {
    const db = await getMongo();
    
    const constructionDuplicates = await findDuplicates(db, 'construction');
    const fournisseurDuplicates = await findDuplicates(db, 'fournisseur');
    
    res.json({
      success: true,
      construction: {
        totalDuplicates: constructionDuplicates.length,
        examples: constructionDuplicates.slice(0, 10),
      },
      fournisseur: {
        totalDuplicates: fournisseurDuplicates.length,
        examples: fournisseurDuplicates.slice(0, 10),
      },
      summary: {
        totalDuplicates: constructionDuplicates.length + fournisseurDuplicates.length,
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la prévisualisation:', error);
    res.status(500).json({
      error: 'Erreur lors de la prévisualisation des doublons',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

async function cleanCollection(db: any, collectionName: string) {
  console.log(`\n🔍 Nettoyage de la collection: ${collectionName}`);
  
  const collection = db.collection(collectionName);
  const totalBefore = await collection.countDocuments({});
  console.log(`   Total avant: ${totalBefore}`);
  
  // Récupérer toutes les entreprises
  const companies = await collection.find({}).toArray() as Company[];
  
  // Grouper par site web, téléphone et nom
  const byWebsite = new Map<string, Company[]>();
  const byPhone = new Map<string, Company[]>();
  const byName = new Map<string, Company[]>();
  
  for (const company of companies) {
    // Par site web
    if (company.website) {
      const domain = normalizeUrlDomain(company.website);
      if (domain) {
        if (!byWebsite.has(domain)) byWebsite.set(domain, []);
        byWebsite.get(domain)!.push(company);
      }
    }
    
    // Par téléphone
    for (const phone of company.phones || []) {
      const normalized = normalizePhoneTN(phone);
      if (normalized) {
        if (!byPhone.has(normalized)) byPhone.set(normalized, []);
        byPhone.get(normalized)!.push(company);
      }
    }
    
    // Par nom normalisé
    const normalizedName = normalizeName(company.name);
    if (normalizedName) {
      if (!byName.has(normalizedName)) byName.set(normalizedName, []);
      byName.get(normalizedName)!.push(company);
    }
  }
  
  const toDelete = new Set<string>();
  const toUpdate: Array<{ id: any; doc: Partial<Company> }> = [];
  
  // Traiter les doublons par site web
  console.log(`   🔗 Doublons par site web...`);
  let websiteDuplicates = 0;
  for (const [domain, duplicates] of byWebsite.entries()) {
    if (duplicates.length > 1) {
      websiteDuplicates++;
      const merged = mergeDuplicates(duplicates);
      toUpdate.push({ id: merged._id, doc: merged });
      
      for (const dup of duplicates) {
        if (dup._id.toString() !== merged._id.toString()) {
          toDelete.add(dup._id.toString());
        }
      }
    }
  }
  console.log(`      Trouvé: ${websiteDuplicates} groupes de doublons`);
  
  // Traiter les doublons par téléphone (non déjà traités)
  console.log(`   📞 Doublons par téléphone...`);
  let phoneDuplicates = 0;
  for (const [phone, duplicates] of byPhone.entries()) {
    if (duplicates.length > 1) {
      const remaining = duplicates.filter(d => !toDelete.has(d._id.toString()));
      if (remaining.length > 1) {
        phoneDuplicates++;
        const merged = mergeDuplicates(remaining);
        toUpdate.push({ id: merged._id, doc: merged });
        
        for (const dup of remaining) {
          if (dup._id.toString() !== merged._id.toString()) {
            toDelete.add(dup._id.toString());
          }
        }
      }
    }
  }
  console.log(`      Trouvé: ${phoneDuplicates} groupes de doublons`);
  
  // Traiter les doublons par nom (non déjà traités)
  console.log(`   📝 Doublons par nom...`);
  let nameDuplicates = 0;
  for (const [name, duplicates] of byName.entries()) {
    if (duplicates.length > 1) {
      const remaining = duplicates.filter(d => !toDelete.has(d._id.toString()));
      if (remaining.length > 1) {
        nameDuplicates++;
        const merged = mergeDuplicates(remaining);
        toUpdate.push({ id: merged._id, doc: merged });
        
        for (const dup of remaining) {
          if (dup._id.toString() !== merged._id.toString()) {
            toDelete.add(dup._id.toString());
          }
        }
      }
    }
  }
  console.log(`      Trouvé: ${nameDuplicates} groupes de doublons`);
  
  // Appliquer les changements
  console.log(`\n   💾 Application des changements...`);
  console.log(`      Mise à jour: ${toUpdate.length} entreprises`);
  console.log(`      Suppression: ${toDelete.size} doublons`);
  
  if (toUpdate.length > 0) {
    for (const { id, doc } of toUpdate) {
      await collection.updateOne({ _id: id }, { $set: doc });
    }
  }
  
  if (toDelete.size > 0) {
    const idsToDelete = Array.from(toDelete).map(id => {
      try {
        return new ObjectId(id);
      } catch {
        return id;
      }
    });
    await collection.deleteMany({ _id: { $in: idsToDelete } });
  }
  
  const totalAfter = await collection.countDocuments({});
  const removed = totalBefore - totalAfter;
  
  console.log(`\n   ✅ Collection ${collectionName} nettoyée`);
  console.log(`      Total après: ${totalAfter}`);
  console.log(`      Doublons supprimés: ${removed}`);
  
  return {
    before: totalBefore,
    after: totalAfter,
    removed,
    reductionPercentage: totalBefore > 0 ? ((removed / totalBefore) * 100).toFixed(1) + '%' : '0%',
  };
}

async function findDuplicates(db: any, collectionName: string) {
  const collection = db.collection(collectionName);
  const companies = await collection.find({}).toArray() as Company[];
  
  const duplicates: Array<{ key: string; type: string; count: number; names: string[] }> = [];
  
  // Par site web
  const byWebsite = new Map<string, Company[]>();
  for (const company of companies) {
    if (company.website) {
      const domain = normalizeUrlDomain(company.website);
      if (domain) {
        if (!byWebsite.has(domain)) byWebsite.set(domain, []);
        byWebsite.get(domain)!.push(company);
      }
    }
  }
  
  for (const [domain, dups] of byWebsite.entries()) {
    if (dups.length > 1) {
      duplicates.push({
        key: domain,
        type: 'website',
        count: dups.length,
        names: dups.map(d => d.name),
      });
    }
  }
  
  // Par nom
  const byName = new Map<string, Company[]>();
  for (const company of companies) {
    const normalizedName = normalizeName(company.name);
    if (normalizedName) {
      if (!byName.has(normalizedName)) byName.set(normalizedName, []);
      byName.get(normalizedName)!.push(company);
    }
  }
  
  for (const [name, dups] of byName.entries()) {
    if (dups.length > 1) {
      duplicates.push({
        key: name,
        type: 'name',
        count: dups.length,
        names: dups.map(d => d.name),
      });
    }
  }
  
  return duplicates.sort((a, b) => b.count - a.count);
}

function mergeDuplicates(duplicates: Company[]): Company {
  if (duplicates.length === 0) throw new Error('No duplicates to merge');
  if (duplicates.length === 1) return duplicates[0];
  
  // Filtrer les entreprises valides (avec au moins un nom)
  const validDuplicates = duplicates.filter(d => d && d.name);
  if (validDuplicates.length === 0) throw new Error('No valid duplicates to merge');
  if (validDuplicates.length === 1) return validDuplicates[0];
  
  // Trier par qualité (confiance + données disponibles)
  validDuplicates.sort((a, b) => {
    const scoreA = (a.confidence || 0) * 10 + 
                   (a.phones?.length || 0) + 
                   (a.emails?.length || 0) + 
                   (a.website ? 5 : 0) + 
                   (a.lat && a.lng ? 3 : 0);
    const scoreB = (b.confidence || 0) * 10 + 
                   (b.phones?.length || 0) + 
                   (b.emails?.length || 0) + 
                   (b.website ? 5 : 0) + 
                   (b.lat && b.lng ? 3 : 0);
    return scoreB - scoreA;
  });
  
  const best = validDuplicates[0];
  
  // Fusionner toutes les informations
  const mergeArrays = <T>(arrays: (T[] | undefined)[]): T[] => {
    const all = arrays.flatMap(arr => arr || []);
    return Array.from(new Set(all.map(item => JSON.stringify(item)))).map(str => JSON.parse(str));
  };
  
  // Trouver le nom le plus long
  const longestName = validDuplicates.reduce((longest, curr) => {
    if (!curr || !curr.name) return longest;
    if (!longest) return curr.name;
    return curr.name.length > longest.length ? curr.name : longest;
  }, best.name || '');
  
  const merged: Company = {
    ...best,
    name: longestName || best.name || 'Unknown',
    phones: mergeArrays(validDuplicates.map(d => d.phones)),
    emails: mergeArrays(validDuplicates.map(d => d.emails)),
    social: mergeArrays(validDuplicates.map(d => d.social)),
    sources: mergeArrays(validDuplicates.map(d => d.sources)),
    website: validDuplicates.find(d => d && d.website)?.website || best.website,
    address: validDuplicates.find(d => d && d.address)?.address || best.address,
    city: validDuplicates.find(d => d && d.city)?.city || best.city,
    lat: validDuplicates.find(d => d && d.lat)?.lat ?? best.lat,
    lng: validDuplicates.find(d => d && d.lng)?.lng ?? best.lng,
    searchKeyword: validDuplicates.find(d => d && d.searchKeyword)?.searchKeyword || best.searchKeyword,
    confidence: Math.max(...validDuplicates.map(d => d.confidence || 0)),
    created_at: new Date(Math.min(...validDuplicates.filter(d => d.created_at).map(d => new Date(d.created_at).getTime()))),
    updated_at: new Date(),
  };
  
  return merged;
}

export default router;

