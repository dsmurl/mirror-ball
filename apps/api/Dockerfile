# Multi-stage Dockerfile for Deno API (builder + slim runtime)

FROM denoland/deno:1.46.3 as builder
WORKDIR /workspace

# Copy project files needed for dependency caching
COPY apps/api/deno.json ./apps/api/deno.json
COPY libs/shared-schemas ./libs/shared-schemas
COPY apps/api/src ./apps/api/src

# Cache dependencies (no lockfile yet; safe to skip if none)
RUN deno cache ./apps/api/src/main.ts || true

FROM denoland/deno:distroless-1.46.3
WORKDIR /app

# Copy the cached deps and source
COPY --from=builder /deno-dir /deno-dir
COPY apps/api/deno.json ./deno.json
COPY libs/shared-schemas ./libs/shared-schemas
COPY apps/api/src ./apps/api/src

ENV DENO_DIR=/deno-dir \
    PORT=8080

EXPOSE 8080

# The distroless image sets ENTRYPOINT ["deno"], so we only provide CMD
CMD ["run", "--allow-env", "--allow-net", "--allow-read", "apps/api/src/main.ts"]
