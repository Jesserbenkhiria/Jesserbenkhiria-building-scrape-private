# Schéma Usine - Documentation

## Vue d'ensemble

Le schéma **Usine** a été ajouté pour gérer les informations sur les usines de production dans le secteur de la construction en Tunisie.

## Structure du schéma

### Champs du schéma Usine

| Champ | Type | Description | Obligatoire |
|-------|------|-------------|-------------|
| `id` | number | Identifiant unique (généré automatiquement) | Non |
| `name` | string | Nom de l'usine | Oui |
| `type` | enum | Type d'usine (ciment, acier, bois, plastique, verre, autre) | Oui |
| `capacity` | string | Capacité de production (ex: "1000 tonnes/mois") | Non |
| `products` | string[] | Liste des produits fabriqués | Non (défaut: []) |
| `certifications` | string[] | Certifications (ISO, etc.) | Non (défaut: []) |
| `phones` | string[] | Numéros de téléphone | Non (défaut: []) |
| `emails` | string[] | Adresses email | Non (défaut: []) |
| `website` | string | Site web | Non |
| `social` | string[] | Réseaux sociaux | Non (défaut: []) |
| `address` | string | Adresse | Non |
| `city` | string | Ville | Non |
| `country` | string | Pays | Non (défaut: "Tunisie") |
| `lat` | number | Latitude | Non |
| `lng` | number | Longitude | Non |
| `sources` | SourceRef[] | Sources d'information | Non (défaut: []) |
| `confidence` | number | Score de confiance (0-1) | Non (défaut: 0.5) |
| `created_at` | string | Date de création (ISO 8601) | Non (auto) |
| `updated_at` | string | Date de mise à jour (ISO 8601) | Non (auto) |

### Types d'usine

Les types d'usine disponibles sont :
- `ciment` - Usines de ciment
- `acier` - Usines de production d'acier
- `bois` - Scieries et usines de transformation du bois
- `plastique` - Usines de plastique et matériaux synthétiques
- `verre` - Usines de verre
- `autre` - Autres types d'usines

## Routes API

Toutes les routes nécessitent une authentification (token JWT).

### POST /api/search-usines

Lance une recherche automatique d'usines via Google Places avec détection de doublons.

**Body Parameters:**
- `cities` (string[], optionnel) - Liste des villes (défaut: tous les gouvernorats)
- `limitPerQuery` (number, défaut: 300) - Limite de résultats par requête
- `keywords` (string[], optionnel) - Mots-clés personnalisés (défaut: USINE_KEYWORDS)

**Exemple de requête:**
```bash
POST /api/search-usines
Authorization: Bearer <token>
Content-Type: application/json

{
  "cities": ["Tunis", "Sfax", "Sousse"],
  "limitPerQuery": 100,
  "keywords": ["cimenterie", "aciérie", "usine verre"]
}
```

**Exemple de réponse:**
```json
{
  "success": true,
  "summary": {
    "totalCollected": 450,
    "totalFiltered": 120,
    "totalDuplicatesSkipped": 45,
    "totalSaved": 285,
    "totalProcessed": 285
  },
  "details": {
    "keywords": 3,
    "cities": 3,
    "queriesExecuted": 9
  },
  "message": "Recherche terminée: 285 usines sauvegardées (45 doublons évités)"
}
```

### GET /api/search-usines/status

Récupère les statistiques des usines enregistrées.

**Exemple de réponse:**
```json
{
  "success": true,
  "statistics": {
    "total": 285,
    "withWebsite": 220,
    "withPhone": 270,
    "withCoordinates": 250,
    "completenessPercentage": {
      "website": "77.2%",
      "phone": "94.7%",
      "coordinates": "87.7%"
    }
  },
  "topCities": [
    {"city": "Tunis", "count": 85},
    {"city": "Sfax", "count": 62}
  ],
  "byType": [
    {"type": "ciment", "count": 45},
    {"type": "acier", "count": 38}
  ],
  "topProducts": [
    {"product": "Ciment CEM I", "count": 25}
  ]
}
```

### GET /api/usine

Récupère la liste des usines avec pagination et filtres.

