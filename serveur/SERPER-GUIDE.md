# 🔍 Guide Serper.dev - Tunisia Construction Finder

Serper.dev est une API qui fournit des résultats de recherche Google de manière programmatique. Excellente alternative/complément à Bing et Google Places.

---

## ✅ **Avantages de Serper.dev**

- ✅ Résultats de recherche Google (plus complets que Bing)
- ✅ Pas de limite de quota mensuel (pay-as-you-go)
- ✅ ~0.002$ par requête (~2500 requêtes pour 5$)
- ✅ Trouve des sites web, pages Facebook, Instagram, etc.
- ✅ Pas besoin de compte Google Cloud

---

## 🔑 **Configuration**

Votre clé Serper est déjà dans le fichier `.env` :

```env
USE_SERPER=true
SERPER_KEY=a37752abc4b5af201935adb910dd8f4231c84d99
```

Le serveur va automatiquement détecter cette clé au redémarrage.

---

## 🎯 **Utilisation**

### **Option 1 : Serper uniquement**

```bash
curl "http://localhost:4000/api/search?category=construction&source=serper&city=Tunis&limit=20"
```

### **Option 2 : Combiner Serper + Google Places**

Utilisez les **3 sources** pour maximiser les résultats :

```bash
curl "http://localhost:4000/api/search?category=construction&source=all&city=Tunis&limit=30"
```

Cela va chercher dans :

- ✅ Google Places (données structurées)
- ✅ Serper (résultats Google Search)
- ⚠️ Bing (si clé configurée)

---

## 📊 **Collecte avec Serper**

### **Tunis uniquement (Google Places + Serper)**

```bash
curl -X POST http://localhost:4000/api/run-seed \
  -H "Content-Type: application/json" \
  -d '{
    "categories": ["construction", "fournisseur"],
    "cities": ["Tunis"],
    "sources": ["places", "serper"],
    "limitPerQuery": 20
  }'
```

**Requêtes :** 31 keywords × 2 sources = **62 requêtes**

---

### **3 villes (toutes sources)**

```bash
curl -X POST http://localhost:4000/api/run-seed \
  -H "Content-Type: application/json" \
  -d '{
    "categories": ["construction", "fournisseur"],
    "cities": ["Tunis", "Sfax", "Sousse"],
    "sources": ["all"],
    "limitPerQuery": 15
  }'
```

**Requêtes :** 31 keywords × 3 villes × 2 sources (Places + Serper) = **186 requêtes**

---

## 💰 **Coûts Serper**

| Requêtes      | Coût estimé |
| ------------- | ----------- |
| 50 requêtes   | ~$0.10      |
| 100 requêtes  | ~$0.20      |
| 500 requêtes  | ~$1.00      |
| 2500 requêtes | ~$5.00      |

**Très économique** comparé à d'autres APIs !

---

## 🔄 **Comparaison des sources**

| Source            | Avantages                                         | Inconvénients                            |
| ----------------- | ------------------------------------------------- | ---------------------------------------- |
| **Google Places** | Données structurées, téléphone, adresse, GPS      | Limité aux entreprises avec fiche Google |
| **Serper**        | Beaucoup de résultats, pages web, réseaux sociaux | Pas de téléphone directement             |
| **Bing**          | Gratuit 1000 req/mois, bons résultats Tunisie     | Quota limité                             |

**Recommandation :** Utilisez **`source=all`** pour combiner les 3 et avoir le maximum de résultats !

---

## 🧪 **Exemples Postman**

### **Recherche Serper uniquement**

**Method:** `GET`  
**URL:** `http://localhost:4000/api/search?category=construction&source=serper&city=Tunis&limit=20`

---

### **Collecte avec Serper**

**Method:** `POST`  
**URL:** `http://localhost:4000/api/run-seed`  
**Headers:** `Content-Type: application/json`  
**Body:**

```json
{
  "categories": ["construction", "fournisseur"],
  "cities": ["Tunis", "Sfax"],
  "sources": ["serper"],
  "limitPerQuery": 20
}
```

---

### **Collecte MAXIMALE (les 3 sources)**

```json
{
  "categories": ["construction", "fournisseur"],
  "cities": ["Tunis", "Sfax", "Sousse"],
  "sources": ["all"],
  "limitPerQuery": 15
}
```

**Attention :** Cela fera ~186 requêtes API !

---

## 📈 **Résultats attendus par source**

