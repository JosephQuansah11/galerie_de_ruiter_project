package be.galerie_de_ruiter.project.service;

import be.galerie_de_ruiter.project.domain.Antique;
import be.galerie_de_ruiter.project.domain.AntiqueInterest;
import be.galerie_de_ruiter.project.domain.User;
import be.galerie_de_ruiter.project.dto.AdminInterestGroupResponse;
import be.galerie_de_ruiter.project.dto.AntiqueResponse;
import be.galerie_de_ruiter.project.dto.DesignerResponse;
import be.galerie_de_ruiter.project.repository.AntiqueInterestRepository;
import be.galerie_de_ruiter.project.repository.AntiqueRepository;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * The signed-in visitor's interest list, and the administrator's view of it.
 *
 * <p>A wishlist used to live only in the browser, so the gallery never learned what a visitor
 * wanted. Every row here is tied to the gallery's user record; the administrator can see the
 * piece, the visitor's name and email, and when it was marked.</p>
 */
@Service
@RequiredArgsConstructor
public class AntiqueInterestService {
    private final AntiqueInterestRepository interests;
    private final AntiqueRepository antiques;
    private final UserService users;

    /** The signed-in visitor's pieces, newest first. */
    @Transactional
    public List<AntiqueResponse> wishlist(Jwt jwt) {
        User user = currentUser(jwt);
        return interests.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map((interest) -> AntiqueResponse.from(interest.getAntique()))
                .toList();
    }

    /** Marks a piece as interesting; marking it twice changes nothing. */
    @Transactional
    public void add(Jwt jwt, UUID antiqueId) {
        User user = currentUser(jwt);
        Antique antique = requireAntique(antiqueId);
        if (!interests.existsByAntiqueIdAndUserId(antiqueId, user.getId())) {
            interests.save(new AntiqueInterest(antique, user));
        }
    }

    /** Removes this visitor's interest again. */
    @Transactional
    public void remove(Jwt jwt, UUID antiqueId) {
        User user = currentUser(jwt);
        interests.deleteByAntiqueIdAndUserId(antiqueId, user.getId());
    }

    /** Every piece someone is interested in, grouped by piece, newest interest first. */
    @Transactional(readOnly = true)
    public List<AdminInterestGroupResponse> all() {
        Map<UUID, List<AntiqueInterest>> grouped = interests.findAllByOrderByCreatedAtDesc().stream()
                .collect(Collectors.groupingBy(
                        (interest) -> interest.getAntique().getId(),
                        LinkedHashMap::new,
                        Collectors.toList()));
        return grouped.values().stream().map((rows) -> {
            Antique antique = rows.get(0).getAntique();
            AntiqueResponse response = AntiqueResponse.from(antique);
            List<AdminInterestGroupResponse.InterestedPerson> people = rows.stream()
                    .map((interest) -> new AdminInterestGroupResponse.InterestedPerson(
                            interest.getUser().getId(),
                            personName(interest.getUser()),
                            interest.getUser().getEmail(),
                            interest.getCreatedAt()))
                    .toList();
            return new AdminInterestGroupResponse(
                    antique.getId(),
                    antique.getTitle(),
                    artistName(response.artist()),
                    response.category(),
                    response.imageUrl(),
                    people);
        }).toList();
    }

    private User currentUser(Jwt jwt) {
        if (jwt == null || jwt.getSubject() == null || jwt.getSubject().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sign in to save a piece.");
        }
        return users.findOrCreate(jwt.getSubject(), jwt.getClaimAsString("preferred_username"),
                jwt.getClaimAsString("email"));
    }

    private Antique requireAntique(UUID antiqueId) {
        return antiques.findById(antiqueId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "That antique does not exist."));
    }

    private static String personName(User user) {
        String full = join(user.getFirstName(), user.getLastName());
        if (!full.isBlank()) return full;
        if (user.getDisplayName() != null && !user.getDisplayName().isBlank()) return user.getDisplayName();
        return user.getEmail() == null ? "" : user.getEmail();
    }

    private static String artistName(DesignerResponse artist) {
        if (artist == null) return "";
        return join(artist.firstName(), artist.middleName(), artist.lastName());
    }

    private static String join(String... parts) {
        return java.util.Arrays.stream(parts)
                .filter((part) -> part != null && !part.isBlank())
                .collect(Collectors.joining(" "));
    }
}
