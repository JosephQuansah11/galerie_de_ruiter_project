package be.galerie_de_ruiter.project.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRepository;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableMethodSecurity
public class SecurityConfiguration {

	@Value("${FRONTEND_ORIGIN:http://localhost:5173}")
	private String frontendOrigin;

	/**
	 * When the deployed frontend and API run on different origins the CSRF cookie must
	 * be sent with cross-site requests, otherwise every write (profile details, avatar
	 * uploads) is rejected with 403 in production.
	 */
	@Value("${app.security.cross-site-csrf-cookies:false}")
	private boolean crossSiteCsrfCookies;

	@Bean
	CsrfTokenRepository csrfTokenRepository() {
		CookieCsrfTokenRepository repository = CookieCsrfTokenRepository.withHttpOnlyFalse();
		repository.setCookiePath("/");
		if (crossSiteCsrfCookies) {
			repository.setCookieCustomizer(cookie -> cookie.sameSite("None").secure(true));
		}
		return repository;
	}

	@Bean
	SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		http
			.cors(cors -> cors.configurationSource(corsConfigurationSource()))
			.csrf(csrf -> csrf
				.csrfTokenRepository(csrfTokenRepository())
				// The chat endpoints are public and are called before a session exists, so they
				// cannot carry the cookie-based CSRF token. When only "/api/chat" was exempted,
				// warming the model up answered 401 and the chat page stayed "not ready"
				// forever even though the model was loaded.
				// The public engagement counters are also exempt: they are open to anonymous
				// visitors, so a browser without a CSRF token must still be able to like a
				// piece or register that it was seen.
				.ignoringRequestMatchers("/api/chat", "/api/chat/**", "/api/antiques/*/views", "/api/antiques/*/likes"))
			// .csrf(csrf->csrf.disable())
			// .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
			.authorizeHttpRequests(authorize -> authorize
				.requestMatchers(HttpMethod.GET,"/api/admin/users").hasRole("ADMIN")
				.requestMatchers(HttpMethod.GET, "/api/login").permitAll()
				.requestMatchers(HttpMethod.POST, "/api").authenticated()
				.requestMatchers( "/api").authenticated()
				.requestMatchers(HttpMethod.GET, "/api/antiques").permitAll()
				.requestMatchers(HttpMethod.GET, "/api/antiques/*/image").permitAll()
				.requestMatchers(HttpMethod.GET, "/api/antiques/*/image/*").permitAll()
				.requestMatchers(HttpMethod.GET, "/api/antiques/{id}/image/{imageId}").permitAll()
				.requestMatchers(HttpMethod.GET, "/api/antiques/*/model").permitAll()
				// The public counters are open to anonymous visitors on purpose: the gallery
				// wants everyone to see how many people viewed and liked a piece.
				.requestMatchers(HttpMethod.POST, "/api/antiques/*/views").permitAll()
				.requestMatchers(HttpMethod.POST, "/api/antiques/*/likes").permitAll()
				.requestMatchers(HttpMethod.DELETE, "/api/antiques/*/likes").permitAll()
				.requestMatchers(HttpMethod.GET, "/api/antiques/*/reconstruction").permitAll()
				.requestMatchers(HttpMethod.GET, "/api/categories").permitAll()
				.requestMatchers(HttpMethod.GET, "/api/location").permitAll()
				.requestMatchers(HttpMethod.GET, "/api/about").permitAll()
				.requestMatchers(HttpMethod.GET, "/api/home").permitAll()
				.requestMatchers(HttpMethod.GET, "/api/home/images/**").permitAll()
				.requestMatchers(HttpMethod.POST, "/api/chat").permitAll()
				.requestMatchers(HttpMethod.POST, "/api/chat/warmup").permitAll()
				.requestMatchers(HttpMethod.GET, "/api/chat/status").permitAll()
				.requestMatchers(HttpMethod.GET, "/api/me").hasAnyRole("USER", "ADMIN")
				.requestMatchers(HttpMethod.GET, "/actuator/health").permitAll()
				// .requestMatchers(HttpMethod.GET, "http://localhost:11434/api/chat").permitAll()
				.anyRequest().authenticated())
				.oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter())));
				// .oauth2ResourceServer(oauth2 -> oauth2.jwt());

		return http.build();
	}

	@Bean
	KeycloakJwtAuthenticationConverter jwtAuthenticationConverter() {
		return new KeycloakJwtAuthenticationConverter();
	}

	@Bean
	CorsConfigurationSource corsConfigurationSource() {
		CorsConfiguration configuration = new CorsConfiguration();
		configuration.setAllowedOrigins(List.of(frontendOrigin, "http://localhost:3000", "http://localhost:5173", "http://localhost:5174", "http://localhost:11434"));
		configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
		// X-Visitor-Id carries the anonymous visitor's stable id for the public view/like
		// counters. Without it in this list the browser blocks the preflight for those
		// calls, so the requests never reach the API from the frontend origin.
		configuration.setAllowedHeaders(List.of(
				HttpHeaders.AUTHORIZATION,
				HttpHeaders.CONTENT_TYPE,
				"X-XSRF-TOKEN",
				"X-Visitor-Id"));
		configuration.setAllowCredentials(true);

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", configuration);
		return source;
	}
}
