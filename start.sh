#!/bin/sh

# Start both services with PM2
echo "🚀 Starting all services with PM2..."
cd /app/serveur
pm2-runtime start ecosystem.config.js

