# --- deps: install all deps once, cached across dev/build ---
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- dev: hot-reload target used by docker-compose.yml (the "container" profile) ---
FROM node:22-alpine AS dev
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Prisma 7's generated client (backend/generated/prisma) is gitignored and
# custom-output -- must be generated fresh, it's never in the build context.
RUN npx prisma generate
EXPOSE 4000
CMD ["npm", "run", "start:dev"]

# --- build: compile TypeScript for production ---
FROM deps AS build
WORKDIR /app
COPY . .
RUN npx prisma generate
RUN npm run build

# --- prod: minimal runtime image used by docker-compose.prod.yml ---
FROM node:22-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
# Single copy -- dist/ already contains dist/generated/prisma alongside
# dist/src (tsc has no explicit rootDir, so it infers one from every compiled
# input, including the out-of-src-tree generated client and prisma/seed.ts).
COPY --from=build /app/dist ./dist
# Needed for `npx prisma migrate deploy` to run against this image at deploy
# time -- the Prisma CLI resolves prisma.config.ts/prisma/schema.prisma from
# the project root, not from dist/.
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts
EXPOSE 4000
CMD ["node", "dist/src/main"]
