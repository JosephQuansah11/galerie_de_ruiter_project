package be.galerie_de_ruiter.project.controller;

import be.galerie_de_ruiter.project.domain.User;
import be.galerie_de_ruiter.project.dto.UserRegistrationRequest;
import be.galerie_de_ruiter.project.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.security.core.annotation.AuthenticationPrincipal;

import java.util.Map;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import be.galerie_de_ruiter.project.dto.UserResponse;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;


    @GetMapping("/me")
    public ResponseEntity<User> currentUser(@AuthenticationPrincipal Jwt jwt) {
        if (jwt == null || jwt.getSubject() == null || jwt.getSubject().isBlank()) {
            return ResponseEntity.status(401).build();
        }

        String username = jwt.getClaimAsString("preferred_username");
        String email = jwt.getClaimAsString("email");
        return ResponseEntity.ok(userService.findOrCreate(jwt.getSubject(), username, email));
    }

    @GetMapping("/login")
    public CsrfToken csrf(CsrfToken token) {
        return token;
    }

    @GetMapping("/admin/users")
    public ResponseEntity<List<UserResponse>> allUsers() {
        List<User> users = userService.findAll();
        if (users == null) {
            users = List.of();
        }
        return ResponseEntity.ok(users.stream().map(UserResponse::from).toList());
    }

    @PostMapping("/register")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> register(@Valid @RequestBody UserRegistrationRequest request) {
        return ResponseEntity.ok(userService.register(request));
    }

    @GetMapping("/debug")
    public Map<String, String> debug(@RequestParam("value") String CSRF_TOKEN) {
        return Map.of("value", CSRF_TOKEN);
    }
}