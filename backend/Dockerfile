FROM node:24-alpine AS build
WORKDIR /app
RUN apk add --no-cache curl
COPY package.json package-lock.json* ./
RUN npm install --ignore-scripts
COPY prisma ./prisma
# Prisma engine binaries: download with curl (Node's fetch can fail behind
# strict proxies) and generate with explicit local engine paths.
RUN ENGINES_VERSION=$(node -e "console.log(require('./node_modules/@prisma/engines-version/package.json').prisma.enginesVersion)") \
  && mkdir -p .prisma-bin \
  && curl -sL -o .prisma-bin/schema-engine.gz "https://binaries.prisma.sh/all_commits/${ENGINES_VERSION}/debian-openssl-3.0.x/schema-engine.gz" \
  && curl -sL -o .prisma-bin/libquery_engine.so.node.gz "https://binaries.prisma.sh/all_commits/${ENGINES_VERSION}/debian-openssl-3.0.x/libquery_engine.so.node.gz" \
  && gunzip .prisma-bin/schema-engine.gz .prisma-bin/libquery_engine.so.node.gz \
  && chmod +x .prisma-bin/schema-engine \
  && PRISMA_SCHEMA_ENGINE_BINARY=$PWD/.prisma-bin/schema-engine PRISMA_QUERY_ENGINE_LIBRARY=$PWD/.prisma-bin/libquery_engine.so.node npx prisma generate \
  && cp .prisma-bin/libquery_engine.so.node node_modules/.prisma/client/libquery_engine-debian-openssl-3.0.x.so.node
COPY tsconfig.json ./
COPY src ./src
RUN npm run build
RUN npm prune --omit=dev

FROM node:24-alpine
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package.json ./
RUN mkdir -p uploads
ENV NODE_ENV=production
EXPOSE 5000
CMD ["node", "dist/index.js"]
