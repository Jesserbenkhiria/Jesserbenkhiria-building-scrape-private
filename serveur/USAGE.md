# Guide d'utilisation rapide

## ❌ Erreur : "Paramètres invalides - category Required"

Cette erreur signifie que vous avez oublié d'ajouter le paramètre `category` dans votre requête.

### ✅ Solution : Ajoutez `category=construction` ou `category=fournisseur`

---

## 🔥 Exemples de requêtes correctes

### 1. Rechercher des **bureaux de construction**

```bash
curl "http://localhost:4000/api/search?category=construction&city=Tunis&limit=20"
```

**Paramètres requis :**

- ✅ `category=construction` (OBLIGATOIRE)
- `city=Tunis` (optionnel)
- `source=all` (par défaut)
- `limit=20` (par défaut: 100)

---

### 2. Rechercher des **fournisseurs/quincailleries**

```bash
curl "http://localhost:4000/api/search?category=fournisseur&city=Sfax&limit=30"
```

**Paramètres requis :**

- ✅ `category=fournisseur` (OBLIGATOIRE)
- `city=Sfax` (optionnel)

---

### 3. Rechercher avec Google Places uniquement

```bash
curl "http://localhost:4000/api/search?category=construction&source=places&city=Sousse"
```

---

### 4. Rechercher avec Bing uniquement

```bash
curl "http://localhost:4000/api/search?category=fournisseur&source=bing&city=Tunis"
```

---

### 5. Rechercher dans TOUTES les villes (pas de filtre)

```bash
curl "http://localhost:4000/api/search?category=construction&limit=50"
```

⚠️ **Attention** : Sans `city`, l'API cherchera dans plusieurs villes (peut consommer beaucoup de quota)

---

## 📊 Collecte massive avec tous les nouveaux mots-clés

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

**Avec vos nouveaux mots-clés :**

- 16 mots-clés construction
- 15 mots-clés fournisseur
- 3 villes
- = **93 requêtes API** (attention aux quotas !)

---

## 🧮 Calcul du nombre de requêtes

```
Nombre de requêtes = (mots-clés construction × villes) + (mots-clés fournisseur × villes)
```

**Exemple avec 3 villes :**

- Construction : 16 × 3 = **48 requêtes**
- Fournisseur : 15 × 3 = **45 requêtes**
- **Total : 93 requêtes**

**Exemple avec 1 ville :**

- Construction : 16 × 1 = **16 requêtes**
- Fournisseur : 15 × 1 = **15 requêtes**
- **Total : 31 requêtes**

---

## 🎯 Recommandations pour économiser le quota

### ✅ Bonne pratique : recherche ciblée

```bash
# Chercher uniquement construction à Tunis
curl "http://localhost:4000/api/search?category=construction&city=Tunis&limit=30"

# Chercher uniquement fournisseurs à Sfax
curl "http://localhost:4000/api/search?category=fournisseur&city=Sfax&limit=30"
```

### ⚠️ Éviter : collecte massive sans limite

```bash
# Ceci va consommer BEAUCOUP de quota !
curl -X POST http://localhost:4000/api/run-seed \
  -H "Content-Type: application/json" \
  -d '{
    "categories": ["construction", "fournisseur"],
    "cities": ["Tunis", "Ariana", "Ben Arous", "Sfax", "Sousse", "Bizerte"],
    "limitPerQuery": 30
  }'
# = 186 requêtes !
```

---

## 📝 Mots-clés disponibles (mis à jour)

### Construction (16 mots-clés)

```
bureau de construction
bureau d'études
bureau d'études bâtiment
bureau d'études génie civil
entreprise de construction
entreprise bâtiment
génie civil
bureau d'architecture
cabinet architecte
construction gros œuvre
chantier bâtiment
ingénierie bâtiment
maître d'œuvre
contractant général
entreprise travaux publics
constructeur bâtiment
```

### Fournisseur (15 mots-clés)

```
fournisseur matériaux
fournisseur matériaux de construction
dépôt matériaux
grossiste matériaux
quincaillerie
canquerie
canqueri
cancrerie
magasin bricolage
fournisseur sanitaire
fournisseur peinture
fournisseur aluminium
quincaillerie bâtiment
dépôt matériaux de construction
vente matériaux de construction
```

---

## 🧪 Test de l'API avec les nouveaux mots-clés

### Test 1 : Vérifier que le serveur fonctionne

```bash
curl http://localhost:4000/health
```

**Réponse attendue :**

```json
{ "ok": true, "timestamp": "2025-11-07T..." }
```

---

### Test 2 : Recherche construction à Tunis (nouveaux mots-clés)

```bash
curl "http://localhost:4000/api/search?category=construction&city=Tunis&source=places&limit=10"
```

**Réponse attendue :**

```json
{
  "count": 10,
  "total": 45,
  "items": [
    {
      "name": "Bureau d'Études ABC",
      "category": "construction",
      "phones": ["+216 71 123 456"],
      ...
    }
  ],
  "meta": {
    "category": "construction",
    "source": "places",
    "city": "Tunis"
  }
}
```

---

### Test 3 : Recherche quincaillerie à Sfax (nouveaux mots-clés)

```bash
curl "http://localhost:4000/api/search?category=fournisseur&city=Sfax&source=all&limit=15"
```

---

## 🚀 Commande PowerShell (Windows)

Si vous êtes sur Windows PowerShell :

```powershell
# Health check
Invoke-RestMethod -Uri "http://localhost:4000/health"

# Recherche construction
Invoke-RestMethod -Uri "http://localhost:4000/api/search?category=construction&city=Tunis&limit=10"

# Recherche fournisseur
Invoke-RestMethod -Uri "http://localhost:4000/api/search?category=fournisseur&city=Sfax&limit=10"

# Collecte massive
$body = @{
    categories = @("construction", "fournisseur")
    cities = @("Tunis", "Sfax")
    sources = @("all")
    limitPerQuery = 15
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:4000/api/run-seed" -Method Post -Body $body -ContentType "application/json"
```

---

## ❓ FAQ

### Q: Combien de temps prend une recherche ?

**R:**

- Recherche simple (1 ville) : ~10-30 secondes
- Collecte massive (3 villes, 2 catégories) : ~2-5 minutes

### Q: Combien de résultats par requête ?

**R:**

- Google Places : ~20-60 résultats
- Bing : ~20 résultats
- Après dédoublonnage : variable

### Q: Comment voir les résultats enregistrés ?

**R:**

```bash
curl "http://localhost:4000/api/companies?limit=100"
```

---

Besoin d'aide ? Consultez **README.md** pour la documentation complète !
