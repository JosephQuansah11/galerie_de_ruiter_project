package be.galerie_de_ruiter.project.dto;

import java.util.List;
import java.util.UUID;

/**
 * What a bulk delete did. An id that was already gone is reported instead of failing the whole
 * selection, so a stale tab cannot stop the pieces that are still there from being removed.
 */
public record AntiqueBulkDeleteResponse(int deleted, List<UUID> missing) {
}
