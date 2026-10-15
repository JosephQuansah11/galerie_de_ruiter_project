package be.galerie_de_ruiter.project.dto;

import java.util.List;

/** The identity providers the gallery's realm offers, by alias (`google`, say). */
public record IdentityProviderResponse(List<String> providers) {
}
