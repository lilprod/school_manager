FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm exec prisma generate
RUN pnpm exec nest build

FROM base AS runtime
ENV NODE_ENV=production
# Reuse the build stage's node_modules as-is (already has a working,
# generated Prisma client) rather than reinstalling: pnpm's symlinked
# store layout makes copying just the generated Prisma output across
# stages fragile, and a fresh --prod install would skip the Prisma CLI
# (a devDependency) that `prisma migrate deploy` below needs.
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

EXPOSE 3000
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node dist/main.js"]
