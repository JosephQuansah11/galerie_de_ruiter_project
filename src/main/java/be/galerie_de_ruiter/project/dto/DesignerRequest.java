package be.galerie_de_ruiter.project.dto;

import jakarta.validation.constraints.NotBlank;

public record DesignerRequest (
    @NotBlank String firstName,
    String middleName,
     @NotBlank
     String lastName
) {

}
