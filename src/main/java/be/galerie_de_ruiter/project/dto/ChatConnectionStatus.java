package be.galerie_de_ruiter.project.dto;

/**
 * Describes whether the gallery assistant model connection is established.
 *
 * <p>The frontend reads this before it accepts a prompt so that no request is
 * sent to a chat model that is still starting up.</p>
 */
public record ChatConnectionStatus(boolean ready, String model, String detail) {
}
