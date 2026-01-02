# Multi-stage Dockerfile for Bun API (builder + runtime)
FROM oven/bun:1.1 AS builder
WORKDIR /workspace

# Copy root lockfile and package.json if needed for workspace resolution
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/tsconfig.json ./apps/api/
COPY apps/infra/package.json ./apps/infra/
COPY libs/shared-schemas ./libs/shared-schemas

# Install dependencies for the whole workspace (or just api)
# Bun can install pnpm lockfiles
RUN bun install

# Ensure dependencies for the api are installed specifically if monorepo install skipped them
WORKDIR /workspace/apps/api
RUN bun install
WORKDIR /workspace

COPY apps/api/src ./apps/api/src

FROM oven/bun:1.1-slim
WORKDIR /app

# Copy from builder
COPY --from=builder /workspace/node_modules ./node_modules
COPY --from=builder /workspace/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /workspace/apps/api/package.json ./apps/api/package.json
COPY --from=builder /workspace/apps/api/src ./apps/api/src
COPY --from=builder /workspace/apps/api/tsconfig.json ./apps/api/
COPY --from=builder /workspace/libs/shared-schemas ./libs/shared-schemas
COPY --from=builder /workspace/tsconfig.base.json ./
COPY --from=builder /workspace/package.json ./package.json

ENV PORT=8080
EXPOSE 8080

CMD ["bun", "run", "apps/api/src/main.ts"]
