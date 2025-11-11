# 🔥 Mise à jour des mots-clés - Version complète

## ✅ **Ce qui a changé**

### **Avant :**

- ❌ Seulement **2 mots-clés** par recherche
- ❌ 16 mots-clés construction
- ❌ 15 mots-clés fournisseur

### **Maintenant :**

- ✅ **TOUS les mots-clés** utilisés en une seule recherche
- ✅ **32 mots-clés construction** (doublé !)
- ✅ **35 mots-clés fournisseur** (plus du double !)

---

## 📊 **Nouvelle liste complète**

### **Construction : 32 mots-clés**

```
bureau de construction
bureau d'études
bureau d'études bâtiment
bureau d'études génie civil
entreprise de construction
entreprise construction
entreprise bâtiment
entreprise bâtiment Tunisie
constructeur bâtiment
maître d'œuvre
maître d'ouvrage
contractant général
entreprise travaux publics
travaux de construction
ingénierie bâtiment
génie civil Tunisie
bureau architecte
cabinet d'architecture
architecte Tunisie
bureau ingénieur
bureau d'ingénierie
construction gros œuvre
chantier bâtiment
bureau étude
bureau etude
bureau études
bureau architecture
entreprise bâtiment génie civil
entreprise aménagement
entreprise promotion immobilière
promoteur immobilier
société de construction
```

### **Fournisseur : 35 mots-clés**

```
fournisseur matériaux
fournisseur matériaux de construction
dépôt matériaux
dépôt matériaux de construction
vente matériaux de construction
grossiste matériaux de construction
magasin matériaux
distributeur matériaux
commerce matériaux bâtiment
fournisseur béton
fournisseur acier
fournisseur ciment
magasin sanitaire
fournisseur sanitaire
fournisseur outils bâtiment
quincaillerie
quincaillerie matériaux
quincaillerie bâtiment
magasin quincaillerie
canqueri
canquerie
cancrerie
canqueri matériaux
canquerie bâtiment
dépôt canquerie
fournisseur canquerie
magasin canquerie
magasin bricolage
fournisseur peinture
fournisseur aluminium
fournisseur menuiserie
fournisseur électricité bâtiment
fournisseur plomberie bâtiment
quincaillerie Tunisie
canquerie Tunisie
```

---

## 🚀 **Impact sur les recherches**

### **Test rapide (1 ville)**

```bash
curl "http://localhost:4000/api/search?category=construction&source=places&city=Tunis&limit=50"
```

**Avant :** 2 requêtes API = ~40 résultats  
**Maintenant :** 32 requêtes API = **500-1000+ résultats !**

---

### **Collecte complète (1 ville, 2 catégories)**

```bash
curl -X POST http://localhost:4000/api/run-seed \
  -H "Content-Type: application/json" \
  -d '{
    "categories": ["construction", "fournisseur"],
    "cities": ["Tunis"],
    "sources": ["places"],
    "limitPerQuery": 20
  }'
```

**Avant :** 31 requêtes  
**Maintenant :** **67 requêtes** (32 construction + 35 fournisseur)

**Résultats attendus :** 500-1500 entreprises après dédoublonnage !

---

## ⚠️ **Attention : Consommation de quota**

### **Pour 1 ville (Tunis) avec source=places**

| Catégorie    | Requêtes API | Coût Google Places |
| ------------ | ------------ | ------------------ |
| Construction | 32           | ~$0.16             |
| Fournisseur  | 35           | ~$0.175            |
| **Les 2**    | **67**       | **~$0.34**         |

### **Pour 3 villes (Tunis, Sfax, Sousse)**

| Catégorie    | Requêtes API | Coût       |
| ------------ | ------------ | ---------- |
| Construction | 96 (32×3)    | ~$0.48     |
| Fournisseur  | 105 (35×3)   | ~$0.53     |
| **Les 2**    | **201**      | **~$1.01** |

### **Pour 5 villes**

| Catégorie        | Requêtes API | Coût       |
| ---------------- | ------------ | ---------- |
| Les 2 catégories | **335**      | **~$1.68** |

---

## 🎯 **Stratégie recommandée**

### **Option 1 : Test rapide (économe)**

Limitez manuellement à une seule ville :

```bash
curl "http://localhost:4000/api/search?category=construction&source=places&city=Tunis&limit=100"
```

**Requêtes :** 32  
**Résultats :** 300-600 entreprises

---

### **Option 2 : Collecte ciblée (1 ville)**

```bash
curl -X POST http://localhost:4000/api/run-seed \
  -H "Content-Type: application/json" \
  -d '{
    "categories": ["construction", "fournisseur"],
    "cities": ["Tunis"],
    "sources": ["places"],
    "limitPerQuery": 20
  }'
```

**Requêtes :** 67  
**Temps :** 2-4 minutes  
**Résultats :** 500-1500 entreprises

---

### **Option 3 : Collecte étendue (3 villes principales)**

```bash
curl -X POST http://localhost:4000/api/run-seed \
  -H "Content-Type: application/json" \
  -d '{
    "categories": ["construction", "fournisseur"],
    "cities": ["Tunis", "Sfax", "Sousse"],
    "sources": ["places"],
    "limitPerQuery": 15
  }'
```

**Requêtes :** 201  
**Temps :** 5-10 minutes  
**Résultats :** 1500-4000 entreprises

---

### **Option 4 : Collecte MAXIMALE (Toutes sources)**

⚠️ **ATTENTION : Très gourmand en quota !**

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

**Requêtes avec Google Places + Serper :**

- 201 requêtes Google Places
- 201 requêtes Serper
- **Total : 402 requêtes API**

**Coût estimé :** ~$2.40 (Places) + ~$0.40 (Serper) = **~$2.80**

**Résultats :** 3000-8000+ entreprises après dédoublonnage

---

## 📝 **Logs attendus maintenant**

```
🔍 Recherche: construction | Source: places | Villes: Tunis
  → Google Places: "bureau de construction" à Tunis
  → Google Places: "bureau d'études" à Tunis
  → Google Places: "bureau d'études bâtiment" à Tunis
  → Google Places: "bureau d'études génie civil" à Tunis
  → Google Places: "entreprise de construction" à Tunis
  ... (27 autres requêtes)
✅ 856 candidats collectés
✅ 612 après dédoublonnage
✅ 612 entreprises enregistrées
```

**Au lieu de :**

```
  → Google Places: "bureau de construction" à Tunis
  → Google Places: "bureau d'études" à Tunis
✅ 40 candidats collectés
```

---

## 💡 **Contrôle du quota**

Si vous voulez réduire le nombre de requêtes, vous pouvez modifier `src/routes/search.ts` :

```typescript
// Pour limiter à 10 mots-clés au lieu de tous
const maxKeywords = 10; // Au lieu de keywords.length
```

Ou créer une nouvelle route avec limite configurable.

---

## 🎉 **Résumé**

✅ **67 mots-clés au total** (32 construction + 35 fournisseur)  
✅ Toutes les variantes et fautes d'orthographe incluses  
✅ Termes tunisiens spécifiques (canqueri, canquerie, etc.)  
✅ Couvre tous les secteurs du bâtiment  
✅ Maximum de résultats possibles

---

## 🧪 **Testez maintenant**

```bash
# Test rapide : Construction à Tunis avec tous les mots-clés
curl "http://localhost:4000/api/search?category=construction&source=places&city=Tunis&limit=100"
```

Vous devriez voir **32 recherches** Google Places au lieu de 2 ! 🚀
