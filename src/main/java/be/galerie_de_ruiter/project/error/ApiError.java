package be.galerie_de_ruiter.project.error;

import java.time.Instant;

public record ApiError(Instant timestamp, int status, String error, String message, String path) {
}