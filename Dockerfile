# base stage to have pnpm installed
FROM node:22-bullseye-slim AS base
#FROM --platform=linux/amd64 node:22-bullseye-slim AS base
# Install a few system dependencies and Chromium for Puppeteer
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    curl \
    ca-certificates \
    procps \
    chromium \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    libxss1 \
    && rm -rf /var/lib/apt/lists/*

# Set Puppeteer environment variables
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
RUN npm -g i pnpm

# development stage
FROM base AS development 
ENV NODE_ENV=${NODE_ENV}


WORKDIR /app 
COPY package.json pnpm-lock.yaml ./ 

RUN --mount=type=cache,id=pnmcache,target=/pnpm \
  pnpm i --prefer-offline --frozen-lockfile
COPY . /app
CMD ["pnpm", "run", "start:dev", "${APP}"]