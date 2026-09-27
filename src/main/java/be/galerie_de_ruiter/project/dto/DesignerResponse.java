package be.galerie_de_ruiter.project.dto;

import be.galerie_de_ruiter.project.domain.Designer;
import java.util.UUID;

public record DesignerResponse(UUID id, String firstName, String lastName, String middleName){
    public static DesignerResponse from(Designer designer) {
        return new DesignerResponse(
                designer.getId(),
                designer.getFirstName(),
                designer.getLastName(),
                designer.getMiddleName()
        );
    }
}


