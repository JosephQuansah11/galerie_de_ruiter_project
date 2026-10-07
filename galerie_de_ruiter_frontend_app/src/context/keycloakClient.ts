import Keycloak from "keycloak-js";

export const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL ?? "http://localhost:8082",
  realm: import.meta.env.VITE_KEYCLOAK_REALM ?? "movie_project_keycloak",
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? "movie_project_frontend_client",
});
