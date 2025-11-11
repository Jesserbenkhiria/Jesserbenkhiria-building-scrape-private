# Démarrage Rapide - Tunisia Construction Finder

## 📦 Installation en 5 minutes

### 1. Installer les dépendances

```bash
npm install
```

### 2. Créer le fichier `.env`

**Créez un nouveau fichier nommé `.env`** à la racine du projet avec ce contenu :

```env
NODE_ENV=development
PORT=4000
BING_KEY=VOTRE_CLE_BING
GOOGLE_PLACES_KEY=VOTRE_CLE_GOOGLE
USE_SERPER=false
SERPER_KEY=
RATE_LIMIT_PER_MINUTE=60
REQUESTS_PER_SECOND=3
```

⚠️ **Remplacez `VOTRE_CLE_BING` et `VOTRE_CLE_GOOGLE` par vos vraies clés !**

### 3. Démarrer

```bash
npm run dev
```

✅ Le serveur démarre sur `http://localhost:4000`

---

## 🧪 Premier test

Ouvrez un nouveau terminal et testez :

```bash
# Test du serveur
curl http://localhost:4000/health

# Recherche rapide
curl "http://localhost:4000/api/search?category=construction&city=Tunis&limit=5"
```

---

## 🔑 Obtenir les clés API gratuitement

### Bing Search API

1. Allez sur https://portal.azure.com/
2. Créez un compte gratuit
3. Créez une ressource "Bing Search v7"
4. Copiez "Key 1" dans votre `.env`

**Gratuit** : 1000 requêtes/mois

### Google Places API

1. Allez sur https://console.cloud.google.com/
2. Créez un nouveau projet
3. Activez "Places API"
4. Créez une clé API
5. Copiez la clé dans votre `.env`

**Gratuit** : 200$/mois de crédit

---

## 🚀 Commandes principales

```bash
# Développement (auto-reload)
npm run dev

# Production
npm run build
npm start

# Linting
npm run lint
```

---

## 📖 Endpoints essentiels

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/health` | Vérifier que le serveur fonctionne |
| GET | `/api/search` | Rechercher des entreprises |
| GET | `/api/companies` | Lister les entreprises enregistrées |
| POST | `/api/run-seed` | Collecter massivement des données |

---

## 💡 Exemples rapides

### Bureaux de construction à Tunis

```bash
curl "http://localhost:4000/api/search?category=construction&city=Tunis&limit=20"
```

### Quincailleries à Sfax

```bash
curl "http://localhost:4000/api/search?category=fournisseur&city=Sfax&limit=20"
```

### Collecte complète (3 villes)

```bash
curl -X POST http://localhost:4000/api/run-seed \
  -H "Content-Type: application/json" \
  -d '{"categories":["construction","fournisseur"],"cities":["Tunis","Sfax","Sousse"],"limitPerQuery":20}'
```

---

## 🐛 Problèmes fréquents

### ❌ "BING_KEY manquante"

➡️ Vérifiez que votre fichier `.env` existe et contient la clé.

### ❌ Port 4000 déjà utilisé

➡️ Changez le port dans `.env` :
```env
PORT=4001
```

### ❌ "Cannot find module"

➡️ Réinstallez les dépendances :
```bash
rm -rf node_modules
npm install
```

---

## 📚 Documentation complète

- **README.md** : Documentation détaillée de l'API
- **INSTALL.md** : Guide d'installation pas à pas
- **EXAMPLES.md** : 50+ exemples de requêtes curl
- **CHANGELOG.md** : Historique des versions

---

## 🎯 Prochaines étapes

1. ✅ Installer et démarrer le serveur
2. ✅ Obtenir les clés API
3. ✅ Tester avec `/health`
4. 🔍 Faire une première recherche
5. 📊 Collecter des données avec `/run-seed`
6. 💾 Explorer les résultats avec `/api/companies`

---

**Bon scraping ! 🇹🇳**

En cas de problème, consultez les logs du serveur dans votre terminal.

