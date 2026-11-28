# Build the Nest API with the backend folder as the Docker context.
# Render: Root Directory = backend, Dockerfile Path = ./Dockerfile, Context = .
# Locally, from the repository root: docker build -f backend/Dockerfile -t agentmart-nest-api backend
FROM node:24-bookworm-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
COPY scripts/prisma-cli.mjs ./scripts/prisma-cli.mjs
RUN npm ci
COPY src ./src
COPY tsconfig.json ./tsconfig.json
COPY tsconfig.build.json ./tsconfig.build.json
RUN npm run build && npm prune --omit=dev --ignore-scripts

FROM node:24-bookworm-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
USER node
EXPOSE 4000
CMD ["node", "dist/main.js"]
