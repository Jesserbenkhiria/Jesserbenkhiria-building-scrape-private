# Exemples de requêtes - Tunisia Construction Finder

Ce fichier contient des exemples de commandes curl pour tester l'API.

## 1. Health Check

Vérifier que le serveur fonctionne :

```bash
curl http://localhost:4000/health
```

## 2. Recherche de bureaux de construction

### À Tunis (Google Places uniquement)

```bash
curl "http://localhost:4000/api/search?category=construction&source=places&city=Tunis&limit=20"
```

### À Sfax (toutes sources)

```bash
curl "http://localhost:4000/api/search?category=construction&source=all&city=Sfax&limit=30"
```

### À Sousse (Bing uniquement)

```bash
curl "http://localhost:4000/api/search?category=construction&source=bing&city=Sousse&limit=15"
```

## 3. Recherche de fournisseurs/quincailleries

### Quincailleries à Tunis

```bash
curl "http://localhost:4000/api/search?category=fournisseur&source=places&city=Tunis&limit=25"
```

### Fournisseurs de matériaux à Bizerte

```bash
curl "http://localhost:4000/api/search?category=fournisseur&source=all&city=Bizerte&limit=20"
```

### Canqueri/quincailleries à Gabès

```bash
curl "http://localhost:4000/api/search?category=fournisseur&city=Gabes&limit=15"
```

## 4. Collecte complète (seed)

### Petite collecte (3 villes)

```bash
curl -X POST http://localhost:4000/api/run-seed \
  -H "Content-Type: application/json" \
  -d "{\"categories\":[\"construction\",\"fournisseur\"],\"cities\":[\"Tunis\",\"Sfax\",\"Sousse\"],\"sources\":[\"all\"],\"limitPerQuery\":20}"
```

### Collecte étendue (6 villes)

```bash
curl -X POST http://localhost:4000/api/run-seed \
  -H "Content-Type: application/json" \
  -d "{\"categories\":[\"construction\",\"fournisseur\"],\"cities\":[\"Tunis\",\"Sfax\",\"Sousse\",\"Bizerte\",\"Nabeul\",\"Monastir\"],\"sources\":[\"all\"],\"limitPerQuery\":25}"
```

### Collecte uniquement Google Places

```bash
curl -X POST http://localhost:4000/api/run-seed \
  -H "Content-Type: application/json" \
  -d "{\"categories\":[\"construction\"],\"cities\":[\"Tunis\",\"Ariana\"],\"sources\":[\"places\"],\"limitPerQuery\":30}"
```

## 5. Lister les entreprises enregistrées

### Toutes les entreprises

```bash
curl "http://localhost:4000/api/companies?limit=100"
```

### Entreprises de construction uniquement

```bash
curl "http://localhost:4000/api/companies?category=construction&limit=50"
```

### Fournisseurs avec numéro de téléphone

```bash
curl "http://localhost:4000/api/companies?category=fournisseur&hasPhone=true&limit=50"
```

### Entreprises à Tunis

```bash
curl "http://localhost:4000/api/companies?city=Tunis&limit=100"
```

### Recherche textuelle "matériaux"

```bash
curl "http://localhost:4000/api/companies?q=matériaux&limit=50"
```

### Recherche avec pagination

```bash
# Page 1 (0-50)
curl "http://localhost:4000/api/companies?limit=50&offset=0"

# Page 2 (50-100)
curl "http://localhost:4000/api/companies?limit=50&offset=50"

# Page 3 (100-150)
curl "http://localhost:4000/api/companies?limit=50&offset=100"
```

## 6. Exemples avec PowerShell (Windows)

Si vous utilisez PowerShell au lieu de bash :

### Health check

```powershell
Invoke-RestMethod -Uri "http://localhost:4000/health"
```

### Recherche

```powershell
Invoke-RestMethod -Uri "http://localhost:4000/api/search?category=construction&city=Tunis&limit=20"
```

### Collecte (POST)

```powershell
$body = @{
    categories = @("construction", "fournisseur")
    cities = @("Tunis", "Sfax")
    sources = @("all")
    limitPerQuery = 20
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:4000/api/run-seed" -Method Post -Body $body -ContentType "application/json"
```

## 7. Tests de stress (attention aux quotas !)

### Collecte nationale complète (⚠️ consomme beaucoup de quota)

```bash
curl -X POST http://localhost:4000/api/run-seed \
  -H "Content-Type: application/json" \
  -d "{\"categories\":[\"construction\",\"fournisseur\"],\"cities\":[\"Tunis\",\"Ariana\",\"Ben Arous\",\"Manouba\",\"Nabeul\",\"Bizerte\",\"Sousse\",\"Monastir\",\"Mahdia\",\"Sfax\"],\"sources\":[\"all\"],\"limitPerQuery\":30}"
```

**Attention** : Cette requête peut consommer 300-500 appels API !

## 8. Export des résultats

### Sauvegarder dans un fichier JSON

```bash
curl "http://localhost:4000/api/companies?limit=1000" > entreprises.json
```

### Filtrer et sauvegarder

```bash
curl "http://localhost:4000/api/companies?category=construction&hasPhone=true&limit=500" > construction_avec_tel.json
```

## 9. Requêtes avec authentification (si ajoutée)

Si vous ajoutez une authentification Bearer token :

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:4000/api/search?category=construction&city=Tunis"
```

## 10. Debugging

### Voir les headers de réponse

```bash
curl -i http://localhost:4000/health
```

### Mode verbose

```bash
curl -v "http://localhost:4000/api/search?category=construction&city=Tunis&limit=5"
```

---

**Astuce** : Pour formater joliment le JSON, utilisez `jq` :

```bash
curl "http://localhost:4000/api/companies?limit=10" | jq .
```

Ou sur Windows PowerShell :

```powershell
(Invoke-RestMethod -Uri "http://localhost:4000/api/companies?limit=10") | ConvertTo-Json -Depth 10
```

