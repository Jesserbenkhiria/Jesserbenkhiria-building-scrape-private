# Guide d'installation - Tunisia Construction Finder

## Étape 1 : Prérequis

Assurez-vous d'avoir installé :
- **Node.js 20+** : [Télécharger Node.js](https://nodejs.org/)
- **npm** (inclus avec Node.js)

## Étape 2 : Cloner et installer

```bash
cd "C:\Users\mega-Pc\Desktop\Bulding Scraper"
npm install
```

## Étape 3 : Obtenir les clés API

### Bing Web Search API (gratuit)

1. Visitez [Azure Portal](https://portal.azure.com/)
2. Créez un compte Microsoft gratuit si nécessaire
3. Créez une ressource "Bing Search v7"
4. Copiez la clé API (Key 1)

**Quota gratuit** : 1000 requêtes/mois

### Google Places API (gratuit)

1. Visitez [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un projet
3. Activez "Places API" dans la bibliothèque
4. Créez des identifiants (API Key)
5. Copiez la clé API

**Quota gratuit** : 200$/mois de crédit ≈ 40 000 requêtes

## Étape 4 : Configuration

Créez un fichier `.env` à la racine du projet :

```env
NODE_ENV=development
PORT=4000
BING_KEY=votre_clé_bing_ici
GOOGLE_PLACES_KEY=votre_clé_google_ici
USE_SERPER=false
SERPER_KEY=
RATE_LIMIT_PER_MINUTE=60
REQUESTS_PER_SECOND=3
```

**Important** : Remplacez `votre_clé_bing_ici` et `votre_clé_google_ici` par vos vraies clés !

## Étape 5 : Démarrer l'application

### Mode développement (recommandé pour tester)

```bash
npm run dev
```

Le serveur démarre sur `http://localhost:4000`

### Mode production

```bash
npm run build
npm start
```

## Étape 6 : Tester l'installation

Ouvrez votre navigateur ou utilisez curl :

```bash
# Test du serveur
curl http://localhost:4000/health

# Test d'une recherche (si les clés API sont configurées)
curl "http://localhost:4000/api/search?category=construction&city=Tunis&limit=10"
```

## Dépannage

### Erreur : "BING_KEY manquante" ou "GOOGLE_PLACES_KEY manquante"

➡️ Vérifiez que votre fichier `.env` existe et contient les bonnes clés.

### Erreur : "Cannot find module"

➡️ Exécutez `npm install` à nouveau.

### Le serveur ne démarre pas

➡️ Vérifiez que le port 4000 n'est pas déjà utilisé :

```bash
# Windows PowerShell
netstat -ano | findstr :4000
```

Si le port est utilisé, changez `PORT=4001` dans le fichier `.env`.

### Erreur TypeScript

➡️ Compilez manuellement :

```bash
npm run build
```

## Structure après installation

```
Bulding Scraper/
├── node_modules/          # Dépendances (créé par npm install)
├── src/                   # Code source TypeScript
├── dist/                  # Code compilé (après npm run build)
├── data.db                # Base de données SQLite (créé au 1er lancement)
├── .env                   # Vos clés API (À CRÉER)
├── package.json
├── tsconfig.json
└── README.md
```

## Prochaines étapes

Consultez le [README.md](./README.md) pour :
- Les exemples d'utilisation
- La documentation complète de l'API
- Les bonnes pratiques

---

**Besoin d'aide ?** Vérifiez les logs du serveur dans votre terminal !

