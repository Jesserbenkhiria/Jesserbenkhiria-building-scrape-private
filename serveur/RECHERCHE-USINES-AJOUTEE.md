# ✅ Fonctionnalité de recherche d'usines ajoutée !

## 🎉 Résumé

La fonctionnalité de **recherche automatique d'usines** a été complètement implémentée et est maintenant opérationnelle, exactement comme pour les fournisseurs et les companies !

## 📦 Ce qui a été ajouté

### 1. **Mots-clés spécialisés** (`src/lib/keywords.ts`)
✅ **56 nouveaux mots-clés** organisés par type d'usine :
- 6 pour le ciment (cimenterie, usine de ciment, etc.)
- 10 pour l'acier (aciérie, sidérurgie, laminoir, etc.)
- 6 pour le verre (verrerie, fabrication verre, etc.)
- 6 pour le bois (scierie, transformation bois, etc.)
- 7 pour le plastique (plasturgie, usine PVC, etc.)
- 21 pour les autres matériaux (béton, carrelage, sanitaire, etc.)

✅ Mise à jour des fonctions pour supporter la catégorie `'usine'`
- `getKeywordsForCategory()` 
- `generateQueries()`

### 2. **Route de recherche** (`src/routes/search-usines.ts`)
✅ Route complète similaire à `search-fournisseurs.ts` avec :
- `POST /api/search-usines` - Recherche automatique avec détection de doublons
- `GET /api/search-usines/status` - Statistiques détaillées

**Fonctionnalités clés :**
- 🔍 Recherche via Google Places
- 🏭 Détection automatique du type d'usine
- 🔁 Détection des doublons (3 niveaux : site web, téléphone, nom)
- 🔄 Fusion intelligente des données
- 📊 Statistiques en temps réel
- 📍 Support multi-villes
- 🎯 Mots-clés personnalisables

### 3. **Intégration serveur** (`src/server.ts`)
✅ Import et enregistrement de la route
✅ Ajout dans les logs de démarrage
✅ Authentification JWT activée

### 4. **Documentation complète**

#### `USINE.md` (mis à jour)
✅ Section "POST /api/search-usines" ajoutée
✅ Section "GET /api/search-usines/status" ajoutée
✅ Section "Mots-clés de recherche" avec liste complète
✅ Section "Fonctionnalités de recherche" avec détails techniques
✅ Exemples de requêtes et réponses

#### `README.md` (mis à jour)
✅ Exemples d'utilisation de la recherche d'usines
✅ Commandes curl complètes
✅ Route ajoutée dans les logs

#### `RECHERCHE-USINES.md` (nouveau)
✅ Guide complet de 300+ lignes
✅ Explications détaillées du fonctionnement
✅ Exemples d'utilisation par type
✅ Bonnes pratiques
✅ Métriques de performance
✅ Dépannage

## 🚀 Comment utiliser

### Démarrer le serveur
```bash
cd serveur
npm run dev
```

### Lancer une recherche simple

```bash
curl -X POST http://localhost:4000/api/search-usines \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "cities": ["Tunis", "Sfax"],
    "limitPerQuery": 50
  }'
```

### Lancer une recherche ciblée (cimenteries uniquement)

```bash
curl -X POST http://localhost:4000/api/search-usines \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "cities": ["Tunis", "Sfax"],
    "keywords": ["cimenterie", "usine de ciment", "fabrication ciment"],
    "limitPerQuery": 30
  }'
```

### Consulter les statistiques

