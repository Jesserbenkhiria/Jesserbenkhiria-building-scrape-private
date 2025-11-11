# 🔍 Recherche automatique d'usines - Guide complet

## 📋 Vue d'ensemble

La fonctionnalité de recherche d'usines permet de découvrir automatiquement des usines de production en Tunisie via Google Places API, avec détection intelligente des doublons et classification automatique par type.

## 🚀 Comment ça marche

### 1. Recherche multi-mots-clés
Le système utilise **56 mots-clés spécialisés** organisés par type d'usine :

#### 🏭 Ciment (6 mots-clés)
- usine de ciment, cimenterie, cimenterie Tunisie, usine ciment, fabrication ciment, producteur ciment

#### 🔩 Acier (10 mots-clés)
- usine acier, usine d'acier, aciérie, aciérie Tunisie, sidérurgie, sidérurgie Tunisie, fabrication acier, production acier, fer à béton usine, laminoir

#### 🪟 Verre (6 mots-clés)
- usine verre, verrerie, verrerie Tunisie, fabrication verre, production verre, verre industriel

#### 🌲 Bois (6 mots-clés)
- usine bois, scierie, scierie Tunisie, transformation bois, menuiserie industrielle, fabrication bois

#### 🧪 Plastique (7 mots-clés)
- usine plastique, plasturgie, fabrication plastique, production plastique, usine PVC, fabrication PVC, tuyaux PVC usine

#### 🏗️ Autres matériaux (21 mots-clés)
- usine matériaux construction, fabricant matériaux construction, producteur matériaux, usine béton, centrale béton, béton prêt emploi, production béton, usine préfabriqué, préfabrication béton, usine carrelage, fabrication carrelage, céramique industrielle, usine sanitaire, fabrication sanitaire, usine aluminium, fabrication aluminium, usine peinture, fabrication peinture, usine isolation, fabrication isolation

### 2. Recherche géographique
Par défaut, le système recherche dans **tous les 24 gouvernorats de Tunisie** :
- Tunis, Ariana, Ben Arous, Manouba, Nabeul, Bizerte, Beja, Jendouba, Kef, Siliana, Zaghouan, Sousse, Monastir, Mahdia, Kairouan, Kasserine, Sidi Bouzid, Sfax, Gabès, Medenine, Tataouine, Gafsa, Tozeur, Kebili

### 3. Détection automatique du type
Le système identifie automatiquement le type d'usine selon le mot-clé :

```typescript
Mot-clé contient "ciment"         → Type: ciment
Mot-clé contient "acier/sidér"    → Type: acier
Mot-clé contient "verre/verrerie" → Type: verre
Mot-clé contient "bois/scierie"   → Type: bois
Mot-clé contient "plastique/pvc"  → Type: plastique
Autres mots-clés                  → Type: autre
```

### 4. Détection des doublons
Le système utilise 3 niveaux de détection :

**Niveau 1 : Site web (le plus fiable)**
- Normalisation du domaine
- Comparaison exacte
- Exemple : `www.ciment-tn.com` = `https://ciment-tn.com/`

**Niveau 2 : Téléphone**
- Normalisation des numéros tunisiens
- Gestion des formats multiples
- Exemple : `+216 71 123 456` = `71123456` = `(71) 123-456`

**Niveau 3 : Nom**
- Normalisation (minuscules, accents, espaces)
- Calcul de similarité (Levenshtein)
- Seuil : 95% de similarité
- Exemple : "Cimenterie de Tunis" ≈ "CIMENTERIE DE TUNIS S.A."

### 5. Fusion intelligente
Lorsqu'un doublon est détecté, le système fusionne les données :

```typescript
Téléphones:      [A, B] + [B, C] = [A, B, C]
Emails:          [X] + [Y, Z]    = [X, Y, Z]
Produits:        [P1] + [P2]     = [P1, P2]
Certifications:  [ISO] + [CE]    = [ISO, CE]
Confiance:       0.8 vs 0.9      = 0.9 (maximum)
Site web:        null vs "url"   = "url" (meilleure info)
```

## 🎯 Utilisation

### Commande de base

```bash
curl -X POST http://localhost:4000/api/search-usines \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "cities": ["Tunis", "Sfax", "Sousse"],
    "limitPerQuery": 100
  }'
```

**Résultat :**
- Recherche dans 3 villes
- Utilise tous les 56 mots-clés
- Maximum 100 résultats par requête
- Total : 56 × 3 = 168 requêtes Google Places

### Recherche ciblée par type

#### Uniquement les cimenteries
```bash
curl -X POST http://localhost:4000/api/search-usines \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "cities": ["Tunis", "Sfax"],
    "keywords": [
      "cimenterie",
      "usine de ciment",
      "fabrication ciment",
      "producteur ciment"
    ],
    "limitPerQuery": 50
  }'
```

#### Uniquement les aciéries
```bash
curl -X POST http://localhost:4000/api/search-usines \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "cities": ["Sfax", "Sousse", "Gabès"],
    "keywords": [
      "aciérie",
      "sidérurgie",
      "usine acier",
      "fer à béton usine"
    ]
  }'
```

