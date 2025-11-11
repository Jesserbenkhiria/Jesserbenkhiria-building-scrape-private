# Tunisia Construction Finder

MVP Node.js/Express pour trouver des entreprises de construction ("bureaux de construction") et des fournisseurs ("canqueri", "quincaillerie", "matériaux de construction") en Tunisie.

## 🚀 Fonctionnalités

- **Recherche multi-sources** : Bing Web Search API + Google Places API
- **Couverture nationale** : Recherche par gouvernorat tunisien
- **Dédoublonnage intelligent** : Normalisation + algorithme fuzzy (Jaro-Winkler)
- **Enrichissement léger** : Extraction d'emails/téléphones depuis les sites web
- **Persistance SQLite** : Stockage local avec `better-sqlite3`
- **API REST** : Endpoints propres avec validation Zod
- **Rate limiting** : Protection contre les abus
- **Logging** : Journalisation structurée avec Pino

## 📋 Prérequis

- Node.js 20+
- Clés API :
  - [Bing Web Search API](https://www.microsoft.com/en-us/bing/apis/bing-web-search-api) (gratuit : 1000 req/mois)
  - [Google Places API](https://developers.google.com/maps/documentation/places/web-service/overview) (gratuit : 200$/mois de crédit)

## 🛠️ Installation

1. **Cloner et installer les dépendances** :

```bash
npm install
```

2. **Configurer les variables d'environnement** :

Créez un fichier `.env` à la racine :

```env
NODE_ENV=development
PORT=4000
BING_KEY=votre_cle_bing
GOOGLE_PLACES_KEY=votre_cle_google_places
USE_SERPER=false
SERPER_KEY=
RATE_LIMIT_PER_MINUTE=60
REQUESTS_PER_SECOND=3
```

3. **Compiler le TypeScript** (optionnel pour production) :

```bash
npm run build
```

## 🚦 Démarrage

### Mode développement

```bash
npm run dev
```

Le serveur démarre sur `http://localhost:4000`

### Mode production

```bash
npm run build
npm start
```

## 📡 API Endpoints

### 1. Health Check

```http
GET /health
```

**Réponse** :
```json
{
  "ok": true,
  "timestamp": "2025-11-07T12:00:00.000Z"
}
```

---

### 2. Recherche d'entreprises

```http
GET /api/search?category=construction&source=all&city=Tunis&limit=50
```

**Paramètres** :
- `category` (requis) : `construction` ou `fournisseur`
- `source` (défaut: `all`) : `bing`, `places`, ou `all`
- `city` (optionnel) : nom du gouvernorat (ex: `Tunis`, `Sfax`, `Sousse`)
- `limit` (défaut: 100) : nombre max de résultats
- `offset` (défaut: 0) : pagination

**Réponse** :
```json
{
  "count": 50,
  "total": 127,
  "items": [
    {
      "id": 1,
      "name": "Bureau d'Études ABC",
      "category": "construction",
      "phones": ["+216 71 123 456"],
      "emails": ["contact@abc.tn"],
      "website": "https://abc.tn",
      "social": ["https://facebook.com/abc"],
      "address": "Avenue Habib Bourguiba, Tunis",
      "city": "Tunis",
      "country": "Tunisie",
      "lat": 36.8065,
      "lng": 10.1815,
      "sources": [
        {
          "kind": "googlePlaces",
          "id": "ChIJ...",
          "url": "https://www.google.com/maps/place/...",
          "timestamp": "2025-11-07T12:00:00.000Z"
        }
      ],
      "confidence": 0.9,
      "created_at": "2025-11-07T12:00:00.000Z",
      "updated_at": "2025-11-07T12:00:00.000Z"
    }
  ],
  "meta": {
    "category": "construction",
    "source": "all",
    "city": "Tunis"
  }
}
```

---

### 3. Liste des entreprises enregistrées

```http
GET /api/companies?category=fournisseur&city=Sfax&hasPhone=true&limit=100
```

**Paramètres** :
- `q` (optionnel) : recherche textuelle (nom, adresse)
- `category` (optionnel) : `construction` ou `fournisseur`
- `city` (optionnel) : filtre par ville
- `hasPhone` (optionnel) : `true` pour uniquement les entreprises avec téléphone
- `limit` (défaut: 100) : nombre de résultats
- `offset` (défaut: 0) : pagination

**Réponse** : identique au format de `/api/search`

---

### 4. Collecte complète (seed)

```http
POST /api/run-seed
Content-Type: application/json

{
  "categories": ["construction", "fournisseur"],
  "cities": ["Tunis", "Sfax", "Sousse"],
  "sources": ["all"],
  "limitPerQuery": 25
}
```

**Body** :
- `categories` (requis) : tableau de catégories
- `cities` (requis) : tableau de villes
- `sources` (défaut: `["all"]`) : sources à utiliser
- `limitPerQuery` (défaut: 30) : limite par combinaison keyword×ville

**Réponse** :
```json
{
  "success": true,
  "stats": {
    "queried": 36,
    "inserted": 234,
    "deduped": 45,
    "bySource": {
      "bing": 150,
      "places": 129
    },
    "byCategory": {
      "construction": 120,
      "fournisseur": 114
    }
  },
  "summary": {
    "totalCandidates": 279,
    "uniqueCompanies": 234,
    "duplicatesRemoved": 45,
    "inserted": 234
  }
}
```

---

### 5. Gestion des usines

```http
GET /api/usine?limit=20&offset=0&city=Tunis&type=ciment
```

**Paramètres** :
- `limit` (défaut: 20) : nombre de résultats
- `offset` (défaut: 0) : pagination
- `city` (optionnel) : filtre par ville
- `q` (optionnel) : recherche textuelle (nom, adresse, produits)
- `type` (optionnel) : filtre par type (`ciment`, `acier`, `bois`, `plastique`, `verre`, `autre`)

**Réponse** :
```json
{
  "count": 5,
  "total": 15,
  "items": [
    {
      "name": "Cimenterie de Carthage",
      "type": "ciment",
      "capacity": "1000000 tonnes/an",
      "products": ["Ciment CEM I 42.5", "Ciment CEM II/A 42.5"],
      "certifications": ["ISO 9001:2015", "ISO 14001:2015"],
      "phones": ["+216 71 234 567"],
      "emails": ["info@carthage-ciment.tn"],
      "website": "https://carthage-ciment.tn",
      "city": "Tunis",
      "confidence": 0.95
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "hasNextPage": true
  }
}
```

#### Créer/Mettre à jour une usine

```http
POST /api/usine
Content-Type: application/json

{
  "name": "Usine de Ciment de Sfax",
  "type": "ciment",
  "capacity": "300000 tonnes/an",
  "products": ["Ciment CEM II"],
  "certifications": ["ISO 9001"],
  "phones": ["+216 74 123 456"],
  "emails": ["contact@ciment-sfax.tn"],
  "city": "Sfax"
}
```

#### Récupérer les types d'usines

```http
GET /api/usine/types
```

**Réponse** :
```json
{
  "types": ["acier", "ciment", "verre"],
  "count": 3
}
```

Pour plus de détails, consultez [USINE.md](./USINE.md).

## 🧪 Exemples d'utilisation

### Recherche de bureaux de construction à Tunis (Google Places)

```bash
curl "http://localhost:4000/api/search?category=construction&source=places&city=Tunis&limit=50"
```

### Recherche de quincailleries à Sfax (toutes sources)

```bash
curl "http://localhost:4000/api/search?category=fournisseur&source=all&city=Sfax&limit=30"
```

### Collecte complète de données

```bash
curl -X POST http://localhost:4000/api/run-seed \
  -H "Content-Type: application/json" \
  -d '{
    "categories": ["construction", "fournisseur"],
    "cities": ["Tunis", "Sfax", "Sousse", "Bizerte"],
    "sources": ["all"],
    "limitPerQuery": 20
  }'
```

### Lister toutes les entreprises avec téléphone

```bash
curl "http://localhost:4000/api/companies?hasPhone=true&limit=100"
```

### Rechercher "matériaux" dans les entreprises

```bash
curl "http://localhost:4000/api/companies?q=matériaux&category=fournisseur"
```

### Lister toutes les usines

```bash
curl "http://localhost:4000/api/usine?limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Filtrer les usines par type

```bash
curl "http://localhost:4000/api/usine?type=ciment&limit=50" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Créer une nouvelle usine

```bash
curl -X POST http://localhost:4000/api/usine \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Usine de Verre de Bizerte",
    "type": "verre",
    "capacity": "50000 m²/an",
    "products": ["Verre plat", "Double vitrage"],
    "certifications": ["ISO 9001"],
    "phones": ["+216 72 123 456"],
    "city": "Bizerte"
  }'
```

### Tester le schéma usine

```bash
cd serveur
npx ts-node scripts/test-usine.ts
```

### Lancer une recherche d'usines

```bash
# Recherche toutes les usines dans toutes les villes
curl -X POST http://localhost:4000/api/search-usines \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "cities": ["Tunis", "Sfax", "Sousse"],
    "limitPerQuery": 100
  }'

# Recherche uniquement les cimenteries
curl -X POST http://localhost:4000/api/search-usines \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "cities": ["Tunis", "Sfax"],
    "keywords": ["cimenterie", "usine de ciment", "fabrication ciment"],
    "limitPerQuery": 50
  }'
```

### Récupérer les statistiques des usines

```bash
curl http://localhost:4000/api/search-usines/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📁 Structure du projet

```
tunisia-construction-finder/
├── src/
│   ├── config/
│   │   └── env.ts              # Configuration et validation des variables d'environnement
│   ├── datasources/
│   │   ├── bing.ts             # Intégration Bing Web Search API
│   │   └── googlePlaces.ts     # Intégration Google Places API
│   ├── lib/
│   │   ├── dedupe.ts           # Dédoublonnage avec Jaro-Winkler
│   │   ├── extract.ts          # Extraction emails/téléphones/réseaux sociaux
│   │   ├── http.ts             # Utilitaires HTTP (retry, throttle)
│   │   ├── keywords.ts         # Mots-clés et gouvernorats
│   │   └── normalize.ts        # Normalisation (noms, téléphones, URLs)
│   ├── routes/
│   │   ├── search.ts           # Routes de recherche
│   │   └── run.ts              # Route de collecte complète
│   ├── store/
│   │   ├── db.ts               # Configuration SQLite
│   │   └── repo.ts             # Repository (CRUD)
│   ├── server.ts               # Serveur Express
│   └── types.ts                # Types TypeScript et schémas Zod
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## 🗄️ Base de données

Le fichier `data.db` est créé automatiquement au premier démarrage. Il contient une table `companies` avec index optimisés.

**Schéma** :
```sql
CREATE TABLE companies (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT CHECK(category IN ('construction', 'fournisseur')),
  phones TEXT DEFAULT '[]',
  emails TEXT DEFAULT '[]',
  website TEXT,
  social TEXT DEFAULT '[]',
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'Tunisie',
  lat REAL,
  lng REAL,
  sources TEXT DEFAULT '[]',
  confidence REAL DEFAULT 0.5,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

## 🔑 Mots-clés utilisés

### Construction
- "bureau de construction"
- "bureau d'études bâtiment"
- "entreprise de construction"
- "entreprise bâtiment"
- "constructeur"
- "maître d'œuvre"

### Fournisseurs
- "canqueri"
- "canquerie"
- "quincaillerie"
- "fournisseur matériaux"
- "dépôt matériaux"
- "matériaux de construction"
- "quincaillerie bâtiment"

## 🌍 Gouvernorats couverts

Tunis, Ariana, Ben Arous, Manouba, Nabeul, Bizerte, Beja, Jendouba, Kef, Siliana, Zaghouan, Sousse, Monastir, Mahdia, Kairouan, Kasserine, Sidi Bouzid, Sfax, Gabès, Medenine, Tataouine, Gafsa, Tozeur, Kebili (24 gouvernorats)

## ⚠️ Limites et bonnes pratiques

### Quotas API
- **Bing** : 1000 requêtes/mois (gratuit), 3 req/sec max
- **Google Places** : 200$/mois de crédit gratuit ≈ 40 000 requêtes Text Search

### Recommandations
- Utilisez `limitPerQuery` bas (20-30) lors des collectes complètes
- Limitez le nombre de villes pour les tests
- Le dédoublonnage réduit significativement le nombre de résultats
- L'enrichissement web est limité à 10 entreprises par recherche (configurable dans `routes/search.ts`)

### Rate Limiting
- Par défaut : 60 requêtes/minute par client
- Configurable via `RATE_LIMIT_PER_MINUTE`
- Réponse 429 si dépassement

## 📝 Licence

ISC

## 🤝 Contribution

Ce projet est un MVP. Les contributions sont les bienvenues !

## 📞 Support

Pour toute question ou problème :
1. Vérifiez que vos clés API sont valides
2. Consultez les logs du serveur
3. Vérifiez les quotas de vos APIs

---

**Bon scraping ! 🇹🇳**

