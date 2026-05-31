# --- Stage 1: Build static assets ---
FROM node:20-alpine AS build

WORKDIR /app

# Copy dependency configs
COPY package.json ./

# Install packages
RUN npm install

# Copy application files
COPY . .

# Build argument to inject backend API URL at compile-time
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build assets
RUN npm run build

# --- Stage 2: Production Nginx Server ---
FROM nginx:alpine

# Copy compiled static assets from build stage to Nginx directory
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration to support SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
