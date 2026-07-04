# Public site (frontend-public, :3002).
#
# IMPORTANT: build from the REPO ROOT, not from frontend-public/, because this
# app imports frontend/src via the "@admin" alias:
#
#   docker build -f frontend-public/Dockerfile \
#     --build-arg NEXT_PUBLIC_API_URL=http://<SERVER_IP>:3001 -t hcmus-public .
#
# (docker-compose.prod.yml already sets context: . and this dockerfile.)
FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.29.3 --activate

# --- deps: full workspace install so the frontend/src components the public app
#     pulls in (@puckeditor/core, lucide-react, …) resolve against frontend/node_modules.
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
COPY frontend-public/package.json frontend-public/
RUN pnpm install --no-frozen-lockfile

FROM base AS builder
COPY --from=deps /app/ ./
COPY frontend ./frontend
COPY frontend-public ./frontend-public
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
# 4GB box: cap the Node heap so the build doesn't OOM (needs swap too — see deploy.sh).
ENV NODE_OPTIONS=--max-old-space-size=3072
WORKDIR /app/frontend-public
RUN pnpm exec next build

# --- runner: Next standalone output. For a monorepo build the standalone tree is
#     rooted at /app with the server entry under frontend-public/server.js.
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY --from=builder /app/frontend-public/.next/standalone ./
COPY --from=builder /app/frontend-public/.next/static ./frontend-public/.next/static
COPY --from=builder /app/frontend-public/public ./frontend-public/public
EXPOSE 3002
ENV PORT=3002
ENV HOSTNAME=0.0.0.0
# Standalone entry lives at the package's relative path inside the traced output.
CMD ["node", "frontend-public/server.js"]
