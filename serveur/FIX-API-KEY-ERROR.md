# 🔧 FIX : Erreur "GOOGLE_PLACES_KEY manquante"

## 🎯 Solution rapide (30 secondes)

### Option 1 : Script automatique

```bash
node create-env.js
```

Puis **redémarrez le serveur** (Ctrl+C puis `npm run dev`)

---

### Option 2 : Création manuelle

Créez un fichier nommé **`.env`** à la racine du projet avec ce contenu :

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

**Emplacement exact :**

```
C:\Users\mega-Pc\Desktop\Bulding Scraper\.env
```

---

## ⚠️ IMPORTANT : Redémarrer le serveur !

Le fichier `.env` est lu **uniquement au démarrage** du serveur.

1. **Arrêter** le serveur actuel (Ctrl+C dans le terminal)
2. **Redémarrer** : `npm run dev`

---

## ✅ Vérification

Après redémarrage, vous devriez voir :

```
✅ Toutes les clés API sont configurées
✅ Base de données initialisée: C:\Users\mega-Pc\Desktop\Bulding Scraper\data.db
🚀 Serveur démarré sur http://localhost:4000
```

---

## 🧪 Test après le fix

```bash
curl "http://localhost:4000/api/search?category=construction&source=places&city=Tunis&limit=10"
```

Vous devriez maintenant voir :

```
🔍 Recherche: construction | Source: places | Villes: Tunis
  → Google Places: "bureau de construction" à Tunis
  → Google Places: "bureau d'études" à Tunis
✅ XX candidats collectés
```

---

## 🐛 Si ça ne fonctionne toujours pas

### Vérification 1 : Le fichier .env existe-t-il ?

```bash
# Windows PowerShell
Test-Path .env

# Ou
dir .env
```

**Résultat attendu :** `True` ou le fichier doit être listé

---

### Vérification 2 : Contenu du fichier

```bash
# Windows PowerShell
Get-Content .env

# Ou
type .env
```

**Résultat attendu :**

```
NODE_ENV=development
PORT=4000
BING_KEY=
GOOGLE_PLACES_KEY=AIzaSyASjFVs_c9uzShr6dBG1M1ry2Fe65ClwHk
...
```

---

### Vérification 3 : Logs au démarrage du serveur

Au démarrage, vous devez voir :

```
✅ Toutes les clés API sont configurées
```

Si vous voyez :

```
⚠️  Clés API manquantes: GOOGLE_PLACES_KEY
```

➡️ Le fichier `.env` n'est pas lu correctement.

**Solution :**

1. Vérifiez qu'il s'appelle bien `.env` (pas `env.txt` ou `.env.txt`)
2. Qu'il est à la racine du projet (pas dans un sous-dossier)
3. Redémarrez complètement le terminal

---

## 📁 Structure attendue

```
Bulding Scraper/
├── .env                    ← ICI (à la racine)
├── package.json
├── tsconfig.json
├── src/
├── node_modules/
└── ...
```

---

## ❓ Pourquoi cette erreur ?

Le code utilise `env.GOOGLE_PLACES_KEY` qui vient du fichier `src/config/env.ts`.  
Ce fichier charge les variables d'environnement depuis `.env` via le package `dotenv`.

**Sans fichier `.env` :** `env.GOOGLE_PLACES_KEY` est `undefined` ❌

**Avec fichier `.env` :** `env.GOOGLE_PLACES_KEY` contient votre clé ✅

---

## 🔒 Sécurité

✅ Le fichier `.env` est dans `.gitignore` (ne sera pas commité sur Git)  
⚠️ **Ne partagez JAMAIS votre fichier `.env` ou vos clés API**

---

## 🚀 Une fois corrigé

Utilisez Postman avec les requêtes que j'ai créées :

1. Importez `Tunisia-Construction-Finder.postman_collection.json`
2. Lancez "Run Seed - Tunis Only"
3. Attendez 1-2 minutes
4. Lancez "List All Companies"

Vous devriez avoir des résultats ! 🎉
