package be.galerie_de_ruiter.project.service;

import be.galerie_de_ruiter.project.domain.Antique;
import be.galerie_de_ruiter.project.domain.AntiqueImage;
import be.galerie_de_ruiter.project.domain.Designer;
import be.galerie_de_ruiter.project.dto.AntiqueBulkDeleteResponse;
import be.galerie_de_ruiter.project.dto.AntiqueRequest;
import be.galerie_de_ruiter.project.dto.AntiqueResponse;
import be.galerie_de_ruiter.project.dto.DesignerResponse;
import be.galerie_de_ruiter.project.dto.AntiqueUpdateRequest;
import be.galerie_de_ruiter.project.repository.AntiqueImageRepository;
import be.galerie_de_ruiter.project.repository.AntiqueInterestRepository;
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
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
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
    private final AntiqueInterestRepository antiqueInterestRepository;
    private final ImageStorage imageStorage;
    private final AntiqueModelStorage modelStorage;
    private final UserService users;
    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public List<AntiqueResponse> findAllResponses() {
        // Two queries that never touch a photograph's bytes: the listing columns, and the ids and
        // positions of the pictures. Loading the antiques with their `images` collection - what this
        // used to do - read every picture of every piece out of PostgreSQL just to name them, and that
        // took sixteen seconds on the deployed catalogue while every other endpoint took a third of a
        // second. The bytes are still served, one picture at a time, by the image endpoints.
        Map<UUID, List<AntiqueImageRepository.CatalogueImage>> imagesByAntique = antiqueImageRepository
                .findCatalogueImages().stream()
                .collect(Collectors.groupingBy(AntiqueImageRepository.CatalogueImage::getAntiqueId));
        return antiques.findCatalogueRows().stream()
                .map(row -> catalogueResponse(row, imagesByAntique.getOrDefault(row.getId(), List.of())))
                .toList();
    }

    /** One catalogue row as the API has always answered it, with its photographs named, not sent. */
    private static AntiqueResponse catalogueResponse(AntiqueRepository.CatalogueRow row,
            List<AntiqueImageRepository.CatalogueImage> images) {
        List<String> imageUrls = images.stream()
                .filter(image -> !AntiqueImage.isSixViewPosition(image.getPosition()))
                .sorted(Comparator.comparingInt((AntiqueImageRepository.CatalogueImage image) ->
                                displayOrderNumber(image.getDisplayOrder()))
                        .thenComparing(image -> String.valueOf(image.getImageId())))
                .map(image -> "/api/antiques/" + row.getId() + "/image/" + image.getImageId())
                .toList();
        DesignerResponse artist = row.getArtistId() == null ? null : new DesignerResponse(
                row.getArtistId(), row.getArtistFirstName(), row.getArtistLastName(), row.getArtistMiddleName());
        return new AntiqueResponse(row.getId(), row.getTitle(), artist, row.getDescription(), row.getPrice(),
                categoryLabel(row.getCategory(), row.getParentCategory()), row.getModelUrl(),
                imageUrls.stream().findFirst().orElse(null), imageUrls,
                row.getViewCount(), row.getLikeCount(), row.isSold());
    }

    /** A subcategory is always shown with its main category: `Main / Child`. */
    private static String categoryLabel(String category, String parentCategory) {
        if (category == null) return null;
        return parentCategory == null || parentCategory.isBlank() ? category : parentCategory + " / " + category;
    }

    /** The display order as a number, as the entity compares it: blank or odd sorts last. */
    private static int displayOrderNumber(String displayOrder) {
        if (displayOrder == null || displayOrder.isBlank()) return Integer.MAX_VALUE;
        try {
            return Integer.parseInt(displayOrder.trim());
        } catch (NumberFormatException notANumber) {
            return Integer.MAX_VALUE;
        }
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
        if (request.description() != null) antique.setDescription(request.description());
        if (request.price() != null) antique.setPrice(request.price());
        // Optional fields: a null value means "leave what the piece already has", which is what
        // lets an import update a title or story without erasing a price, artist or category it
        // did not know about.
        if (request.artistId() != null) {
            antique.setArtist(designerRepository.findById(request.artistId())
                    .orElseThrow(() -> new ResourceNotFoundException("Designer not found: " + request.artistId())));
        }
        if (request.categoryId() != null) {
            antique.setCategory(categoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + request.categoryId())));
        }
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
        List<String> storedKeys = deleteAntique(findAntique(id));
        StoredObjectCleanup.afterCommit(imageStorage, storedKeys);
    }

    /**
     * Deletes every selected piece that still exists. A piece another tab or an earlier click
     * already removed is reported as missing rather than making the rest of the selection fail.
     */
    @Transactional
    public AntiqueBulkDeleteResponse deleteMany(List<UUID> ids) {
        int deleted = 0;
        List<UUID> missing = new ArrayList<>();
        List<String> storedKeys = new ArrayList<>();
        for (UUID id : new LinkedHashSet<>(ids)) {
            Optional<Antique> antique = antiques.findById(id);
            if (antique.isEmpty()) {
                missing.add(id);
                continue;
            }
            storedKeys.addAll(deleteAntique(antique.get()));
            deleted += 1;
        }
        // One R2 deleteObjects request for the whole selection instead of one per piece.
        StoredObjectCleanup.afterCommit(imageStorage, storedKeys);
        return new AntiqueBulkDeleteResponse(deleted, missing);
    }

    private List<String> deleteAntique(Antique antique) {
        UUID id = antique.getId();
        // Read the object keys before deleting the rows; once the rows are gone there is no way to
        // name the objects they pointed at. The removal itself waits for the transaction to commit.
        List<String> storedKeys = imageStorage.isEnabled()
                ? antiqueImageRepository.findStorageKeysByAntiqueId(id)
                : List.of();
        antiqueImageRepository.deleteAllByAntiqueId(id);
        antiqueModelRepository.deleteByAntiqueId(id);
        modelStorage.delete(id);
        // The public counters keep their own rows. They must go with the antique, or they
        // would be left pointing at a piece that no longer exists - and a schema that
        // carries the foreign key would reject the delete outright.
        antiqueViewRepository.deleteAllByAntiqueId(id);
        antiqueLikeRepository.deleteAllByAntiqueId(id);
        antiqueInterestRepository.deleteAllByAntiqueId(id);
        antiques.delete(antique);
        return storedKeys;
    }

    private Antique findAntique(UUID id) {
        return antiques.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Antique not found: " + id));
    }

}