# base stage to have pnpm installed
FROM node:22-bullseye-slim AS base

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    procps \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# App config
# ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Install deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source   
COPY . .

# Build NestJS
RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start:prod"]
