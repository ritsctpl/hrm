# --- STAGE 1: Build ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN NODE_OPTIONS=--max_old_space_size=8192 npm run build

# --- STAGE 2: Runtime ---
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache bash

# Copy standalone server (includes only traced dependencies)
COPY --from=builder /app/.next/standalone ./

# Copy static assets (not included in standalone trace)
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy entrypoint for runtime config injection
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 8687
ENTRYPOINT ["./entrypoint.sh"]
