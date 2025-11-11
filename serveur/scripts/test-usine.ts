#!/usr/bin/env ts-node

/**
 * Script de test pour le schéma Usine
 * 
 * Usage:
 *   npx ts-node scripts/test-usine.ts
 */

import { initMongo, closeMongo } from '../src/store/mongo';
import { upsertUsine, getAllUsines, getUsineById, countUsines, getAllUsineTypes } from '../src/store/mongo-repo';
import type { Usine } from '../src/types';

// Données de test
const testUsines: Omit<Usine, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    name: "Cimenterie de Carthage",
    type: "ciment",
    capacity: "1000000 tonnes/an",
    products: ["Ciment CEM I 42.5", "Ciment CEM II/A 42.5", "Ciment CEM II/B 32.5"],
    certifications: ["ISO 9001:2015", "ISO 14001:2015", "ISO 45001:2018"],
    phones: ["+216 71 234 567", "+216 71 234 568"],
    emails: ["info@carthage-ciment.tn", "commercial@carthage-ciment.tn"],
    website: "https://carthage-ciment.tn",
    social: ["https://facebook.com/carthageciment", "https://linkedin.com/company/carthage-ciment"],
    address: "Route de Bizerte, km 15",
    city: "Tunis",
    country: "Tunisie",
    lat: 36.8818,
    lng: 10.2952,
    sources: [
      {
        kind: "enrichment",
        timestamp: new Date().toISOString(),
      }
    ],
    confidence: 0.95,
  },
  {
    name: "Aciérie de Sousse",
    type: "acier",
    capacity: "500000 tonnes/an",
    products: ["Fer à béton", "Acier laminé", "Treillis soudés"],
    certifications: ["ISO 9001:2015", "NF EN 10080"],
    phones: ["+216 73 456 789"],
    emails: ["contact@sousse-acier.tn"],
    website: "https://sousse-acier.tn",
    address: "Zone Industrielle Sidi Abdelhamid",
    city: "Sousse",
    country: "Tunisie",
    lat: 35.8245,
    lng: 10.6342,
    sources: [
      {
        kind: "enrichment",
        timestamp: new Date().toISOString(),
      }
    ],
    confidence: 0.88,
  },
  {
    name: "Verrerie de Rades",
    type: "verre",
    capacity: "80000 m²/an",
    products: ["Verre plat", "Double vitrage", "Verre trempé", "Verre feuilleté"],
    certifications: ["ISO 9001:2015", "CE"],
    phones: ["+216 71 789 123"],
    emails: ["info@rades-verre.tn"],
    website: "https://rades-verre.tn",
    address: "Zone Industrielle Rades",
    city: "Ben Arous",
    country: "Tunisie",
    lat: 36.7667,
    lng: 10.2833,
    sources: [
      {
        kind: "enrichment",
        timestamp: new Date().toISOString(),
      }
    ],
    confidence: 0.90,
  },
  {
    name: "Scierie Moderne de Sfax",
    type: "bois",
    capacity: "20000 m³/an",
    products: ["Bois de construction", "Parquet", "Lambris", "Panneaux contreplaqués"],
    certifications: ["PEFC", "FSC"],
    phones: ["+216 74 321 654"],
    emails: ["contact@scierie-sfax.tn"],
    address: "Route de Gabes, km 5",
    city: "Sfax",
    country: "Tunisie",
    lat: 34.7398,
    lng: 10.7608,
    sources: [
      {
        kind: "enrichment",
        timestamp: new Date().toISOString(),
      }
    ],
    confidence: 0.82,
  },
  {
    name: "Plastiques du Sahel",
    type: "plastique",
    capacity: "15000 tonnes/an",
    products: ["Tuyaux PVC", "Profilés PVC", "Raccords", "Tuyaux PE"],
    certifications: ["ISO 9001:2015", "NF"],
    phones: ["+216 73 654 321"],
    emails: ["commercial@plastiques-sahel.tn"],
    website: "https://plastiques-sahel.tn",
    address: "Zone Industrielle Kalaa Kebira",
    city: "Sousse",
    country: "Tunisie",
    lat: 35.9,
    lng: 10.5,
    sources: [
      {
        kind: "enrichment",
        timestamp: new Date().toISOString(),
      }
    ],
    confidence: 0.87,
  }
];

