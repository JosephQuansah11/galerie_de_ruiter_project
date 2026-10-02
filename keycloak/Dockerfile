FROM quay.io/keycloak/keycloak:26.2

ENV KC_HEALTH_ENABLED=true
ENV KC_METRICS_ENABLED=true
ENV KC_DB=postgres
RUN /opt/keycloak/bin/kc.sh build
COPY realms/galerie-production-realm.json /opt/keycloak/data/import/galerie-production-realm.json

ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
CMD ["start", "--optimized", "--import-realm"]
