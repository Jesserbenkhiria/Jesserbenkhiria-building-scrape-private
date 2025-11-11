# Changelog

Tous les changements notables de ce projet seront documentés dans ce fichier.

## [1.0.0] - 2025-11-07

### Ajouté
- 🎉 Version initiale MVP
- ✅ Intégration Bing Web Search API
- ✅ Intégration Google Places API
- ✅ Base de données SQLite avec `better-sqlite3`
- ✅ Dédoublonnage intelligent avec algorithme Jaro-Winkler
- ✅ Extraction d'emails et téléphones depuis les sites web
- ✅ API REST avec 4 endpoints principaux :
  - `GET /health` - Health check
  - `GET /api/search` - Recherche d'entreprises
  - `GET /api/companies` - Liste des entreprises enregistrées
  - `POST /api/run-seed` - Collecte complète
- ✅ Rate limiting (60 req/min par défaut)
- ✅ Logging structuré avec Pino
- ✅ Validation des données avec Zod
- ✅ Support de 24 gouvernorats tunisiens
- ✅ 6 mots-clés pour construction
- ✅ 7 mots-clés pour fournisseurs
- ✅ Documentation complète (README, INSTALL, EXAMPLES)

### Catégories supportées
- `construction` : bureaux d'études, entreprises de construction
- `fournisseur` : quincailleries, canqueri, matériaux de construction

### Sources de données
- Bing Web Search (avec focus site:.tn)
- Google Places API (Text Search + Place Details)
- Enrichissement léger (extraction HTML)

### Fonctionnalités techniques
- TypeScript strict mode
- Architecture modulaire (datasources, lib, routes, store)
- Gestion des erreurs centralisée
- Retry automatique avec `p-retry`
- Throttling configurable
- Normalisation des numéros tunisiens (+216)
- Arrêt gracieux du serveur

## [Futur] - Idées d'améliorations

### Potentielles fonctionnalités v1.1
- [ ] Export JSON/CSV des résultats
- [ ] Interface web simple pour la recherche
- [ ] Support de Serper.dev comme source alternative
- [ ] Enrichissement avec extraction de logos
- [ ] Détection automatique de langues (FR/AR)
- [ ] Cache Redis pour les requêtes fréquentes
- [ ] Webhooks pour notifications de nouvelles entreprises
- [ ] API d'authentification avec JWT
- [ ] Statistiques et analytics
- [ ] Support Docker

### Optimisations possibles
- [ ] Batch processing pour grandes collectes
- [ ] Queue système (Bull/BullMQ) pour jobs longs
- [ ] Compression des réponses API (gzip)
- [ ] Index full-text SQLite FTS5
- [ ] Clustering pour parallélisation

### Qualité
- [ ] Tests unitaires (Jest/Vitest)
- [ ] Tests d'intégration
- [ ] CI/CD (GitHub Actions)
- [ ] Coverage > 80%
- [ ] Documentation OpenAPI/Swagger

---

Format basé sur [Keep a Changelog](https://keepachangelog.com/)

