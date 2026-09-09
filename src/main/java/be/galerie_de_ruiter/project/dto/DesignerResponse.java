package be.galerie_de_ruiter.project.dto;

import be.galerie_de_ruiter.project.domain.Designer;
import be.galerie_de_ruiter.project.domain.Antique;
import java.util.List;

public record DesignerResponse (String firstName, String lastName, String middleName, List<Antique> antiques){
    public static DesignerResponse from(Designer designer) {
        return new DesignerResponse(
                designer.getFirstName(),
                designer.getLastName(),
                designer.getMiddleName(),
                designer.getAntiques()
        );
    }
}


