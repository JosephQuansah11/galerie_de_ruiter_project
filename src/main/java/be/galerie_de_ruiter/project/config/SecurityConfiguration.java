package be.galerie_de_ruiter.project.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableMethodSecurity
public class SecurityConfiguration {

	@Value("${FRONTEND_ORIGIN:http://localhost:5173}")
	private String frontendOrigin;

	@Bean
	SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		http
			.cors(cors -> cors.configurationSource(corsConfigurationSource()))
			.csrf(csrf -> csrf.csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse()))
			// .csrf(csrf->csrf.disable())
			// .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
			.authorizeHttpRequests(authorize -> authorize
				.requestMatchers(HttpMethod.GET,"/api/admin/users").hasRole("ADMIN")
				.requestMatchers(HttpMethod.GET, "/api/csrf").permitAll()
				.requestMatchers(HttpMethod.POST, "/api").authenticated()
				.requestMatchers( "/api").authenticated()
				.requestMatchers(HttpMethod.GET, "/api/antiques").permitAll()
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
		configuration.setAllowedHeaders(List.of(HttpHeaders.AUTHORIZATION, HttpHeaders.CONTENT_TYPE, "X-XSRF-TOKEN"));
		configuration.setAllowCredentials(true);

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", configuration);
		return source;
	}
}
