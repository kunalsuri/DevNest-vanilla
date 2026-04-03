# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer cache)
COPY package*.json ./
RUN npm ci

# Copy source and build client (Vite)
COPY . .
RUN npm run build

# ---- Production Stage ----
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install only production dependencies + tsx (runtime TS executor)
COPY package*.json ./
RUN npm ci --omit=dev && npm install tsx

# Copy built client assets
COPY --from=builder /app/dist ./dist

# Copy server + shared TypeScript source (executed by tsx at runtime)
COPY --from=builder /app/server ./server
COPY --from=builder /app/shared ./shared

# Copy configuration (secrets must be injected via environment variables)
COPY --from=builder /app/data/config.json ./data/config.json

# Create writable runtime directories
RUN mkdir -p data logs uploads/profile-pictures backups && \
    chown -R node:node data logs uploads backups

USER node

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:5000/health || exit 1

CMD ["npx", "tsx", "server/index.ts"]
