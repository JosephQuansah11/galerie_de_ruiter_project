package be.galerie_de_ruiter.project.dto;

import java.util.List;
import java.util.UUID;

/** The gallery's preferred photograph order for one piece, first to last. */
public record AntiqueImageOrderRequest(List<UUID> imageIds) {
}
