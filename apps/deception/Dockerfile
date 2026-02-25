# ─── Production (multi-stage) ───────────────────────────────────────────────
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@10 --activate
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/deception/package.json apps/deception/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile
COPY packages/shared/ packages/shared/
RUN pnpm --filter @ghostnet/shared run build
COPY apps/deception/ apps/deception/
RUN pnpm --filter @ghostnet/deception run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/deception/node_modules ./apps/deception/node_modules
COPY --from=builder /app/apps/deception/dist ./apps/deception/dist
WORKDIR /app/apps/deception
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://localhost:4000/health || exit 1
CMD ["node", "dist/server.js"]