**Query Parameters:**
- `limit` (number, défaut: 20) - Nombre d'éléments par page
- `offset` (number, défaut: 0) - Position de départ
- `city` (string, optionnel) - Filtrer par ville
- `q` (string, optionnel) - Recherche textuelle (nom, adresse, site web, produits)
- `type` (string, optionnel) - Filtrer par type d'usine

**Exemple de requête:**
```bash
GET /api/usine?limit=20&offset=0&city=Tunis&type=ciment
Authorization: Bearer <token>
```

**Exemple de réponse:**
```json
{
  "count": 5,
  "total": 15,
  "items": [
    {
      "name": "Usine de Ciment de Tunis",
      "type": "ciment",
      "capacity": "500000 tonnes/an",
      "products": ["Ciment CEM I", "Ciment CEM II"],
      "certifications": ["ISO 9001", "ISO 14001"],
      "phones": ["+216 71 123 456"],
      "emails": ["contact@ciment-tunis.tn"],
      "website": "https://ciment-tunis.tn",
      "address": "Zone Industrielle, Tunis",
      "city": "Tunis",
      "country": "Tunisie",
      "lat": 36.806389,
      "lng": 10.181667,
      "confidence": 0.9,
      "created_at": "2025-11-11T10:00:00.000Z",
      "updated_at": "2025-11-11T10:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "pageSize": 20,
    "offset": 0,
    "hasNextPage": true,
    "hasPrevPage": false,
    "nextOffset": 20,
    "prevOffset": null
  }
}
```

### GET /api/usine/types

Récupère la liste de tous les types d'usines présents dans la base de données.

**Exemple de réponse:**
```json
{
  "types": ["acier", "ciment", "verre"],
  "count": 3
}
```

### GET /api/usine/count

Récupère le nombre total d'usines.

**Exemple de réponse:**
```json
{
  "count": 42
}
```

### GET /api/usine/:id

Récupère une usine par son ID.

**Exemple de requête:**
```bash
GET /api/usine/507f1f77bcf86cd799439011
Authorization: Bearer <token>
```

**Exemple de réponse:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "Usine de Ciment de Tunis",
  "type": "ciment",
  "capacity": "500000 tonnes/an",
  ...
}
```

### POST /api/usine

Crée ou met à jour une usine (upsert basé sur le nom, site web ou téléphone).

**Body:**
```json
{
  "name": "Usine de Ciment de Sfax",
  "type": "ciment",
  "capacity": "300000 tonnes/an",
  "products": ["Ciment CEM II"],
  "certifications": ["ISO 9001"],
  "phones": ["+216 74 123 456"],
  "emails": ["contact@ciment-sfax.tn"],
  "website": "https://ciment-sfax.tn",
  "address": "Route de Tunis, Sfax",
  "city": "Sfax",
  "lat": 34.740009,
  "lng": 10.760009,
  "confidence": 0.85
}
```

**Exemple de réponse (création):**
```json
{
  "success": true,
  "id": "507f1f77bcf86cd799439012",
  "isNew": true,
  "message": "Usine créée avec succès"
}
```

**Exemple de réponse (mise à jour):**
```json
{
  "success": true,
  "id": "507f1f77bcf86cd799439012",
  "isNew": false,
  "message": "Usine mise à jour avec succès"
}
```

### PUT /api/usine/:id

Met à jour une usine existante par son ID.

**Body:** Identique à POST

**Exemple de réponse:**
```json
{
  "success": true,
  "id": "507f1f77bcf86cd799439012",
  "message": "Usine mise à jour avec succès"
}
```

## Fonctions disponibles dans mongo-repo.ts

### `upsertUsine(usine: Omit<Usine, 'id'>): Promise<{ id: string; isNew: boolean }>`
Insère ou met à jour une usine. La détection des doublons se fait par :
1. Site web (le plus fiable)
2. Numéro de téléphone
3. Nom normalisé

### `bulkUpsertUsine(usines: Omit<Usine, 'id'>[]): Promise<number>`
Insère ou met à jour plusieurs usines en masse. Retourne le nombre de nouvelles usines créées.

### `getAllUsines(limit?, offset?, city?, searchQuery?, type?): Promise<{ items: Omit<Usine, 'id'>[]; total: number }>`
Récupère toutes les usines avec filtres et pagination.

### `getUsineById(id: string): Promise<Usine | null>`
Récupère une usine par son ID.

### `countUsines(): Promise<number>`
Compte le nombre total d'usines.

### `getAllUsineTypes(): Promise<string[]>`
Récupère la liste de tous les types d'usines présents dans la base.

## Collection MongoDB

Les données sont stockées dans la collection MongoDB `usine` avec les index suivants :
- Index sur `city` (pour les filtres par ville)
- Index sur `type` (pour les filtres par type)
- Index sur `website` (pour la détection des doublons)
- Index sur `name` (pour la recherche)

## Exemples d'utilisation

### Créer une nouvelle usine
```typescript
import { upsertUsine } from './store/mongo-repo';

