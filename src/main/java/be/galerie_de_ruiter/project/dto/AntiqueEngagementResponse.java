package be.galerie_de_ruiter.project.dto;

import java.util.UUID;

/**
 * Public engagement numbers for one antique: how many distinct people have seen it, how
 * many liked it, and whether the visitor who asked already liked it.
 */
public record AntiqueEngagementResponse(UUID antiqueId, long viewCount, long likeCount, boolean liked) {
}
