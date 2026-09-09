package be.galerie_de_ruiter.project.service;

import be.galerie_de_ruiter.project.domain.Antique;
import be.galerie_de_ruiter.project.domain.Designer;
import be.galerie_de_ruiter.project.dto.AntiqueRequest;
import be.galerie_de_ruiter.project.repository.AntiqueRepository;
import be.galerie_de_ruiter.project.repository.DesignerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.List;

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

        return antiques.save(
                new Antique(
                        request.title(),
                        artist,
                        request.description(),
                        request.price(),
                        users.findOrCreate(
                                jwt.getSubject(),
                                jwt.getClaimAsString("preferred_username"),
                                jwt.getClaimAsString("email")
                        )
                )
        );
    }
}