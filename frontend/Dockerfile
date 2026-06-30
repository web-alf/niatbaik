# ---- Build stage: Vite build (TS check + bundle + Tailwind) ----
FROM oven/bun:1-alpine AS build

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY tsconfig.json vite.config.ts postcss.config.js tailwind.config.js index.html ./
COPY src/ src/
COPY public/ public/
RUN bun run build

# ---- Runtime stage: thin Bun server serving dist/ ----
FROM oven/bun:1-alpine

WORKDIR /app

COPY server.js ./
COPY --from=build /app/dist/ dist/

ENV PORT=3000
EXPOSE 3000

USER bun
CMD ["bun", "run", "server.js"]