```bash
curl http://localhost:4000/api/search-usines/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🎯 Fonctionnalités clés

### 1. Détection automatique du type
Le système identifie automatiquement le type d'usine :
```
"cimenterie" → type: ciment
"aciérie" → type: acier
"verrerie" → type: verre
"scierie" → type: bois
"plasturgie" → type: plastique
```

### 2. Détection des doublons (3 niveaux)
1. **Par site web** (le plus fiable)
2. **Par téléphone** (numéros normalisés)
3. **Par nom** (similarité Levenshtein > 95%)

### 3. Fusion intelligente
Lorsqu'un doublon est détecté :
- Les téléphones sont fusionnés (unique)
- Les emails sont fusionnés (unique)
- Les produits sont fusionnés (unique)
- Les certifications sont fusionnées (unique)
- Le meilleur score de confiance est conservé
- Les sources sont additionnées

### 4. Filtrage automatique
- Entreprises non pertinentes éliminées
- Ajustement automatique de la confiance
- Géolocalisation via Google Places

## 📊 Statistiques disponibles

Les statistiques incluent :
- ✅ Nombre total d'usines
- ✅ Pourcentage avec site web
- ✅ Pourcentage avec téléphone
- ✅ Pourcentage avec coordonnées GPS
- ✅ Top 10 villes
- ✅ Répartition par type
- ✅ Top 10 produits

## 🔍 Mots-clés disponibles

### Par type d'usine

**Ciment (6)** : cimenterie, usine de ciment, fabrication ciment, etc.

**Acier (10)** : aciérie, sidérurgie, laminoir, fer à béton, etc.

**Verre (6)** : verrerie, fabrication verre, verre industriel, etc.

**Bois (6)** : scierie, transformation bois, menuiserie industrielle, etc.

**Plastique (7)** : plasturgie, usine PVC, fabrication plastique, etc.

**Autres (21)** : béton, carrelage, sanitaire, aluminium, peinture, isolation, etc.

**Total : 56 mots-clés spécialisés**

## 📈 Performance

| Mots-clés | Villes | Requêtes | Durée estimée |
|-----------|--------|----------|---------------|
| 5         | 3      | 15       | ~30 sec       |
| 10        | 5      | 50       | ~2 min        |
| 56        | 3      | 168      | ~6 min        |
| 56        | 24     | 1344     | ~45-60 min    |

## 🎓 Exemples avancés

### Recherche par catégorie

#### Toutes les cimenteries
```json
{
  "keywords": ["cimenterie", "usine de ciment", "usine ciment", "fabrication ciment", "producteur ciment"],
  "cities": ["Tunis", "Sfax", "Sousse", "Bizerte"]
}
```

#### Toutes les aciéries
```json
{
  "keywords": ["aciérie", "sidérurgie", "usine acier", "production acier", "fer à béton usine"],
  "cities": ["Sfax", "Sousse", "Gabès"]
}
```

#### Toutes les scieries
```json
{
  "keywords": ["scierie", "transformation bois", "menuiserie industrielle"],
  "cities": ["Tunis", "Bizerte", "Jendouba", "Kef"]
}
```

### Recherche régionale

#### Nord (Tunis, Bizerte, Ariana)
```json
{
  "cities": ["Tunis", "Ariana", "Ben Arous", "Bizerte", "Nabeul"],
  "limitPerQuery": 100
}
```

#### Centre (Sousse, Sfax, Monastir)
```json
{
  "cities": ["Sousse", "Monastir", "Mahdia", "Sfax", "Kairouan"],
  "limitPerQuery": 100
}
```

#### Sud (Gabès, Gafsa, Medenine)
```json
{
  "cities": ["Gabès", "Medenine", "Tataouine", "Gafsa", "Tozeur"],
  "limitPerQuery": 100
}
```

## 📚 Documentation

Pour plus de détails, consultez :

1. **[RECHERCHE-USINES.md](./RECHERCHE-USINES.md)** - Guide complet de la recherche
2. **[USINE.md](./USINE.md)** - Documentation technique complète
3. **[NOUVEAU-SCHEMA-USINE.md](./NOUVEAU-SCHEMA-USINE.md)** - Guide de démarrage
4. **[README.md](./README.md)** - Documentation générale

## 🔧 Fichiers modifiés/créés

### Modifiés
- ✅ `src/lib/keywords.ts` - Ajout des mots-clés et mise à jour des fonctions
- ✅ `src/server.ts` - Intégration de la route
- ✅ `USINE.md` - Ajout de la documentation de recherche
- ✅ `README.md` - Ajout des exemples de recherche

### Créés
- ✅ `src/routes/search-usines.ts` - Route de recherche complète (370+ lignes)
- ✅ `RECHERCHE-USINES.md` - Guide complet (300+ lignes)
- ✅ `RECHERCHE-USINES-AJOUTEE.md` - Ce fichier

## ✨ Points forts

✅ **Similaire aux fournisseurs** - Même approche, même qualité  
✅ **56 mots-clés spécialisés** - Couverture exhaustive  
✅ **Détection automatique du type** - Intelligence intégrée  
✅ **Détection des doublons** - 3 niveaux de vérification  
✅ **Fusion intelligente** - Aucune perte de données  
✅ **Statistiques complètes** - Vue d'ensemble détaillée  
✅ **Documentation complète** - Guides et exemples  
✅ **Aucune erreur de linter** - Code propre et validé  

## 🎉 Résultat final

**La fonctionnalité de recherche d'usines est maintenant complètement opérationnelle !**

Vous pouvez :
- ✅ Rechercher des usines dans toutes les villes de Tunisie
- ✅ Filtrer par type (ciment, acier, verre, bois, plastique)
- ✅ Personnaliser les mots-clés de recherche
- ✅ Consulter des statistiques détaillées
- ✅ Éviter automatiquement les doublons
- ✅ Fusionner intelligemment les données

**Exactement comme pour les fournisseurs et les companies ! 🚀**

---

## 🔥 Pour commencer maintenant

```bash
# 1. Démarrer le serveur
cd serveur
npm run dev

# 2. S'authentifier (dans un autre terminal)
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}'

# 3. Lancer une recherche test
curl -X POST http://localhost:4000/api/search-usines \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "cities": ["Tunis"],
    "keywords": ["cimenterie"],
    "limitPerQuery": 10
  }'

# 4. Consulter les statistiques
curl http://localhost:4000/api/search-usines/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Bonne recherche ! 🏭🔍**

