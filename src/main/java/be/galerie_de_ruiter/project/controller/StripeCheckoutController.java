package be.galerie_de_ruiter.project.controller;

import be.galerie_de_ruiter.project.dto.CheckoutRequest;
import be.galerie_de_ruiter.project.dto.CheckoutResponse;
import be.galerie_de_ruiter.project.service.StripeCheckoutService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/checkout")
@RequiredArgsConstructor
public class StripeCheckoutController {
    private final StripeCheckoutService checkout;

    @PostMapping
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public CheckoutResponse create(@Valid @RequestBody CheckoutRequest request) {
        return new CheckoutResponse(checkout.createCheckoutSession(request));
    }
}