package be.galerie_de_ruiter.project.dto;

import jakarta.validation.constraints.NotNull;

/**
 * Carries the sold flag an administrator sets once the client and the gallery have agreed on
 * payment. {@code sold=true} marks the piece as gone; {@code sold=false} puts it back on offer.
 */
public record AntiqueSoldRequest(@NotNull Boolean sold) {
}