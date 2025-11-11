# Résumé des modifications - Ajout du schéma Usine

## 📝 Vue d'ensemble

Un nouveau schéma **Usine** a été ajouté au projet pour gérer les informations sur les usines de production dans le secteur de la construction en Tunisie.

## ✅ Modifications apportées

### 1. Fichiers modifiés

#### `src/types.ts`
- ✨ Ajout du schéma Zod `UsineSchema` avec validation complète
- ✨ Ajout du type TypeScript `Usine`
- Nouveaux champs spécifiques aux usines :
  - `type` : Type d'usine (ciment, acier, bois, plastique, verre, autre)
  - `capacity` : Capacité de production
  - `products` : Liste des produits fabriqués
  - `certifications` : Certifications (ISO, etc.)

#### `src/store/mongo-repo.ts`
- ✨ Ajout des fonctions de conversion `usineToDocument()` et `documentToUsine()`
- ✨ Ajout de `upsertUsine()` : Insérer ou mettre à jour une usine
- ✨ Ajout de `bulkUpsertUsine()` : Insertion/mise à jour en masse
- ✨ Ajout de `getAllUsines()` : Récupérer toutes les usines avec filtres et pagination
- ✨ Ajout de `getUsineById()` : Récupérer une usine par son ID
- ✨ Ajout de `countUsines()` : Compter le nombre total d'usines
- ✨ Ajout de `getAllUsineTypes()` : Récupérer tous les types d'usines

#### `src/server.ts`
- ✨ Import du nouveau routeur `usineRouter`
- ✨ Enregistrement de la route `/api/usine` avec authentification
- ✨ Ajout de la route dans les logs de démarrage

### 2. Nouveaux fichiers créés

#### `src/routes/usine.ts`
Routes API complètes pour la gestion des usines :
- `GET /api/usine` - Liste avec pagination et filtres
- `GET /api/usine/types` - Types d'usines disponibles
- `GET /api/usine/count` - Nombre total d'usines
- `GET /api/usine/:id` - Récupérer une usine par ID
- `POST /api/usine` - Créer ou mettre à jour une usine
- `PUT /api/usine/:id` - Mettre à jour une usine existante

#### `USINE.md`
Documentation complète du schéma Usine :
- Structure détaillée du schéma
- Documentation de toutes les routes API
- Exemples de requêtes et réponses
- Guide d'utilisation des fonctions
- Notes sur la détection des doublons

#### `scripts/test-usine.ts`
Script de test complet avec :
- 5 usines de test prédéfinies
- 10 tests couvrant toutes les fonctionnalités
- Exemples d'utilisation de toutes les fonctions

#### `SCHEMA-USINE-CHANGES.md`
Ce fichier - Résumé complet des modifications

### 3. Fichier mis à jour

#### `README.md`
- ✨ Nouvelle section "Gestion des usines" dans les API endpoints
- ✨ Exemples de requêtes curl pour les usines
- ✨ Lien vers la documentation détaillée USINE.md

## 🚀 Fonctionnalités principales

### Détection des doublons
Le système détecte automatiquement les doublons en cherchant par :
1. Site web (le plus fiable)
2. Numéro de téléphone
3. Nom normalisé

### Fusion intelligente des données
Lors de la mise à jour d'une usine existante, le système :
- Fusionne les listes (téléphones, emails, produits, certifications)
- Garde le meilleur score de confiance
- Conserve les meilleures informations (site web, adresse, capacité)
- Met à jour automatiquement la date de modification

### Filtrage avancé
Les usines peuvent être filtrées par :
- Ville
- Type d'usine
- Recherche textuelle (nom, adresse, produits)
- Pagination complète

## 📊 Structure de la collection MongoDB

Collection : `usine`

Index suggérés (créés automatiquement par MongoDB) :
- `city` - Pour les filtres par ville
- `type` - Pour les filtres par type
- `website` - Pour la détection des doublons
- `name` - Pour la recherche

## 🧪 Tester les modifications

### 1. Démarrer le serveur
```bash
cd serveur
npm run dev
```

### 2. Exécuter le script de test
```bash
cd serveur
npx ts-node scripts/test-usine.ts
```

Ce script va :
- Insérer 5 usines de test
- Tester toutes les fonctionnalités
- Afficher des statistiques détaillées
- Tester la mise à jour d'une usine existante

### 3. Tester l'API via curl
```bash
# Récupérer l'authentification
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}'

# Utiliser le token reçu
export TOKEN="<votre_token>"

# Lister les usines
curl http://localhost:4000/api/usine \
  -H "Authorization: Bearer $TOKEN"

# Créer une usine
curl -X POST http://localhost:4000/api/usine \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Test Usine",
    "type": "ciment",
    "city": "Tunis"
  }'
```

## 📚 Documentation

- **Documentation détaillée** : Voir [USINE.md](./USINE.md)
- **Exemples d'API** : Voir [README.md](./README.md#5-gestion-des-usines)
- **Script de test** : Voir [scripts/test-usine.ts](./scripts/test-usine.ts)

## ✨ Types d'usines supportés

- `ciment` - Usines de ciment
- `acier` - Usines de production d'acier
- `bois` - Scieries et usines de transformation du bois
- `plastique` - Usines de plastique et matériaux synthétiques
- `verre` - Usines de verre
- `autre` - Autres types d'usines

## 🔒 Sécurité

- Toutes les routes `/api/usine/*` nécessitent une authentification JWT
- Validation Zod sur tous les endpoints POST/PUT
- Protection contre les injections avec MongoDB native driver

## 📦 Dépendances

Aucune nouvelle dépendance n'a été ajoutée. Le schéma utilise :
- Les dépendances existantes (express, mongodb, zod)
- Les fonctions de normalisation existantes
- Le système d'authentification existant

## 🎯 Prochaines étapes suggérées

1. **Frontend** : Créer une interface React pour gérer les usines
2. **Import** : Créer un script d'import depuis CSV/Excel
3. **Export** : Ajouter des endpoints pour exporter les données
4. **Statistiques** : Ajouter des endpoints pour des statistiques détaillées
5. **Recherche géographique** : Ajouter une recherche par rayon autour d'un point

## 🐛 Tests de non-régression

✅ Tous les tests passent
✅ Aucune erreur de linter
✅ Les routes existantes fonctionnent toujours
✅ Aucune modification des schémas existants (Company, Construction, Fournisseur)

## 📞 Support

Pour toute question ou problème :
1. Consultez [USINE.md](./USINE.md) pour la documentation détaillée
2. Exécutez le script de test pour voir des exemples
3. Vérifiez les logs du serveur en mode développement

