package be.galerie_de_ruiter.project.config;

import java.util.Collection;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Stream;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;

public final class KeycloakJwtAuthenticationConverter extends JwtAuthenticationConverter {

    private static final String REALM_ACCESS = "realm_access";
    private static final String RESOURCE_ACCESS = "resource_access";
    private static final String ROLES_ACCESS = "roles_access";
    private static final String RESOURCES_ACCESS = "resources_access";

    public KeycloakJwtAuthenticationConverter() {
        setPrincipalClaimName("preferred_username");
        setJwtGrantedAuthoritiesConverter(new KeycloakAuthoritiesConverter());
    }

    private static final class KeycloakAuthoritiesConverter implements Converter<Jwt, Collection<GrantedAuthority>> {

        private final JwtGrantedAuthoritiesConverter scopeAuthorities = new JwtGrantedAuthoritiesConverter();

        @Override
        public Collection<GrantedAuthority> convert(Jwt jwt) {
            Stream<GrantedAuthority> scopeAuthorities = this.scopeAuthorities.convert(jwt).stream();
            Stream<GrantedAuthority> keycloakAuthorities = Stream.of(
                    rolesFromClaim(jwt.getClaim(REALM_ACCESS)),
                    rolesFromClaim(jwt.getClaim(ROLES_ACCESS)),
                    rolesFromResourceClaim(jwt.getClaim(RESOURCE_ACCESS)),
                    rolesFromResourceClaim(jwt.getClaim(RESOURCES_ACCESS)))
                    .flatMap(stream -> stream);

            return Stream.concat(scopeAuthorities, keycloakAuthorities)
                    .distinct()
                    .toList();
        }

        private static Stream<GrantedAuthority> rolesFromResourceClaim(Object claim) {
            if (!(claim instanceof Map<?, ?> resources)) {
                return Stream.empty();
            }

            return resources.values().stream()
                    .filter(Map.class::isInstance)
                    .map(Map.class::cast)
                    .flatMap(KeycloakAuthoritiesConverter::rolesFromAccess);
        }

        private static Stream<GrantedAuthority> rolesFromClaim(Object claim) {
            if (claim instanceof Map<?, ?> access) {
                return rolesFromAccess(access);
            }
            if (claim instanceof Collection<?> roles) {
                return authoritiesFromRoles(roles);
            }
            return Stream.empty();
        }

        private static Stream<GrantedAuthority> rolesFromAccess(Map<?, ?> access) {
            Object roles = access.get("roles");
            return roles instanceof Collection<?> roleCollection
                    ? authoritiesFromRoles(roleCollection)
                    : Stream.empty();
        }

        private static Stream<GrantedAuthority> authoritiesFromRoles(Collection<?> roles) {
            return roles.stream()
                    .filter(String.class::isInstance)
                    .map(String.class::cast)
                    .map(role -> new SimpleGrantedAuthority("ROLE_" + role.toUpperCase(Locale.ROOT)));
        }
    }
}
