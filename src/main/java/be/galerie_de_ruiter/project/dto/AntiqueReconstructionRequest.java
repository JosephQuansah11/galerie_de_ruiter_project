package be.galerie_de_ruiter.project.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record AntiqueReconstructionRequest(@NotEmpty @Valid List<ReconstructionViewDto> views, String modelUrl) {
    public record ReconstructionViewDto(@NotBlank String position, @NotBlank String url) {}
}
