# ---- Build stage: transpile JSX bundle + compile Tailwind CSS ----
FROM oven/bun:1-alpine AS build

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY build.mjs tailwind.config.js ./
COPY styles/ styles/
COPY src/ src/
COPY index.html ./
RUN bun run build

# ---- Runtime stage: only what the server needs to serve ----
FROM oven/bun:1-alpine

WORKDIR /app

COPY server.js index.html ./
COPY assets/ assets/
COPY --from=build /app/public/ public/

ENV PORT=3000
EXPOSE 3000

USER bun
CMD ["bun", "run", "server.js"]
