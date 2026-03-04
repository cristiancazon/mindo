# Build Stage
FROM node:18-alpine as builder
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# NOTE: Vite requires environment variables at BUILD time. 
# When building this container in Cloud Build, ensure you pass --build-arg VITE_WS_URL=... and --build-arg VITE_API_URL=...
# Or have them in your .env.production file.
# For Cloud Run, you can also inject them by modifying the build pipeline.
# Reemplaza las líneas de ARG por estas de ENV con tus URLs reales
ENV VITE_WS_URL=wss://mindo-live-proxy-612302142321.us-central1.run.app
ENV VITE_API_URL=https://mindo-live-proxy-612302142321.us-central1.run.app

RUN npm run build

# Production Stage (Nginx)
FROM nginx:alpine
# Copy the built assets to Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration for React Router (SPA)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Cloud Run defaults port 8080, Nginx defaults 80
# We'll expose 8080 and configure nginx to listen on it in nginx.conf
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