async function main() {
  try {
    console.log('🚀 Initialisation de MongoDB...');
    await initMongo();
    console.log('✅ MongoDB connecté\n');

    // Test 1: Compter les usines avant insertion
    console.log('📊 Test 1: Comptage initial');
    const initialCount = await countUsines();
    console.log(`   Nombre d'usines: ${initialCount}\n`);

    // Test 2: Insérer les usines de test
    console.log('📝 Test 2: Insertion des usines de test');
    for (const usine of testUsines) {
      const result = await upsertUsine(usine);
      console.log(`   ${result.isNew ? '✨ Nouvelle' : '🔄 Mise à jour'}: ${usine.name} (ID: ${result.id})`);
    }
    console.log('');

    // Test 3: Compter les usines après insertion
    console.log('📊 Test 3: Comptage après insertion');
    const finalCount = await countUsines();
    console.log(`   Nombre d'usines: ${finalCount}`);
    console.log(`   Nouvelles usines ajoutées: ${finalCount - initialCount}\n`);

    // Test 4: Récupérer toutes les usines
    console.log('📋 Test 4: Récupération de toutes les usines (limit=3)');
    const { items: allUsines, total } = await getAllUsines(3, 0);
    console.log(`   Total: ${total} usines`);
    console.log(`   Affichage des ${allUsines.length} premières:\n`);
    allUsines.forEach((usine, index) => {
      console.log(`   ${index + 1}. ${usine.name}`);
      console.log(`      Type: ${usine.type}`);
      console.log(`      Ville: ${usine.city}`);
      console.log(`      Capacité: ${usine.capacity || 'Non spécifiée'}`);
      console.log(`      Produits: ${usine.products.length} produit(s)`);
      console.log('');
    });

    // Test 5: Filtrer par ville
    console.log('📍 Test 5: Filtrage par ville (Sousse)');
    const { items: sousseUsines, total: sousseTotal } = await getAllUsines(10, 0, "Sousse");
    console.log(`   Usines à Sousse: ${sousseTotal}`);
    sousseUsines.forEach(usine => {
      console.log(`   - ${usine.name} (${usine.type})`);
    });
    console.log('');

    // Test 6: Filtrer par type
    console.log('🏭 Test 6: Filtrage par type (ciment)');
    const { items: cimentUsines, total: cimentTotal } = await getAllUsines(10, 0, undefined, undefined, "ciment");
    console.log(`   Usines de ciment: ${cimentTotal}`);
    cimentUsines.forEach(usine => {
      console.log(`   - ${usine.name} (${usine.city})`);
    });
    console.log('');

    // Test 7: Recherche textuelle
    console.log('🔍 Test 7: Recherche textuelle (verre)');
    const { items: searchResults, total: searchTotal } = await getAllUsines(10, 0, undefined, "verre");
    console.log(`   Résultats: ${searchTotal}`);
    searchResults.forEach(usine => {
      console.log(`   - ${usine.name} (${usine.type})`);
    });
    console.log('');

    // Test 8: Récupérer tous les types
    console.log('🏷️  Test 8: Types d\'usines disponibles');
    const types = await getAllUsineTypes();
    console.log(`   Types trouvés: ${types.join(', ')}\n`);

    // Test 9: Récupérer une usine par ID
    if (allUsines.length > 0) {
      console.log('🔎 Test 9: Récupération par ID');
      const firstUsineId = allUsines[0].id;
      if (firstUsineId) {
        const usine = await getUsineById(firstUsineId.toString());
        if (usine) {
          console.log(`   Usine trouvée: ${usine.name}`);
          console.log(`   Type: ${usine.type}`);
          console.log(`   Ville: ${usine.city}`);
          console.log(`   Téléphone(s): ${usine.phones.join(', ')}`);
          console.log(`   Email(s): ${usine.emails.join(', ')}`);
          console.log(`   Site web: ${usine.website || 'Non spécifié'}`);
          console.log(`   Produits: ${usine.products.join(', ')}`);
          console.log(`   Certifications: ${usine.certifications.join(', ')}`);
        }
      }
      console.log('');
    }

    // Test 10: Test de mise à jour (upsert)
    console.log('🔄 Test 10: Mise à jour d\'une usine existante');
    const updatedUsine = {
      ...testUsines[0],
      capacity: "1200000 tonnes/an", // Augmentation de la capacité
      products: [...testUsines[0].products, "Ciment CEM III/A 42.5"], // Ajout d'un produit
      phones: [...testUsines[0].phones, "+216 71 234 569"], // Ajout d'un téléphone
      confidence: 0.98, // Augmentation de la confiance
    };
    const updateResult = await upsertUsine(updatedUsine);
    console.log(`   ${updateResult.isNew ? '✨ Nouvelle' : '🔄 Mise à jour'}: ${updatedUsine.name}`);
    console.log(`   ID: ${updateResult.id}\n`);

    // Vérifier la mise à jour
    const updatedUsineData = await getUsineById(updateResult.id);
    if (updatedUsineData) {
      console.log('   Vérification des modifications:');
      console.log(`   - Capacité: ${updatedUsineData.capacity}`);
      console.log(`   - Nombre de produits: ${updatedUsineData.products.length}`);
      console.log(`   - Nombre de téléphones: ${updatedUsineData.phones.length}`);
      console.log(`   - Confiance: ${updatedUsineData.confidence}`);
    }

    console.log('\n✅ Tous les tests sont terminés avec succès !');
  } catch (error) {
    console.error('\n❌ Erreur lors des tests:', error);
    process.exit(1);
  } finally {
    await closeMongo();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
}

// Exécuter les tests
main();

