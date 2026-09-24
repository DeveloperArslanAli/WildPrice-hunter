FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./

# Install all deps
RUN npm ci

# Copy source
COPY src ./src

# Build
RUN npm run build

# ─── Production stage ─────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files and install production only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy build output
COPY --from=builder /app/dist ./dist

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "dist/main"]
