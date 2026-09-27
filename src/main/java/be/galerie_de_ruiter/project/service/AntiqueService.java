package be.galerie_de_ruiter.project.service;

import be.galerie_de_ruiter.project.domain.Antique;
import be.galerie_de_ruiter.project.domain.AntiqueImage;
import be.galerie_de_ruiter.project.domain.Designer;
import be.galerie_de_ruiter.project.dto.AntiqueReconstructionRequest;
import be.galerie_de_ruiter.project.dto.AntiqueReconstructionRequest.ReconstructionViewDto;
import be.galerie_de_ruiter.project.dto.AntiqueRequest;
import be.galerie_de_ruiter.project.repository.AntiqueImageRepository;
import be.galerie_de_ruiter.project.repository.AntiqueRepository;
import be.galerie_de_ruiter.project.repository.DesignerRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import be.galerie_de_ruiter.project.repository.CategoryRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.rest.webmvc.ResourceNotFoundException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AntiqueService {
    private final AntiqueRepository antiques;
    private final DesignerRepository designerRepository;
    private final AntiqueImageRepository antiqueImageRepository;
    private final UserService users;
    private final CategoryRepository categoryRepository;

    
    @Transactional(readOnly = true)
    public List<Antique> findAll() {
        return antiques.findAll();
    }

    @Transactional
    public Antique create(AntiqueRequest request, Jwt jwt) {
        Designer artist = designerRepository
                .findById(request.artistId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Designer not found: " + request.artistId()
                        ));

        Antique antique = new Antique(
                request.title(),
                artist,
                request.description(),
                request.price(),
                users.findOrCreate(
                        jwt.getSubject(),
                        jwt.getClaimAsString("preferred_username"),
                        jwt.getClaimAsString("email")
                ),
                request.categoryId() == null ? null : categoryRepository.findById(request.categoryId()).orElseThrow()
        );
        antique.setModelUrl(request.modelUrl());
        return antiques.save(antique);
    }

@Transactional
public Antique saveReconstruction(
        UUID id,
        AntiqueReconstructionRequest request
) {
    Antique antique = antiques.findById(id)
            .orElseThrow(() ->
                    new ResourceNotFoundException(
                            "Antique not found: " + id
                    )
            );

//     for (ReconstructionViewDto view : request.views()) {

//         AntiqueImage image = new AntiqueImage(
//                 antique,
//                 view.position(),
//                 view.imageData(),
//                 view.contentType()
//         );

//         antiqueImageRepository.save(image);
//     }

for (ReconstructionViewDto view : request.views()) {

    AntiqueImage image =
            antiqueImageRepository
                    .findByAntiqueIdAndPosition(
                            id,
                            view.position()
                    )
                    .orElseGet(() ->new AntiqueImage(
                                    antique,
                                    view.position(),
                                    view.imageData(),
                                    view.contentType()
                            )
                    );

    image.setImageData(view.imageData());
    image.setContentType(view.contentType());

    antiqueImageRepository.save(image);
}


    if (request.modelUrl() != null) {
        antique.setModelUrl(request.modelUrl());
    }

    return antiques.save(antique);
}

@Transactional(readOnly = true)
public List<AntiqueImage> getReconstructionImages(UUID antiqueId) {
    return antiqueImageRepository.findAllByAntiqueId(antiqueId).stream().filter(image->
      !Number.class.isInstance(image.getPosition()) && antiqueId.equals(image.getAntique().getId())
    ).collect(Collectors.toList());
}
}