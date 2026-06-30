# Crypto-Knowledge — hosted MCP server (Streamable HTTP)
# Deploy on Railway / Render / Fly.io / any container host.
FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 8787
ENV PORT=8787
CMD ["node", "dist/http.js"]
