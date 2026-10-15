FROM quay.io/keycloak/keycloak:26.2

# Keycloak serves HTTP on 8080, which is what `docker-compose.production.yml` maps to the host and
# what the Render service is routed to. This line said 8180, which nothing ever listened on.
EXPOSE 8080
ENV KC_HEALTH_ENABLED=true
ENV KC_METRICS_ENABLED=true
ENV KC_DB=postgres
RUN /opt/keycloak/bin/kc.sh build
COPY realms/galerie-production-realm.json /opt/keycloak/data/import/movie_project_keycloak-realm.json

ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
CMD ["start", "--optimized", "--import-realm"]
