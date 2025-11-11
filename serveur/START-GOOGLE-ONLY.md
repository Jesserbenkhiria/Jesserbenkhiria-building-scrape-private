# 🚀 Démarrage rapide - Google Places uniquement

Ce guide est pour vous si vous avez **seulement la clé Google Places** (pas Bing).

---

## ✅ **Prérequis**

1. Fichier `.env` configuré avec votre clé Google :

```env
NODE_ENV=development
PORT=4000
BING_KEY=
GOOGLE_PLACES_KEY=AIzaSyASjFVs_c9uzShr6dBG1M1ry2Fe65ClwHk
USE_SERPER=false
SERPER_KEY=
RATE_LIMIT_PER_MINUTE=60
REQUESTS_PER_SECOND=3
```

2. Serveur démarré :

```bash
npm install
npm run dev
```

---

## 🎯 **Commandes de base (Google Places uniquement)**

### 1️⃣ Test du serveur

```bash
curl http://localhost:4000/health
```

**Réponse attendue :**

```json
{ "ok": true, "timestamp": "2025-11-07T..." }
```

---

### 2️⃣ Première recherche - Construction à Tunis

```bash
curl "http://localhost:4000/api/search?category=construction&source=places&city=Tunis&limit=20"
```

**Ce qui se passe :**

- ✅ Cherche avec Google Places (pas Bing)
- ✅ Utilise les 16 mots-clés construction
- ✅ Cible Tunis
- ✅ Limite à 20 résultats
- ✅ Enregistre dans la base de données SQLite

**Temps estimé :** 30-60 secondes

---

### 3️⃣ Recherche - Fournisseurs/Quincailleries à Sfax

```bash
curl "http://localhost:4000/api/search?category=fournisseur&source=places&city=Sfax&limit=20"
```

---

### 4️⃣ Recherche - Architecture/Bureaux d'études à Sousse

```bash
curl "http://localhost:4000/api/search?category=construction&source=places&city=Sousse&limit=15"
```

---

## 📊 **Collecte massive (3 villes)**

Pour remplir rapidement votre base de données :

```bash
curl -X POST http://localhost:4000/api/run-seed \
  -H "Content-Type: application/json" \
  -d "{\"categories\":[\"construction\",\"fournisseur\"],\"cities\":[\"Tunis\",\"Sfax\",\"Sousse\"],\"sources\":[\"places\"],\"limitPerQuery\":20}"
```

**Ce qui va se passer :**

- 16 mots-clés construction × 3 villes = 48 requêtes
- 15 mots-clés fournisseur × 3 villes = 45 requêtes
- **Total : 93 requêtes Google Places**
- **Temps estimé : 3-5 minutes**

**Consommation quota Google Places :**

- Text Search : ~93 requêtes = ~0.50$ (si dépassement du crédit gratuit)
- Crédit gratuit : 200$/mois = ~400 requêtes Text Search gratuites

---

## 🗂️ **Consulter les résultats**

### Lister toutes les entreprises enregistrées

```bash
curl "http://localhost:4000/api/companies?limit=100"
```

### Filtrer par catégorie

```bash
# Uniquement construction
curl "http://localhost:4000/api/companies?category=construction&limit=50"

# Uniquement fournisseurs
curl "http://localhost:4000/api/companies?category=fournisseur&limit=50"
```

### Filtrer par ville

```bash
curl "http://localhost:4000/api/companies?city=Tunis&limit=100"
```

### Uniquement celles avec téléphone

```bash
curl "http://localhost:4000/api/companies?hasPhone=true&limit=100"
```

### Recherche textuelle

```bash
curl "http://localhost:4000/api/companies?q=matériaux&limit=50"
```

---

## 🎯 **Stratégie recommandée (économiser le quota)**

### Option 1 : Collecte ciblée (1 ville à la fois)

```bash
# Tunis uniquement
curl -X POST http://localhost:4000/api/run-seed \
  -H "Content-Type: application/json" \
  -d "{\"categories\":[\"construction\",\"fournisseur\"],\"cities\":[\"Tunis\"],\"sources\":[\"places\"],\"limitPerQuery\":20}"
```

