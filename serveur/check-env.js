#!/usr/bin/env node

/**
 * Script de diagnostic pour vérifier le fichier .env
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Diagnostic du fichier .env\n');
console.log('═'.repeat(60));

const envPath = path.join(__dirname, '.env');
const expectedPath = 'C:\\Users\\mega-Pc\\Desktop\\Bulding Scraper\\.env';

console.log('\n📁 Emplacement attendu :');
console.log('   ' + expectedPath);
console.log('\n📁 Emplacement vérifié :');
console.log('   ' + envPath);

// Vérifier si le fichier existe
if (!fs.existsSync(envPath)) {
    console.log('\n❌ PROBLÈME : Le fichier .env n\'existe PAS !');
    console.log('\n🔧 Solution :');
    console.log('   node create-env.js');
    process.exit(1);
}

console.log('\n✅ Le fichier .env existe');

// Lire le contenu
const content = fs.readFileSync(envPath, 'utf-8');
console.log('\n📄 Contenu du fichier .env :');
console.log('─'.repeat(60));
console.log(content);
console.log('─'.repeat(60));

// Vérifier les variables importantes
const lines = content.split('\n');
const vars = {};

for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        vars[key] = valueParts.join('=');
    }
}

console.log('\n🔑 Variables détectées :');
console.log('   NODE_ENV =', vars.NODE_ENV || '(vide)');
console.log('   PORT =', vars.PORT || '(vide)');
console.log('   BING_KEY =', vars.BING_KEY || '(vide)');
console.log('   GOOGLE_PLACES_KEY =', vars.GOOGLE_PLACES_KEY || '(vide)');

// Vérification finale
console.log('\n🎯 Vérification :');

if (!vars.GOOGLE_PLACES_KEY || vars.GOOGLE_PLACES_KEY.trim() === '') {
    console.log('   ❌ GOOGLE_PLACES_KEY est VIDE !');
    console.log('\n🔧 Solution : Modifiez le fichier .env et ajoutez :');
    console.log('   GOOGLE_PLACES_KEY=AIzaSyASjFVs_c9uzShr6dBG1M1ry2Fe65ClwHk');
} else if (vars.GOOGLE_PLACES_KEY.includes('YOUR_GOOGLE')) {
    console.log('   ❌ GOOGLE_PLACES_KEY contient encore le placeholder !');
    console.log('\n🔧 Solution : Remplacez YOUR_GOOGLE_PLACES_KEY par votre vraie clé');
} else {
    console.log('   ✅ GOOGLE_PLACES_KEY est configurée !');
    console.log('   Valeur : ' + vars.GOOGLE_PLACES_KEY.substring(0, 20) + '...');
}

// Test de chargement avec dotenv
console.log('\n📦 Test de chargement avec dotenv :');
try {
    require('dotenv').config();
    console.log('   ✅ dotenv chargé avec succès');
    console.log('   process.env.GOOGLE_PLACES_KEY =', process.env.GOOGLE_PLACES_KEY ? 'Défini ✅' : 'NON DÉFINI ❌');

    if (process.env.GOOGLE_PLACES_KEY) {
        console.log('   Valeur : ' + process.env.GOOGLE_PLACES_KEY.substring(0, 20) + '...');
    }
} catch (error) {
    console.log('   ❌ Erreur lors du chargement de dotenv :', error.message);
}

console.log('\n' + '═'.repeat(60));
console.log('\n🚀 Actions à faire :');
console.log('   1. Si GOOGLE_PLACES_KEY est vide → Modifiez le fichier .env');
console.log('   2. Arrêtez le serveur (Ctrl+C)');
console.log('   3. Relancez : npm run dev');
console.log('   4. Vérifiez les logs au démarrage\n');

