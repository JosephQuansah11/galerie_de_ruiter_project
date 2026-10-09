package be.galerie_de_ruiter.project.service;

import be.galerie_de_ruiter.project.domain.Antique;
import be.galerie_de_ruiter.project.domain.AntiqueLike;
import be.galerie_de_ruiter.project.domain.AntiqueView;
import be.galerie_de_ruiter.project.dto.AntiqueEngagementResponse;
import be.galerie_de_ruiter.project.repository.AntiqueLikeRepository;
import be.galerie_de_ruiter.project.repository.AntiqueRepository;
import be.galerie_de_ruiter.project.repository.AntiqueViewRepository;

import java.util.UUID;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Keeps the public "how many people saw this / liked this" numbers for the catalogue.
 *
 * <p>Every visitor is counted once per antique. A duplicate view or like is ignored instead
 * of incrementing the counter again, so the numbers stay meaningful without a login.</p>
 */
@Service
@RequiredArgsConstructor
public class AntiqueEngagementService {
    private final AntiqueRepository antiques;
    private final AntiqueViewRepository views;
    private final AntiqueLikeRepository likes;

    /** Records the visitor as someone who has seen this antique. */
    @Transactional
    public AntiqueEngagementResponse registerView(UUID antiqueId, String viewerKey) {
        Antique antique = requireAntique(antiqueId);
        if (viewerKey != null && !views.existsByAntiqueIdAndViewerKey(antiqueId, viewerKey)) {
            views.save(new AntiqueView(antiqueId, viewerKey));
            antique.addViewer();
        }
        return response(antique, viewerKey);
    }

    /** Adds this visitor's like to the antique; liking twice counts once. */
    @Transactional
    public AntiqueEngagementResponse like(UUID antiqueId, String viewerKey) {
        Antique antique = requireAntique(antiqueId);
        if (viewerKey != null && !likes.existsByAntiqueIdAndViewerKey(antiqueId, viewerKey)) {
            likes.save(new AntiqueLike(antiqueId, viewerKey));
            antique.addLiker();
        }
        return response(antique, viewerKey);
    }

    /** Removes this visitor's like again, so the public count follows what people do. */
    @Transactional
    public AntiqueEngagementResponse unlike(UUID antiqueId, String viewerKey) {
        Antique antique = requireAntique(antiqueId);
        if (viewerKey != null && likes.deleteByAntiqueIdAndViewerKey(antiqueId, viewerKey) > 0) {
            antique.removeLiker();
        }
        return response(antique, viewerKey);
    }

    private Antique requireAntique(UUID antiqueId) {
        return antiques.findById(antiqueId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "That antique does not exist."));
    }

    private AntiqueEngagementResponse response(Antique antique, String viewerKey) {
        boolean liked = viewerKey != null && likes.existsByAntiqueIdAndViewerKey(antique.getId(), viewerKey);
        return new AntiqueEngagementResponse(antique.getId(), antique.getViewCount(), antique.getLikeCount(), liked);
    }

    /**
     * Builds the stored identity of a visitor from the two things the API can trust: the
     * Keycloak subject of a signed-in visitor, or the id the browser keeps for an anonymous
     * one. The browser value is untrusted, so it is reduced to a safe, bounded key before it
     * reaches a unique index.
     */
    public static String viewerKey(String subject, String visitorId) {
        if (subject != null && !subject.isBlank()) {
            return "user:" + subject.trim();
        }
        if (visitorId == null) {
            return null;
        }
        String cleaned = visitorId.replaceAll("[^A-Za-z0-9_-]", "");
        return cleaned.isBlank() ? null : "guest:" + cleaned.substring(0, Math.min(64, cleaned.length()));
    }
}