**Requêtes : 31 requêtes (16 construction + 15 fournisseur)**

---

### Option 2 : Une catégorie à la fois

```bash
# Seulement construction dans 3 villes
curl -X POST http://localhost:4000/api/run-seed \
  -H "Content-Type: application/json" \
  -d "{\"categories\":[\"construction\"],\"cities\":[\"Tunis\",\"Sfax\",\"Sousse\"],\"sources\":[\"places\"],\"limitPerQuery\":20}"
```

**Requêtes : 48 requêtes**

```bash
# Ensuite, seulement fournisseurs dans 3 villes
curl -X POST http://localhost:4000/api/run-seed \
  -H "Content-Type: application/json" \
  -d "{\"categories\":[\"fournisseur\"],\"cities\":[\"Tunis\",\"Sfax\",\"Sousse\"],\"sources\":[\"places\"],\"limitPerQuery\":20}"
```

**Requêtes : 45 requêtes**

---

## 📈 **Progression recommandée**

### Jour 1 : Tunis uniquement

```bash
curl -X POST http://localhost:4000/api/run-seed \
  -H "Content-Type: application/json" \
  -d "{\"categories\":[\"construction\",\"fournisseur\"],\"cities\":[\"Tunis\"],\"sources\":[\"places\"],\"limitPerQuery\":25}"
```

### Jour 2 : Sfax

```bash
curl -X POST http://localhost:4000/api/run-seed \
  -H "Content-Type: application/json" \
  -d "{\"categories\":[\"construction\",\"fournisseur\"],\"cities\":[\"Sfax\"],\"sources\":[\"places\"],\"limitPerQuery\":25}"
```

### Jour 3 : Autres villes

```bash
curl -X POST http://localhost:4000/api/run-seed \
  -H "Content-Type: application/json" \
  -d "{\"categories\":[\"construction\",\"fournisseur\"],\"cities\":[\"Sousse\",\"Bizerte\",\"Nabeul\"],\"sources\":[\"places\"],\"limitPerQuery\":20}"
```

---

## 💡 **Astuces**

### 1. Vérifier le nombre d'entreprises enregistrées

```bash
curl "http://localhost:4000/api/companies?limit=1" | grep total
```

### 2. Export en JSON

```bash
curl "http://localhost:4000/api/companies?limit=1000" > resultats.json
```

### 3. Filtrer les résultats avec téléphone

```bash
curl "http://localhost:4000/api/companies?hasPhone=true&category=construction&limit=500" > construction_avec_tel.json
```

---

## ⚠️ **Limitations Google Places (sans Bing)**

- ✅ **Avantages :** Données structurées, téléphones, adresses, coordonnées GPS
- ❌ **Inconvénient :** Moins de résultats que Bing pour les petites entreprises sans présence Google

**Résultats typiques par ville :**

- Construction : 30-100 entreprises
- Fournisseurs : 20-80 entreprises

---

## 🔄 **Ajouter Bing plus tard**

Quand vous aurez une clé Bing, modifiez simplement votre `.env` :

```env
BING_KEY=votre_cle_bing_ici
```

Puis utilisez `source=all` au lieu de `source=places` :

```bash
curl "http://localhost:4000/api/search?category=construction&source=all&city=Tunis&limit=30"
```

---

## 🐛 **Dépannage**

### Erreur : "GOOGLE_PLACES_KEY manquante"

➡️ Vérifiez votre fichier `.env`

### Pas de résultats

➡️ Normal si c'est votre première recherche ! Attendez 30-60 secondes

### Erreur 429 (Too Many Requests)

➡️ Vous avez dépassé le quota. Attendez 1 minute ou augmentez `REQUESTS_PER_SECOND=1`

### Base de données vide après recherche

➡️ Vérifiez les logs du serveur dans le terminal

---

## ✅ **Checklist de démarrage**

- [ ] `npm install` exécuté
- [ ] Fichier `.env` créé avec clé Google Places
- [ ] `npm run dev` lancé (serveur sur port 4000)
- [ ] `/health` répond OK
- [ ] Première recherche avec `source=places`
- [ ] Base de données contient des résultats

---

**Bon scraping ! 🇹🇳**
