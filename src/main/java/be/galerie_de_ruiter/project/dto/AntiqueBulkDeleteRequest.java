package be.galerie_de_ruiter.project.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;

/** The pieces an administrator selected in the inventory and asked to remove at once. */
public record AntiqueBulkDeleteRequest(
        @NotEmpty @Size(max = 200) List<@NotNull UUID> ids) {
}
