package be.galerie_de_ruiter.project.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** What the administrator's interest screen shows for one piece. */
public record AdminInterestGroupResponse(
        UUID antiqueId,
        String title,
        String artist,
        String category,
        String imageUrl,
        boolean sold,
        String status,
        List<InterestedPerson> people) {

    /** One signed-in visitor who marked the piece, with enough detail to contact them. */
    public record InterestedPerson(UUID userId, String name, String email, Instant addedAt) {
    }
}
