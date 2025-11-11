/**
 * Script pour nettoyer les doublons dans MongoDB
 * Fusionne les entreprises en double en gardant les meilleures informations
 */

import { config } from 'dotenv';
import { join } from 'path';
import { MongoClient, Db } from 'mongodb';
import { normalizeName, normalizeUrlDomain, normalizePhoneTN } from '../src/lib/normalize';

// Charger les variables d'environnement
config({ path: join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI non configuré');
  process.exit(1);
}

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

async function cleanDuplicates() {
  const client = new MongoClient(MONGO_URI!);
  
  try {
    await client.connect();
    console.log('✅ Connecté à MongoDB');
    
    const db = client.db();
    
    // Nettoyer les deux collections
    await cleanCollection(db, 'construction');
    await cleanCollection(db, 'fournisseur');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.close();
    console.log('✅ Connexion fermée');
  }
}

async function cleanCollection(db: Db, collectionName: string) {
  console.log(`\n🔍 Nettoyage de la collection: ${collectionName}`);
  
  const collection = db.collection(collectionName);
  const totalBefore = await collection.countDocuments({});
  console.log(`   Total avant: ${totalBefore}`);
  
  // Récupérer toutes les entreprises
  const companies = await collection.find({}).toArray() as Company[];
  console.log(`   Analysing ${companies.length} companies...`);
  
  // Grouper par site web (le plus fiable)
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
  
  // Trouver et fusionner les doublons
  const toDelete = new Set<string>();
  const toUpdate: Array<{ id: any; doc: Partial<Company> }> = [];
  
  // Doublons par site web
  console.log(`   🔗 Analyse des doublons par site web...`);
  for (const [domain, duplicates] of byWebsite.entries()) {
    if (duplicates.length > 1) {
      console.log(`      - ${domain}: ${duplicates.length} doublons`);
      const merged = mergeDuplicates(duplicates);
      toUpdate.push({ id: merged._id, doc: merged });
      
      // Marquer les autres pour suppression
      for (const dup of duplicates) {
        if (dup._id.toString() !== merged._id.toString()) {
          toDelete.add(dup._id.toString());
        }
      }
    }
  }
  
  // Doublons par téléphone (seulement si pas déjà traités)
  console.log(`   📞 Analyse des doublons par téléphone...`);
  for (const [phone, duplicates] of byPhone.entries()) {
    if (duplicates.length > 1) {
      // Filtrer ceux qui ne sont pas déjà marqués pour suppression
      const remaining = duplicates.filter(d => !toDelete.has(d._id.toString()));
      if (remaining.length > 1) {
        console.log(`      - ${phone}: ${remaining.length} doublons`);
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
  
  // Doublons par nom (seulement si très similaires et pas déjà traités)
  console.log(`   📝 Analyse des doublons par nom...`);
  for (const [name, duplicates] of byName.entries()) {
    if (duplicates.length > 1) {
      // Filtrer ceux qui ne sont pas déjà marqués pour suppression
      const remaining = duplicates.filter(d => !toDelete.has(d._id.toString()));
      if (remaining.length > 1) {
        console.log(`      - ${name}: ${remaining.length} doublons potentiels`);
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
  
  // Appliquer les mises à jour
  console.log(`\n   💾 Application des changements...`);
  console.log(`      - Mise à jour: ${toUpdate.length} entreprises`);
  console.log(`      - Suppression: ${toDelete.size} doublons`);
  
  if (toUpdate.length > 0) {
    for (const { id, doc } of toUpdate) {
      await collection.updateOne({ _id: id }, { $set: doc });
    }
  }
  
  if (toDelete.size > 0) {
    const idsToDelete = Array.from(toDelete).map(id => {
      try {
        return new (require('mongodb').ObjectId)(id);
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
  console.log(`      Réduction: ${((removed / totalBefore) * 100).toFixed(1)}%`);
}

function mergeDuplicates(duplicates: Company[]): Company {
  if (duplicates.length === 0) throw new Error('No duplicates to merge');
  if (duplicates.length === 1) return duplicates[0];
  
  // Trier par confiance décroissante, puis par nombre de données
  duplicates.sort((a, b) => {
    const scoreA = a.confidence * 10 + 
                   (a.phones?.length || 0) + 
                   (a.emails?.length || 0) + 
                   (a.website ? 5 : 0) + 
                   (a.lat && a.lng ? 3 : 0);
    const scoreB = b.confidence * 10 + 
                   (b.phones?.length || 0) + 
                   (b.emails?.length || 0) + 
                   (b.website ? 5 : 0) + 
                   (b.lat && b.lng ? 3 : 0);
    return scoreB - scoreA;
  });
  
  const best = duplicates[0];
  
  // Fusionner toutes les informations
  const mergeArrays = <T>(arrays: (T[] | undefined)[]): T[] => {
    const all = arrays.flatMap(arr => arr || []);
    return Array.from(new Set(all.map(item => JSON.stringify(item)))).map(str => JSON.parse(str));
  };
  
  const merged: Company = {
    ...best,
    // Prendre le nom le plus long
    name: duplicates.reduce((longest, curr) => 
      curr.name.length > longest.name.length ? curr.name : longest, best.name),
    // Fusionner tous les tableaux
    phones: mergeArrays(duplicates.map(d => d.phones)),
    emails: mergeArrays(duplicates.map(d => d.emails)),
    social: mergeArrays(duplicates.map(d => d.social)),
    sources: mergeArrays(duplicates.map(d => d.sources)),
    // Prendre la meilleure information disponible
    website: duplicates.find(d => d.website)?.website || best.website,
    address: duplicates.find(d => d.address)?.address || best.address,
    city: duplicates.find(d => d.city)?.city || best.city,
    lat: duplicates.find(d => d.lat)?.lat ?? best.lat,
    lng: duplicates.find(d => d.lng)?.lng ?? best.lng,
    searchKeyword: duplicates.find(d => d.searchKeyword)?.searchKeyword || best.searchKeyword,
    // Prendre la meilleure confiance
    confidence: Math.max(...duplicates.map(d => d.confidence)),
    // Dates
    created_at: new Date(Math.min(...duplicates.map(d => new Date(d.created_at).getTime()))),
    updated_at: new Date(),
  };
  
  return merged;
}

// Exécuter le script
cleanDuplicates().then(() => {
  console.log('\n✅ Nettoyage terminé');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});

