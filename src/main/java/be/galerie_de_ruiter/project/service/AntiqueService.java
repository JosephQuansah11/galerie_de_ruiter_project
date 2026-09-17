package be.galerie_de_ruiter.project.service;

import be.galerie_de_ruiter.project.domain.Antique;
import be.galerie_de_ruiter.project.domain.Designer;
import be.galerie_de_ruiter.project.dto.AntiqueReconstructionRequest;
import be.galerie_de_ruiter.project.dto.AntiqueRequest;
import be.galerie_de_ruiter.project.repository.AntiqueRepository;
import be.galerie_de_ruiter.project.repository.DesignerRepository;
import be.galerie_de_ruiter.project.repository.CategoryRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.UUID;

import org.springframework.data.rest.webmvc.ResourceNotFoundException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
@RequiredArgsConstructor
public class AntiqueService {
    private final AntiqueRepository antiques;
    private final DesignerRepository designerRepository;
    private final UserService users;
        private final CategoryRepository categoryRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional(readOnly = true)
    public List<Antique> findAll() {
        return antiques.findAll();
    }

    @Transactional
    public Antique create(AntiqueRequest request, Jwt jwt) {
        log.info("Creating antique: {}", request.toString());
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
    public Antique saveReconstruction(UUID id, AntiqueReconstructionRequest request) {
        Antique antique = antiques.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Antique not found: " + id));
        try {
            antique.setSixViewImagesJson(objectMapper.writeValueAsString(request.views()));
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid six-view image payload", e);
        }
        if (request.modelUrl() != null) antique.setModelUrl(request.modelUrl());
        return antiques.save(antique);
    }
}