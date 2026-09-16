package be.galerie_de_ruiter.project.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import be.galerie_de_ruiter.project.domain.User;
import be.galerie_de_ruiter.project.domain.UserRole;
import be.galerie_de_ruiter.project.repository.UserRepository;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.keycloak.admin.client.Keycloak;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.jwt.Jwt;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {
	@Mock
	private UserRepository users;
	@Mock
	private Keycloak keycloakAdminClient;

	@Test
	void createsAProfileFromTheAuthenticatedKeycloakSubject() {
		UserService service = new UserService(users, keycloakAdminClient, "test-realm");
		Jwt jwt = Jwt.withTokenValue("token").header("alg", "none").subject("subject-1")
				.claim("email", "person@example.com").claim("preferred_username", "person")  .claim("realm_access", Map.of(
                    "roles", List.of("USER")
            )).build();
		when(users.findByKeycloakSubject("subject-1")).thenReturn(Optional.empty());
		when(users.save(org.mockito.ArgumentMatchers.any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

		User result = service.findOrCreate(jwt.getSubject(), jwt.getClaimAsString("preferred_username"), jwt.getClaimAsString("email"));

		assertThat(result.getKeycloakSubject()).isEqualTo("subject-1");
		assertThat(result.getEmail()).isEqualTo("person@example.com");
		assertThat(result.getRoles().stream().map(UserRole::name).toList()).containsExactly("USER");
	}
}