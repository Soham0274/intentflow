# IntentFlow Backend - Production Dockerfile
FROM node:20-alpine AS base

WORKDIR /app

RUN apk add --no-cache tini

FROM base AS dependencies

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM base AS build

COPY package*.json ./
RUN npm ci && npm cache clean --force

COPY . .

RUN npm run lint

FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache tini

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

COPY --from=dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs src ./src
COPY --chown=nodejs:nodejs package*.json ./
COPY --chown=nodejs:nodejs .env.example ./.env.example

RUN mkdir -p logs && chown -R nodejs:nodejs logs

USER nodejs

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "src/server.js"]

LABEL maintainer="IntentFlow Team"
LABEL version="1.0.0"
LABEL description="IntentFlow AI Backend Service"