# Stage 1: Build
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/skills/package.json packages/skills/
COPY packages/adapters/package.json packages/adapters/
COPY apps/backend/package.json apps/backend/

RUN pnpm install --frozen-lockfile

COPY packages/ packages/
COPY apps/backend/ apps/backend/

RUN pnpm --filter @noteseed/shared-types build \
 && pnpm --filter @noteseed/skills build \
 && pnpm --filter @noteseed/adapters build \
 && pnpm --filter @noteseed/backend build

# Stage 2: Production
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

COPY --from=builder /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/package.json /app/tsconfig.base.json ./
COPY --from=builder /app/packages/shared-types/package.json packages/shared-types/
COPY --from=builder /app/packages/shared-types/dist packages/shared-types/dist/
COPY --from=builder /app/packages/skills/package.json packages/skills/
COPY --from=builder /app/packages/skills/dist packages/skills/dist/
COPY --from=builder /app/packages/adapters/package.json packages/adapters/
COPY --from=builder /app/packages/adapters/dist packages/adapters/dist/
COPY --from=builder /app/apps/backend/package.json apps/backend/
COPY --from=builder /app/apps/backend/dist apps/backend/dist/
COPY --from=builder /app/apps/backend/prisma apps/backend/prisma/

RUN pnpm install --frozen-lockfile --prod

RUN cd apps/backend && npx prisma@5.20.0 generate

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "apps/backend/dist/index.js"]
