package be.galerie_de_ruiter.project.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public record CategoryRequest(@NotBlank String name, UUID parentId, boolean visible) {
}