const result = await upsertUsine({
  name: "Usine de Verre de Bizerte",
  type: "verre",
  capacity: "50000 m²/an",
  products: ["Verre plat", "Double vitrage"],
  certifications: ["ISO 9001"],
  phones: ["+216 72 123 456"],
  city: "Bizerte",
  confidence: 0.8
});

console.log(`Usine ${result.isNew ? 'créée' : 'mise à jour'} avec l'ID: ${result.id}`);
```

### Récupérer les usines d'une ville
```typescript
import { getAllUsines } from './store/mongo-repo';

const { items, total } = await getAllUsines(20, 0, "Tunis");
console.log(`${total} usines trouvées à Tunis`);
```

### Filtrer par type
```typescript
const { items, total } = await getAllUsines(20, 0, undefined, undefined, "ciment");
console.log(`${total} usines de ciment trouvées`);
```

## Mots-clés de recherche

Le système utilise 56 mots-clés spécialisés pour trouver les usines :

### Ciment
- usine de ciment, cimenterie, cimenterie Tunisie, usine ciment, fabrication ciment, producteur ciment

### Acier
- usine acier, usine d'acier, aciérie, aciérie Tunisie, sidérurgie, sidérurgie Tunisie, fabrication acier, production acier, fer à béton usine, laminoir

### Verre
- usine verre, verrerie, verrerie Tunisie, fabrication verre, production verre, verre industriel

### Bois
- usine bois, scierie, scierie Tunisie, transformation bois, menuiserie industrielle, fabrication bois

### Plastique
- usine plastique, plasturgie, fabrication plastique, production plastique, usine PVC, fabrication PVC, tuyaux PVC usine

### Autres matériaux
- usine matériaux construction, fabricant matériaux construction, producteur matériaux, usine béton, centrale béton, béton prêt emploi, production béton, usine préfabriqué, préfabrication béton, usine carrelage, fabrication carrelage, céramique industrielle, usine sanitaire, fabrication sanitaire, usine aluminium, fabrication aluminium, usine peinture, fabrication peinture, usine isolation, fabrication isolation

## Fonctionnalités de recherche

### Détection automatique du type
Le système détecte automatiquement le type d'usine basé sur les mots-clés utilisés :
- Mots-clés contenant "ciment" → type `ciment`
- Mots-clés contenant "acier", "sidér", "laminoir" → type `acier`
- Mots-clés contenant "verre", "verrerie" → type `verre`
- Mots-clés contenant "bois", "scierie", "menuiserie" → type `bois`
- Mots-clés contenant "plastique", "plasturgie", "pvc" → type `plastique`
- Autres → type `autre`

### Détection des doublons
Le système utilise 3 méthodes pour détecter les doublons :
1. **Par site web** (le plus fiable) - normalisation du domaine
2. **Par téléphone** - normalisation des numéros tunisiens
3. **Par nom** - normalisation + calcul de similarité (Levenshtein)

### Filtrage intelligent
- Filtrage des entreprises non pertinentes
- Ajustement automatique de la confiance
- Géolocalisation automatique via Google Places

## Notes importantes

- Le système de détection des doublons fusionne automatiquement les données (emails, téléphones, produits, certifications)
- Le score de confiance est maintenu au maximum entre l'ancien et le nouveau
- Les dates `created_at` et `updated_at` sont gérées automatiquement
- Les normalisations sont appliquées sur les noms, téléphones et sites web pour améliorer la détection des doublons
- La recherche utilise les mêmes sources que les fournisseurs (Google Places)
- Le type d'usine est détecté automatiquement selon les mots-clés utilisés

