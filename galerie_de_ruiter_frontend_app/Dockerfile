FROM node:22-alpine AS build
WORKDIR /app
ARG VITE_JAVA_API_URL=http://localhost:8080
ARG VITE_JAVA_BACKEND_URL=http://localhost:8080
ARG VITE_API_URL=http://localhost:8080
ARG VITE_KEYCLOAK_URL=http://localhost:8081
ARG VITE_KEYCLOAK_REALM=movie_project_keycloak
ARG VITE_KEYCLOAK_CLIENT_ID=movie_project_frontend_client
ARG VITE_RECONSTRUCTION_API_URL=http://localhost:8000
ARG VITE_PYTHON_API_URL=http://localhost:8000
# The Google Maps browser key for the location page's frame and the admin's address lookup (see
# "Google Maps" in README.md). It is optional: an image built without it shows the address and a
# Maps link instead of a frame.
ARG VITE_GOOGLE_MAPS_API_KEY=
# The site's public origin: it becomes the URLs in sitemap.xml, robots.txt and the social
# preview tags. Leave it unset and the build uses the production origin from
# `site.config.mjs`; pass the real origin when building for another host, e.g.
# --build-arg SITE_URL=https://www.example.be
ARG SITE_URL
ENV VITE_JAVA_API_URL=$VITE_JAVA_API_URL \
    VITE_JAVA_BACKEND_URL=$VITE_JAVA_BACKEND_URL \
    VITE_API_URL=$VITE_API_URL \
    VITE_KEYCLOAK_URL=$VITE_KEYCLOAK_URL \
    VITE_KEYCLOAK_REALM=$VITE_KEYCLOAK_REALM \
    VITE_KEYCLOAK_CLIENT_ID=$VITE_KEYCLOAK_CLIENT_ID \
    VITE_RECONSTRUCTION_API_URL=$VITE_RECONSTRUCTION_API_URL \
    VITE_PYTHON_API_URL=$VITE_PYTHON_API_URL \
    VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY \
    SITE_URL=$SITE_URL
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
# The browser-facing origins the Content-Security-Policy allows. They default to the API and
# Keycloak this image was built against, so the policy and the bundle always agree; a deployment
# can override them with runtime environment variables.
ARG VITE_JAVA_API_URL=http://localhost:8080
ARG VITE_KEYCLOAK_URL=http://localhost:8081
ENV CSP_API_ORIGIN=$VITE_JAVA_API_URL \
    CSP_KEYCLOAK_ORIGIN=$VITE_KEYCLOAK_URL
# The server config is a template: the nginx image substitutes the environment variables above
# into it at start-up.
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
