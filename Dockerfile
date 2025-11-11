# Stage 1: Build React App
FROM node:20-alpine AS react-builder
WORKDIR /app/react-app
COPY my-react-app/package*.json ./
RUN npm ci
COPY my-react-app/ ./
# Set API URL for production build
ENV VITE_API_URL=http://51.68.172.145:4000
RUN npm run build

# Stage 2: Build Server
FROM node:20-alpine AS server-builder
WORKDIR /app/serveur
COPY serveur/package*.json ./
RUN npm ci
COPY serveur/ ./
RUN npm run build

# Stage 3: Production Image
FROM node:20-alpine
WORKDIR /app

# Install PM2 globally
RUN npm install -g pm2

# Copy built React app
COPY --from=react-builder /app/react-app/dist ./my-react-app/dist
COPY --from=react-builder /app/react-app/package*.json ./my-react-app/
COPY --from=react-builder /app/react-app/node_modules ./my-react-app/node_modules
COPY --from=react-builder /app/react-app/vite.config.js ./my-react-app/

# Copy built server
COPY --from=server-builder /app/serveur/dist ./serveur/dist
COPY --from=server-builder /app/serveur/package*.json ./serveur/
COPY --from=server-builder /app/serveur/node_modules ./serveur/node_modules
COPY --from=server-builder /app/serveur/ecosystem.config.js ./serveur/

# Create logs directory
RUN mkdir -p /app/logs

# Copy startup script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Expose ports
EXPOSE 5174 4000

# Start both services
CMD ["/app/start.sh"]

