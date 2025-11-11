#!/usr/bin/env node

/**
 * Script d'initialisation du fichier .env
 * Usage: node scripts/init-env.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ENV_FILE = path.join(__dirname, '..', '.env');
const ENV_TEMPLATE = `NODE_ENV=development
PORT=4000
BING_KEY=YOUR_BING_KEY
GOOGLE_PLACES_KEY=YOUR_GOOGLE_PLACES_KEY
USE_SERPER=false
SERPER_KEY=
RATE_LIMIT_PER_MINUTE=60
REQUESTS_PER_SECOND=3
`;

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

async function main() {
    console.log('🚀 Tunisia Construction Finder - Configuration initiale\n');

    // Vérifier si .env existe déjà
    if (fs.existsSync(ENV_FILE)) {
        const overwrite = await prompt(
            '⚠️  Le fichier .env existe déjà. Voulez-vous le remplacer ? (y/N) '
        );
        if (overwrite.toLowerCase() !== 'y') {
            console.log('❌ Configuration annulée.');
            process.exit(0);
        }
    }

    console.log('\n📝 Veuillez fournir les informations suivantes :\n');
    console.log('   (Laissez vide pour utiliser les valeurs par défaut)\n');

    // Demander les clés API
    const bingKey = await prompt('Clé Bing Search API (ou laissez vide) : ');
    const googleKey = await prompt('Clé Google Places API (ou laissez vide) : ');
    const port = await prompt('Port (défaut: 4000) : ') || '4000';

    // Créer le contenu du fichier .env
    const envContent = `NODE_ENV=development
PORT=${port}
BING_KEY=${bingKey || 'YOUR_BING_KEY'}
GOOGLE_PLACES_KEY=${googleKey || 'YOUR_GOOGLE_PLACES_KEY'}
USE_SERPER=false
SERPER_KEY=
RATE_LIMIT_PER_MINUTE=60
REQUESTS_PER_SECOND=3
`;

    // Écrire le fichier
    fs.writeFileSync(ENV_FILE, envContent, 'utf-8');

    console.log('\n✅ Fichier .env créé avec succès !\n');

    // Vérifications
    if (!bingKey || bingKey === 'YOUR_BING_KEY') {
        console.log('⚠️  Attention : BING_KEY non configurée');
    }
    if (!googleKey || googleKey === 'YOUR_GOOGLE_PLACES_KEY') {
        console.log('⚠️  Attention : GOOGLE_PLACES_KEY non configurée');
    }

    console.log('\n📖 Prochaines étapes :');
    console.log('   1. Si vous n\'avez pas ajouté vos clés API, éditez le fichier .env');
    console.log('   2. Exécutez : npm run dev');
    console.log('   3. Testez : curl http://localhost:' + port + '/health\n');
}

main().catch(error => {
    console.error('❌ Erreur :', error.message);
    process.exit(1);
});

