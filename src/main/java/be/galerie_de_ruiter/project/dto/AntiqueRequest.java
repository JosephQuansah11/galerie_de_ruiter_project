package be.galerie_de_ruiter.project.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.UUID;



public record AntiqueRequest(
	@NotBlank String title, 
	@NotNull UUID artistId, 
	@Size(max = 5000) String description,
	@NotNull @DecimalMin("0.0") BigDecimal price,
		UUID categoryId,
		String imageUrl,
		String modelUrl) {
}