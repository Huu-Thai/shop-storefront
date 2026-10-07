# Shop Storefront — production image (Next.js standalone output, non-root; ~280 MB, mostly Node.js).
# Build:  docker build -t shop-storefront --build-arg MEDIA_ORIGINS=https://cdn.example.com .
# Run:    docker run -p 3002:3002 -e SHOP_API_URL=https://api.example.com -e SESSION_SECRET=… \
#           -e DEFAULT_STORE=us-en -e SITE_URL=https://shop.example.com shop-storefront
# The build needs no shop API: pages are rendered from the shop on first request.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# Image origins that aren't https end up in the Content Security Policy at build time.
ARG MEDIA_ORIGINS=""
ENV MEDIA_ORIGINS=$MEDIA_ORIGINS
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3002 HOSTNAME=0.0.0.0
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /app/.next/standalone ./
USER app
EXPOSE 3002
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD wget -qO- http://127.0.0.1:3002/api/health >/dev/null || exit 1
CMD ["node", "server.js"]
