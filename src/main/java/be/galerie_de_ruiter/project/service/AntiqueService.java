package be.galerie_de_ruiter.project.service;

import be.galerie_de_ruiter.project.domain.Antique;
import be.galerie_de_ruiter.project.domain.AntiqueImage;
import be.galerie_de_ruiter.project.domain.Designer;
import be.galerie_de_ruiter.project.dto.AntiqueReconstructionRequest;
import be.galerie_de_ruiter.project.dto.AntiqueReconstructionRequest.ReconstructionViewDto;
import be.galerie_de_ruiter.project.dto.AntiqueRequest;
import be.galerie_de_ruiter.project.dto.AntiqueResponse;
import be.galerie_de_ruiter.project.dto.AntiqueResponse.SixViewImageResponse;
import be.galerie_de_ruiter.project.dto.AntiqueUpdateRequest;
import be.galerie_de_ruiter.project.repository.AntiqueImageRepository;
import be.galerie_de_ruiter.project.repository.AntiqueLikeRepository;
import be.galerie_de_ruiter.project.repository.AntiqueModelRepository;
import be.galerie_de_ruiter.project.repository.AntiqueRepository;
import be.galerie_de_ruiter.project.repository.AntiqueViewRepository;
import be.galerie_de_ruiter.project.repository.DesignerRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import be.galerie_de_ruiter.project.repository.CategoryRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.data.rest.webmvc.ResourceNotFoundException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AntiqueService {
    private final AntiqueRepository antiques;
    private final DesignerRepository designerRepository;
    private final AntiqueImageRepository antiqueImageRepository;
    private final AntiqueModelRepository antiqueModelRepository;
    private final AntiqueLikeRepository antiqueLikeRepository;
    private final AntiqueViewRepository antiqueViewRepository;
    private final AntiqueModelStorage modelStorage;
    private final UserService users;
    private final CategoryRepository categoryRepository;

    
    @Transactional(readOnly = true)
    public List<Antique> findAll() {
        return antiques.findAll();
    }

    @Transactional(readOnly = true)
    public List<AntiqueResponse> findAllResponses() {
        return antiques.findAll().stream().map(AntiqueResponse::from).toList();
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
    public AntiqueResponse createResponse(AntiqueRequest request, Jwt jwt) {
        return AntiqueResponse.from(create(request, jwt));
    }

    @Transactional
    public AntiqueResponse update(UUID id, AntiqueUpdateRequest request) {
        Antique antique = findAntique(id);
        antique.setTitle(request.title().trim());
        antique.setDescription(request.description());
        antique.setPrice(request.price());
        return AntiqueResponse.from(antiques.save(antique));
    }

    /**
     * Marks a piece as sold (or back on offer). An administrator flips this once the client
     * and the gallery have agreed on payment, so the catalogue stops offering it for purchase.
     */
    @Transactional
    public AntiqueResponse setSold(UUID id, boolean sold) {
        Antique antique = findAntique(id);
        antique.setSold(sold);
        return AntiqueResponse.from(antiques.save(antique));
    }

    /**
     * Stores the uploaded model on the gallery disk. The database copy is dropped: the file is
     * authoritative now, and removing the row is what reclaims the storage that made uploads
     * fail on a small production database.
     */
    @Transactional
    public AntiqueResponse saveModel(UUID id, MultipartFile model) {
        Antique antique = findAntique(id);
        modelStorage.store(id, model);
        antiqueModelRepository.deleteByAntiqueId(id);
        antique.setModelUrl("/api/antiques/" + id + "/model");
        return AntiqueResponse.from(antiques.save(antique));
    }

    /**
     * The stored model, streamed from the gallery disk. An antique that was uploaded before
     * models moved out of the database still serves its model from the old row, so nothing is
     * lost by the move; models uploaded from now on live on the disk only.
     */
    @Transactional(readOnly = true)
    public Optional<StoredAntiqueModel> readModel(UUID id) {
        Optional<Path> stored = modelStorage.locate(id);
        if (stored.isPresent()) {
            Path file = stored.get();
            try {
                return Optional.of(new StoredAntiqueModel(new FileSystemResource(file), Files.size(file)));
            } catch (IOException exception) {
                throw new IllegalStateException("The stored model could not be read.", exception);
            }
        }
        return antiqueModelRepository.findByAntiqueId(id).map(model -> {
            byte[] data = model.getData();
            return new StoredAntiqueModel(new ByteArrayResource(data), data.length);
        });
    }

    /** A model ready to be streamed back to the client, wherever it is stored. */
    public record StoredAntiqueModel(Resource content, long size) {
    }

    @Transactional
    public void delete(UUID id) {
        Antique antique = findAntique(id);
        antiqueImageRepository.deleteAllByAntiqueId(id);
        antiqueModelRepository.deleteByAntiqueId(id);
        modelStorage.delete(id);
        // The public counters keep their own rows. They must go with the antique, or they
        // would be left pointing at a piece that no longer exists - and a schema that
        // carries the foreign key would reject the delete outright.
        antiqueViewRepository.deleteAllByAntiqueId(id);
        antiqueLikeRepository.deleteAllByAntiqueId(id);
        antiques.delete(antique);
    }

    private Antique findAntique(UUID id) {
        return antiques.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Antique not found: " + id));
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

    AntiqueImage savedImage = antiqueImageRepository.save(image);
    if (!antique.getImages().contains(savedImage)) {
        antique.getImages().add(savedImage);
    }
}


    if (request.modelUrl() != null) {
        antique.setModelUrl(request.modelUrl());
    }

    return antiques.save(antique);
}

@Transactional
public AntiqueResponse saveReconstructionResponse(UUID id, AntiqueReconstructionRequest request) {
    return AntiqueResponse.from(saveReconstruction(id, request));
}

@Transactional(readOnly = true)
public List<SixViewImageResponse> getReconstructionImages(UUID antiqueId) {
    return antiqueImageRepository.findAllByAntiqueId(antiqueId).stream()
            .filter(image -> List.of("front", "back", "left", "right", "top", "bottom")
                    .contains(image.getPosition()))
            .map(image -> new SixViewImageResponse(
                    image.getPosition(),
                    "/api/antiques/" + antiqueId + "/image/" + image.getId()))
            .toList();
}
}