Pour **"bureau de construction Tunis"** :

| Source          | Résultats typiques   |
| --------------- | -------------------- |
| Google Places   | 15-30 entreprises    |
| Serper          | 20-40 sites web      |
| Bing            | 15-30 sites web      |
| **TOTAL (all)** | **50-100 résultats** |

Après dédoublonnage : ~30-60 entreprises uniques.

---

## 🔍 **Logs attendus avec Serper**

```
🔍 Recherche: construction | Source: all | Villes: Tunis
  → Google Places: "bureau de construction" à Tunis
  → Serper (Google Search): "bureau de construction" à Tunis
  → Google Places: "bureau d'études" à Tunis
  → Serper (Google Search): "bureau d'études" à Tunis
✅ 95 candidats collectés
✅ 62 après dédoublonnage
✅ 62 entreprises enregistrées
```

---

## 🎯 **Stratégie recommandée**

### **Étape 1 : Test rapide**

```bash
curl "http://localhost:4000/api/search?category=construction&source=serper&city=Tunis&limit=10"
```

### **Étape 2 : Collecte ciblée**

```bash
curl -X POST http://localhost:4000/api/run-seed \
  -H "Content-Type: application/json" \
  -d '{
    "categories": ["construction"],
    "cities": ["Tunis"],
    "sources": ["places", "serper"],
    "limitPerQuery": 20
  }'
```

### **Étape 3 : Collecte complète**

```bash
curl -X POST http://localhost:4000/api/run-seed \
  -H "Content-Type: application/json" \
  -d '{
    "categories": ["construction", "fournisseur"],
    "cities": ["Tunis", "Sfax", "Sousse", "Bizerte", "Nabeul"],
    "sources": ["all"],
    "limitPerQuery": 15
  }'
```

---

## ⚠️ **Limites et bonnes pratiques**

### **Rate Limiting**

Par défaut : **3 requêtes/seconde** (configurable dans `.env`)

```env
REQUESTS_PER_SECOND=3
```

Réduisez à `1` ou `2` si vous avez des erreurs de rate limit.

---

### **Gestion des erreurs**

Si Serper rate, les autres sources continuent :

```
  → Serper (Google Search): "bureau de construction" à Tunis
Erreur recherche Serper pour "...": Error: Serper API error 429: Too Many Requests
  → Google Places: "bureau d'études" à Tunis
✅ 30 candidats collectés (Google Places seulement)
```

---

## 📝 **Configuration du .env complet**

```env
NODE_ENV=development
PORT=4000

# Google Places API (gratuit 200$/mois)
GOOGLE_PLACES_KEY=AIzaSyASjFVs_c9uzShr6dBG1M1ry2Fe65ClwHk

# Bing Web Search (gratuit 1000 req/mois)
BING_KEY=

# Serper.dev (pay-as-you-go ~0.002$/req)
USE_SERPER=true
SERPER_KEY=a37752abc4b5af201935adb910dd8f4231c84d99

# Rate limiting
RATE_LIMIT_PER_MINUTE=60
REQUESTS_PER_SECOND=3
```

---

## 🚀 **Redémarrage du serveur**

Après avoir ajouté la clé Serper, redémarrez :

```bash
Ctrl+C
npm run dev
```

Vous devriez voir :

```
✅ Variables d'environnement détectées:
   GOOGLE_PLACES_KEY: ✅ Définie
   BING_KEY: ❌ Non définie
   SERPER_KEY: ✅ Définie
✅ Clés API disponibles: GOOGLE_PLACES_KEY, SERPER_KEY
```

---

## 💡 **Astuces**

### **1. Maximiser les résultats**

Utilisez `source=all` pour combiner les 3 sources :

```bash
curl "http://localhost:4000/api/search?category=construction&source=all&city=Tunis&limit=50"
```

---

### **2. Export des résultats**

```bash
curl "http://localhost:4000/api/companies?limit=1000" > resultats.json
```

---

### **3. Filtrer les doublons après collecte**

Le système dédoublonne automatiquement par :

- Nom + Ville
- Téléphone
- Site web
- Similarité du nom (Jaro-Winkler)

---

## 📖 **Voir aussi**

- **USAGE.md** - Guide d'utilisation général
- **START-GOOGLE-ONLY.md** - Guide pour Google Places uniquement
- **EXAMPLES.md** - 50+ exemples de requêtes

---

**Bon scraping avec Serper ! 🚀**
