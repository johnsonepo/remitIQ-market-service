# ==================================
# Stage 1: Dependencies
# ==================================

FROM node:22-alpine AS dependencies

WORKDIR /app

# Force npm/Node to prefer IPv4 when resolving DNS. Some Docker
# network configurations have broken/unroutable IPv6 connectivity,
# causing outbound registry requests (npm ci) to hang or time out —
# the same root cause hit earlier with axios calls to
# ExchangeRate-API, fixed there via docker-compose.yml's
# NODE_OPTIONS. That fix only applies to the running container, not
# to build-time network calls, so it's set explicitly in every stage
# here that reaches the network.
ENV NODE_OPTIONS=--dns-result-order=ipv4first

COPY package*.json ./

RUN npm ci


# ==================================
# Stage 2: Development
# ==================================

FROM node:22-alpine AS development

WORKDIR /app

ENV NODE_ENV=development
ENV NODE_OPTIONS=--dns-result-order=ipv4first

COPY --from=dependencies /app/node_modules ./node_modules

COPY package*.json ./

COPY . .

RUN npx prisma generate

EXPOSE 4001

CMD ["npm", "run", "dev"]


# ==================================
# Stage 3: Build
# ==================================

FROM node:22-alpine AS builder

WORKDIR /app

ENV NODE_OPTIONS=--dns-result-order=ipv4first

COPY --from=dependencies /app/node_modules ./node_modules

COPY . .

RUN npx prisma generate

RUN npm run build


# ==================================
# Stage 4: Production Runtime
# ==================================

FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV NODE_OPTIONS=--dns-result-order=ipv4first

# WORKDIR is created by root before USER takes effect, so ownership
# must be handed to the node user before switching — this chown is
# cheap since /app is still empty at this point (unlike a recursive
# chown over a populated node_modules tree, which is slow).
RUN chown node:node /app

# node:22-alpine ships with a built-in non-root 'node' user (uid 1000)
# — no need to create a custom one. Switching to it before npm ci
# means installed files are owned correctly from creation, avoiding a
# slow recursive chown -R over the full node_modules tree afterward.
USER node

COPY --chown=node:node package*.json ./

RUN npm ci --omit=dev

COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/generated ./generated
COPY --chown=node:node --from=builder /app/prisma ./prisma

EXPOSE 4001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4001/health || exit 1

CMD ["node", "dist/src/server.js"]