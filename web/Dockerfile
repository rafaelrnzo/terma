# Built by .github/workflows/web-image.yml; the VPS only pulls the image by digest.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ARG REVISION=unknown
LABEL org.opencontainers.image.source="https://github.com/rafaelrnzo/terma" org.opencontainers.image.revision="$REVISION"
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 TERMA_DATA_DIR=/data
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=build /app/scripts/set-password.mjs ./scripts/set-password.mjs
RUN mkdir -p /data && chown node:node /data
USER node
EXPOSE 3000
CMD ["node", "server.js"]
