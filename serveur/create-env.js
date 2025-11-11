#!/usr/bin/env node

/**
 * Script rapide pour créer le fichier .env
 * Usage: node create-env.js
 */

const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(__dirname, '.env');

const envContent = `NODE_ENV=development
PORT=4000
BING_KEY=
GOOGLE_PLACES_KEY=AIzaSyASjFVs_c9uzShr6dBG1M1ry2Fe65ClwHk
USE_SERPER=true
SERPER_KEY=a37752abc4b5af201935adb910dd8f4231c84d99
RATE_LIMIT_PER_MINUTE=60
REQUESTS_PER_SECOND=3
`;

// Vérifier si .env existe déjà
if (fs.existsSync(ENV_FILE)) {
    console.log('⚠️  Le fichier .env existe déjà.');
    console.log('   Si vous voulez le recréer, supprimez-le d\'abord.\n');
    process.exit(0);
}

// Créer le fichier .env
try {
    fs.writeFileSync(ENV_FILE, envContent, 'utf-8');
    console.log('✅ Fichier .env créé avec succès !');
    console.log('   Emplacement : ' + ENV_FILE);
    console.log('\n📝 Contenu :');
    console.log('─'.repeat(50));
    console.log(envContent);
    console.log('─'.repeat(50));
    console.log('\n🚀 Prochaines étapes :');
    console.log('   1. Redémarrez le serveur : npm run dev');
    console.log('   2. Testez : curl http://localhost:4000/health');
    console.log('   3. Lancez une recherche !\n');
} catch (error) {
    console.error('❌ Erreur lors de la création du fichier .env :', error.message);
    process.exit(1);
}

