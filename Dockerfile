# Stage 1: Build
FROM node:22 AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run-script build

# Stage 2: Runtime
FROM nginx:stable-alpine

COPY --from=build /app/build /usr/share/nginx/html
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 80

# The number of nginx workers can be overwritten
# with the env variable BBB_PLAYBACK_NGINX_WORKERS
ENTRYPOINT ["docker-entrypoint.sh", "nginx", "-g", "daemon off;"]
