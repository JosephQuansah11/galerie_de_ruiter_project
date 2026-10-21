package be.galerie_de_ruiter.project.dto;

import be.galerie_de_ruiter.project.domain.InterestStatus;
import jakarta.validation.constraints.NotNull;

/** The admin's follow-up stage for one interested piece. SOLD is derived from the piece's sold flag. */
public record InterestStatusRequest(@NotNull InterestStatus status) {
}
