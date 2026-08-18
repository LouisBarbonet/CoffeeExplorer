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
EXPOSE 3000
CMD ["npm", "run", "dev"]

# --- build: production Next.js build (standalone output) ---
FROM deps AS build
WORKDIR /app
COPY . .
RUN npm run build

# --- prod: minimal runtime image used by docker-compose.prod.yml ---
FROM node:22-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
