package be.galerie_de_ruiter.project.service;

import be.galerie_de_ruiter.project.domain.Antique;
import be.galerie_de_ruiter.project.dto.CheckoutItemRequest;
import be.galerie_de_ruiter.project.dto.CheckoutRequest;
import be.galerie_de_ruiter.project.repository.AntiqueRepository;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import java.math.BigDecimal;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class StripeCheckoutService {
    private final AntiqueRepository antiques;

    @Value("${stripe.secret-key:}")
    private String secretKey;

    @Value("${stripe.success-url:http://localhost:3000/checkout/success}")
    private String successUrl;

    @Value("${stripe.cancel-url:http://localhost:3000/checkout/cancel}")
    private String cancelUrl;

    public String createCheckoutSession(CheckoutRequest request) {
        if (secretKey.isBlank()) {
            throw new IllegalStateException("STRIPE_SECRET_KEY is not configured");
        }
        Stripe.apiKey = secretKey;
        SessionCreateParams.Builder session = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(successUrl)
                .setCancelUrl(cancelUrl);

        for (CheckoutItemRequest item : request.items()) {
            Antique antique = antiques.findById(item.antiqueId())
                    .orElseThrow(() -> new IllegalArgumentException("Antique not found: " + item.antiqueId()));
            if (antique.getPrice() == null) {
                throw new IllegalArgumentException("Antique has no purchasable price: " + antique.getTitle());
            }
            long cents = antique.getPrice().multiply(BigDecimal.valueOf(100)).longValueExact();
            SessionCreateParams.LineItem.PriceData.ProductData product = SessionCreateParams.LineItem.PriceData.ProductData.builder()
                    .setName(antique.getTitle())
                    .setDescription(antique.getDescription() == null ? "Galerie de Ruiter antique" : antique.getDescription())
                    .build();
            SessionCreateParams.LineItem.PriceData price = SessionCreateParams.LineItem.PriceData.builder()
                    .setCurrency("eur")
                    .setUnitAmount(cents)
                    .setProductData(product)
                    .build();
            session.addLineItem(SessionCreateParams.LineItem.builder()
                    .setQuantity((long) item.quantity())
                    .setPriceData(price)
                    .build());
        }
        try {
            return Session.create(session.build()).getUrl();
        } catch (StripeException exception) {
            throw new IllegalStateException("Stripe checkout could not be created", exception);
        }
    }
}