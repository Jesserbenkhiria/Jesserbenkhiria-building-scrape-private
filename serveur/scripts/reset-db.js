#!/usr/bin/env node

/**
 * Réinitialise la base de données SQLite
 * Usage: node scripts/reset-db.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const DB_FILE = path.join(__dirname, '..', 'data.db');

async function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

async function resetDatabase() {
  console.log('🗑️  Réinitialisation de la base de données\n');

  if (!fs.existsSync(DB_FILE)) {
    console.log('ℹ️  La base de données n\'existe pas encore.');
    console.log('   Elle sera créée au prochain démarrage du serveur.\n');
    process.exit(0);
  }

  const answer = await prompt('⚠️  Êtes-vous sûr de vouloir supprimer data.db ? (y/N) ');

  if (answer.toLowerCase() !== 'y') {
    console.log('❌ Opération annulée.\n');
    process.exit(0);
  }

  try {
    fs.unlinkSync(DB_FILE);
    console.log('✅ Base de données supprimée avec succès !');
    console.log('   Une nouvelle base sera créée au prochain démarrage.\n');
  } catch (error) {
    console.error('❌ Erreur lors de la suppression :', error.message);
    process.exit(1);
  }
}

resetDatabase().catch(error => {
  console.error('❌ Erreur :', error.message);
  process.exit(1);
});

