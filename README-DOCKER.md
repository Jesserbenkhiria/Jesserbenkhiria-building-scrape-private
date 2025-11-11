# Guide Docker - Tunisia Construction Finder

Ce guide explique comment construire et exécuter l'application avec Docker.

## Prérequis

- Docker installé
- Docker Compose installé (optionnel)

## Structure

L'image Docker contient :
- **Application React** : accessible sur le port 5174
- **API Serveur** : accessible sur le port 4000 (géré par PM2)

## Construction de l'image

```bash
docker build -t tunisia-construction-app .
```

## Exécution avec Docker

```bash
docker run -d \
  --name tunisia-construction-app \
  -p 5174:5174 \
  -p 4000:4000 \
  -v $(pwd)/serveur/.env:/app/serveur/.env:ro \
  -v $(pwd)/logs:/app/logs \
  tunisia-construction-app
```

## Exécution avec Docker Compose

```bash
docker-compose up -d
```

## Variables d'environnement

Assurez-vous d'avoir un fichier `.env` dans le dossier `serveur/` avec les variables nécessaires :

```env
NODE_ENV=production
PORT=4000
MONGO_URI=your_mongo_uri
GOOGLE_PLACES_KEY=your_key
BING_KEY=your_key
SERPER_KEY=your_key
JWT_SECRET=your_secret
```

## Accès aux services

- **Application React** : http://51.68.172.145:5174
- **API Serveur** : http://51.68.172.145:4000

## Logs

Les logs sont disponibles dans :
- `/app/logs/server-out.log` - Logs du serveur API
- `/app/logs/server-error.log` - Erreurs du serveur API
- `/app/logs/react-out.log` - Logs de l'application React
- `/app/logs/react-error.log` - Erreurs de l'application React

Pour voir les logs en temps réel :

```bash
docker logs -f tunisia-construction-app
```

## Gestion PM2

Pour accéder à PM2 dans le conteneur :

```bash
docker exec -it tunisia-construction-app pm2 list
docker exec -it tunisia-construction-app pm2 logs
docker exec -it tunisia-construction-app pm2 restart all
```

## Arrêt

```bash
# Avec Docker
docker stop tunisia-construction-app
docker rm tunisia-construction-app

# Avec Docker Compose
docker-compose down
```

