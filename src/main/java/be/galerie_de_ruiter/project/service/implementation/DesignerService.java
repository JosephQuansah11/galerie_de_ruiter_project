package be.galerie_de_ruiter.project.service.implementation;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import be.galerie_de_ruiter.project.domain.Designer;
import be.galerie_de_ruiter.project.dto.DesignerRequest;
import be.galerie_de_ruiter.project.repository.DesignerRepository;
import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class DesignerService implements DesignerServiceImplementation{
    
    private final DesignerRepository designerRepository;
    
    @Override
    public List<Designer> getAllDesigners() {
        return designerRepository.findAll();
    }

    @Override
    public Designer getDesigner(UUID id) {
        return designerRepository.findById(id).orElse(null);
    }

    @Override
    public Designer saveDesigner(DesignerRequest request){
        Designer designer = new Designer(request.firstName(), request.middleName(), request.lastName());
        return designerRepository.save(designer);
    }
    
}
