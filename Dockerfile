# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-slim AS builder

# Install pnpm
RUN npm install -g pnpm@10

WORKDIR /app

# Copy workspace config files first (better layer caching)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY tsconfig.base.json tsconfig.json ./

# Copy lib (shared types/utilities)
COPY lib/ ./lib/

# Copy only the api-server artifact
COPY artifacts/api-server/ ./artifacts/api-server/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Build the api-server
RUN pnpm --filter @workspace/api-server run build

# ── Stage 2: Production image ─────────────────────────────────────────────────
FROM node:20-slim AS runner

RUN npm install -g pnpm@10

WORKDIR /app

# Copy workspace manifests (needed for pnpm to resolve packages)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY lib/ ./lib/
COPY artifacts/api-server/package.json ./artifacts/api-server/package.json

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy the compiled output from builder
COPY --from=builder /app/artifacts/api-server/dist ./artifacts/api-server/dist

# Railway sets PORT automatically — default to 8080 as fallback
ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

CMD ["node", "--enable-source-maps", "artifacts/api-server/dist/index.mjs"]
