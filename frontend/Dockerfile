# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.29.3 --activate

FROM base AS builder
# Cài deps NGAY trong builder, KHÔNG copy node_modules từ stage khác: COPY
# node_modules giữa các stage phải nhân bản hàng vạn file nhỏ trên overlay/loopback
# → tốn 400–900s. Lớp `pnpm install` này vẫn được Docker cache khi package.json
# không đổi, còn store mount giúp lần cài lại (đổi deps / sau khi prune) không phải
# tải lại từ mạng.
COPY package.json ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --prod=false --no-frozen-lockfile
COPY . .
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
# Origin the image optimizer fetches media from at runtime (baked, never used by
# browsers). On the sandbox set http://backend:3001 — no hairpin to the public IP.
ARG NEXT_PUBLIC_IMAGE_FETCH_ORIGIN=http://backend:3001
ENV NEXT_PUBLIC_IMAGE_FETCH_ORIGIN=$NEXT_PUBLIC_IMAGE_FETCH_ORIGIN
# Public-site origin for the builder's "View live" button.
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3002
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_TELEMETRY_DISABLED=1
# Cache mount .next/cache: giữ artifact Turbopack qua các lần build → build lặp nhanh.
RUN --mount=type=cache,target=/app/.next/cache pnpm exec next build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
