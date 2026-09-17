package be.galerie_de_ruiter.project.service.implementation;

import java.util.List;
import java.util.UUID;

import be.galerie_de_ruiter.project.domain.Designer;
import be.galerie_de_ruiter.project.dto.DesignerRequest;

public interface DesignerServiceImplementation {
    List<Designer> getAllDesigners();
    List<Designer> searchDesigners(String query);
    Designer getDesigner(UUID id);

    Designer saveDesigner(DesignerRequest designer);
}