#### Uniquement les scieries
```bash
curl -X POST http://localhost:4000/api/search-usines \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "cities": ["Tunis", "Bizerte", "Jendouba"],
    "keywords": [
      "scierie",
      "transformation bois",
      "menuiserie industrielle"
    ]
  }'
```

### Recherche exhaustive (toutes les villes)

```bash
curl -X POST http://localhost:4000/api/search-usines \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{}'
```

**Attention :** Cette recherche lance 56 × 24 = **1344 requêtes** !
- Durée estimée : 30-60 minutes
- Coût API : ~1344 requêtes Google Places
- Recommandé : Exécuter hors production

## 📊 Statistiques

### Consulter les statistiques

```bash
curl http://localhost:4000/api/search-usines/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Réponse exemple

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
    {"city": "Sfax", "count": 62},
    {"city": "Sousse", "count": 45}
  ],
  "byType": [
    {"type": "ciment", "count": 45},
    {"type": "acier", "count": 38},
    {"type": "verre", "count": 32}
  ],
  "topProducts": [
    {"product": "Ciment CEM I", "count": 25},
    {"product": "Fer à béton", "count": 18}
  ]
}
```

## 🎓 Exemple complet avec TypeScript

```typescript
import axios from 'axios';

async function searchUsines() {
  const token = 'YOUR_AUTH_TOKEN';
  
  // Recherche des usines de ciment à Tunis et Sfax
  const response = await axios.post(
    'http://localhost:4000/api/search-usines',
    {
      cities: ['Tunis', 'Sfax'],
      keywords: [
        'cimenterie',
        'usine de ciment',
        'fabrication ciment'
      ],
      limitPerQuery: 50
    },
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  console.log('Résultat de la recherche:');
  console.log(`- Total collecté: ${response.data.summary.totalCollected}`);
  console.log(`- Total filtré: ${response.data.summary.totalFiltered}`);
  console.log(`- Doublons évités: ${response.data.summary.totalDuplicatesSkipped}`);
  console.log(`- Total sauvegardé: ${response.data.summary.totalSaved}`);
  
  return response.data;
}

// Exécuter
searchUsines()
  .then(data => console.log('Succès:', data.message))
  .catch(err => console.error('Erreur:', err));
```

## 💡 Bonnes pratiques

### 1. Commencer petit
```bash
# Tester sur une ville d'abord
{
  "cities": ["Tunis"],
  "keywords": ["cimenterie"],
  "limitPerQuery": 20
}
```

### 2. Rechercher par type
```bash
# Un type à la fois
{
  "cities": ["Tunis", "Sfax"],
  "keywords": ["cimenterie", "usine de ciment"],
  "limitPerQuery": 50
}
```

### 3. Surveiller les quotas API
- Google Places : 200$/mois gratuit
- ~$17 pour 1000 requêtes textuelles
- Calculer avant de lancer : mots-clés × villes × coût

### 4. Exécuter hors heures de pointe
```bash
# Planifier avec cron (exemple : 2h du matin)
0 2 * * * curl -X POST ... > /var/log/search-usines.log 2>&1
```

## 📈 Performance

### Vitesse
- ~1-2 secondes par requête Google Places
- ~500ms pour la détection des doublons
- **Total estimé :** 1-3 secondes par combinaison (mot-clé × ville)

### Exemples de durée

| Mots-clés | Villes | Total requêtes | Durée estimée |
|-----------|--------|----------------|---------------|
| 5         | 3      | 15             | 30 sec        |
| 10        | 5      | 50             | 2 min         |
| 56        | 3      | 168            | 6 min         |
| 56        | 24     | 1344           | 45-60 min     |

## 🔒 Sécurité

- ✅ Authentification JWT obligatoire
- ✅ Rate limiting appliqué
- ✅ Validation des paramètres
- ✅ Logs détaillés

## 🐛 Dépannage

### Erreur : "Too many requests"
**Solution :** Augmenter les délais ou réduire le nombre de villes

### Erreur : "Google Places quota exceeded"
**Solution :** Attendre le renouvellement du quota ou augmenter la limite

### Aucun résultat trouvé
**Causes possibles :**
- Mots-clés trop spécifiques
- Ville mal orthographiée
- Pas d'usines dans cette région

**Solution :** Essayer des mots-clés plus génériques

### Beaucoup de doublons
**Normal !** Le système détecte et élimine automatiquement les doublons.
Les logs affichent : `🔁 Doublon (site/tél/nom)`

## 📚 Ressources

- **Documentation API complète** : [USINE.md](./USINE.md)
- **Guide de démarrage** : [NOUVEAU-SCHEMA-USINE.md](./NOUVEAU-SCHEMA-USINE.md)
- **Mots-clés** : [src/lib/keywords.ts](./src/lib/keywords.ts)
- **Code source** : [src/routes/search-usines.ts](./src/routes/search-usines.ts)

## 🎉 Résumé

La recherche automatique d'usines offre :
- ✅ **56 mots-clés spécialisés**
- ✅ **Couverture nationale** (24 gouvernorats)
- ✅ **Détection intelligente du type**
- ✅ **Élimination des doublons**
- ✅ **Fusion automatique des données**
- ✅ **Statistiques détaillées**
- ✅ **Géolocalisation automatique**

**Prêt à découvrir les usines de Tunisie ! 🏭**

