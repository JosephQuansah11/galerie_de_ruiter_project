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
ENV VITE_JAVA_API_URL=$VITE_JAVA_API_URL \
    VITE_JAVA_BACKEND_URL=$VITE_JAVA_BACKEND_URL \
    VITE_API_URL=$VITE_API_URL \
    VITE_KEYCLOAK_URL=$VITE_KEYCLOAK_URL \
    VITE_KEYCLOAK_REALM=$VITE_KEYCLOAK_REALM \
    VITE_KEYCLOAK_CLIENT_ID=$VITE_KEYCLOAK_CLIENT_ID \
    VITE_RECONSTRUCTION_API_URL=$VITE_RECONSTRUCTION_API_URL \
    VITE_PYTHON_API_URL=$VITE_PYTHON_API_URL
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
