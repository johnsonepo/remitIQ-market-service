# ==================================
# Stage 1: Dependencies
# ==================================

FROM node:22-alpine AS dependencies

WORKDIR /app

COPY package*.json ./

RUN npm ci


# ==================================
# Stage 2: Development
# ==================================

FROM node:22-alpine AS development

WORKDIR /app

ENV NODE_ENV=development

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

COPY --from=dependencies /app/node_modules ./node_modules

COPY . .

RUN npm run build


# ==================================
# Stage 4: Production Runtime
# ==================================

FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

COPY --from=builder /app/prisma ./prisma

RUN npx prisma generate

EXPOSE 4001

CMD ["node", "dist/src/server.js"]