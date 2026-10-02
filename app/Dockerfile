# ─── Stage 1: build ─────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

# Install deps first — cached separately from source so deps don't
# reinstall on every code change.
COPY package.json package-lock.json ./
RUN npm ci --include=dev

# Build the SPA
COPY tsconfig.json vite.config.ts index.html ./
COPY src ./src
# File statis apa adanya (mis. qris-toko.png)
COPY public ./public
RUN npm run build

# ─── Stage 2: serve ─────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# SPA fallback + gzip + long cache for hashed assets
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Built static files
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# Drop privileges — nginx:alpine already runs worker processes as `nginx`
# user, master starts as root just to bind :80 (which is fine in a container).

# 127.0.0.1, bukan localhost: di alpine localhost bisa ke ::1 (IPv6), nginx hanya listen IPv4.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
