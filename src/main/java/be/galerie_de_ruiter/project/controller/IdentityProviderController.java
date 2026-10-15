package be.galerie_de_ruiter.project.controller;

import be.galerie_de_ruiter.project.dto.IdentityProviderResponse;
import be.galerie_de_ruiter.project.service.IdentityProviderService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public on purpose: the sign-in page asks which third-party providers the realm offers before it
 * offers a button for one of them, and it does so before anyone is signed in.
 */
@RestController
@RequestMapping("/api/auth/providers")
@RequiredArgsConstructor
public class IdentityProviderController {
    private final IdentityProviderService identityProviders;

    @GetMapping
    public IdentityProviderResponse list() {
        return new IdentityProviderResponse(identityProviders.enabledAliases());
    }
}
