FROM oven/bun:1-alpine

WORKDIR /app

COPY package.json .
COPY server.js .
COPY index.html .
COPY src/ src/
COPY assets/ assets/

ENV PORT=3000
EXPOSE 3000

USER bun
CMD ["bun", "run", "server.js"]
