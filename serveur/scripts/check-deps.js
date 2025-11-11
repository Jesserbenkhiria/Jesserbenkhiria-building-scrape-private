#!/usr/bin/env node

/**
 * Vérifie que toutes les dépendances nécessaires sont installées
 * Usage: node scripts/check-deps.js
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_DEPS = [
  'express',
  'better-sqlite3',
  'zod',
  'pino',
  'dotenv',
  'cors',
  'natural',
  'node-fetch',
];

const REQUIRED_DEV_DEPS = ['typescript', 'ts-node-dev', '@types/node', '@types/express'];

function checkDependencies() {
  console.log('🔍 Vérification des dépendances...\n');

  const packageJsonPath = path.join(__dirname, '..', 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    console.error('❌ package.json non trouvé !');
    process.exit(1);
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const deps = packageJson.dependencies || {};
  const devDeps = packageJson.devDependencies || {};

  let hasErrors = false;

  // Vérifier les dépendances de production
  console.log('📦 Dépendances de production :');
  for (const dep of REQUIRED_DEPS) {
    if (deps[dep]) {
      console.log(`   ✅ ${dep} (${deps[dep]})`);
    } else {
      console.log(`   ❌ ${dep} MANQUANT`);
      hasErrors = true;
    }
  }

  console.log('\n🛠️  Dépendances de développement :');
  for (const dep of REQUIRED_DEV_DEPS) {
    if (devDeps[dep]) {
      console.log(`   ✅ ${dep} (${devDeps[dep]})`);
    } else {
      console.log(`   ❌ ${dep} MANQUANT`);
      hasErrors = true;
    }
  }

  // Vérifier node_modules
  const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    console.log('\n⚠️  Le dossier node_modules n\'existe pas');
    console.log('   Exécutez : npm install');
    hasErrors = true;
  }

  console.log('');

  if (hasErrors) {
    console.error('❌ Certaines dépendances sont manquantes.');
    console.error('   Exécutez : npm install\n');
    process.exit(1);
  } else {
    console.log('✅ Toutes les dépendances sont installées !\n');
  }
}

checkDependencies();

