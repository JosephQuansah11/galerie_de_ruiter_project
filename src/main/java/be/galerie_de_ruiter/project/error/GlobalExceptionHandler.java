package be.galerie_de_ruiter.project.error;

import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.access.AccessDeniedException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestControllerAdvice
public class GlobalExceptionHandler {
	private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

	@ExceptionHandler(MethodArgumentNotValidException.class)
	ResponseEntity<ApiError> validation(MethodArgumentNotValidException exception, HttpServletRequest request) {
		String message = exception.getBindingResult().getFieldErrors().stream()
				.map(error -> error.getField() + ": " + error.getDefaultMessage()).collect(Collectors.joining(", "));
		return response(HttpStatus.BAD_REQUEST, message, request);
	}

	@ExceptionHandler(ResponseStatusException.class)
	ResponseEntity<ApiError> status(ResponseStatusException exception, HttpServletRequest request) {
		return response(HttpStatus.valueOf(exception.getStatusCode().value()), exception.getReason(), request);
	}

	@ExceptionHandler(AccessDeniedException.class)
	ResponseEntity<ApiError> accessDenied(AccessDeniedException exception, HttpServletRequest request) {
		return response(HttpStatus.FORBIDDEN, "You do not have permission to perform this action", request);
	}

	@ExceptionHandler(DataIntegrityViolationException.class)
	ResponseEntity<ApiError> conflict(DataIntegrityViolationException exception, HttpServletRequest request) {
		logger.error("Database constraint rejected request to {}", request.getRequestURI(), exception);
		return response(HttpStatus.CONFLICT, "The request conflicts with existing data", request);
	}

	@ExceptionHandler(HttpMessageNotReadableException.class)
	ResponseEntity<ApiError> unreadable(HttpMessageNotReadableException exception, HttpServletRequest request) {
		return response(HttpStatus.BAD_REQUEST, "Malformed JSON request body", request);
	}

	/**
	 * A model or photo larger than the configured multipart limit used to surface as a
	 * generic 500, which looked like a connection failure in the admin screens.
	 */
	@ExceptionHandler(MaxUploadSizeExceededException.class)
	ResponseEntity<ApiError> uploadTooLarge(MaxUploadSizeExceededException exception, HttpServletRequest request) {
		logger.warn("Rejected an oversized upload for {}: {}", request.getRequestURI(), exception.getMessage());
		return response(HttpStatus.PAYLOAD_TOO_LARGE,
				"The uploaded file is larger than the server accepts. Upload a smaller file.", request);
	}

	@ExceptionHandler(IllegalArgumentException.class)
	ResponseEntity<ApiError> invalidArgument(IllegalArgumentException exception, HttpServletRequest request) {
		return response(HttpStatus.BAD_REQUEST, exception.getMessage(), request);
	}

	@ExceptionHandler(IllegalStateException.class)
	ResponseEntity<ApiError> unavailable(IllegalStateException exception, HttpServletRequest request) {
		return response(HttpStatus.SERVICE_UNAVAILABLE, exception.getMessage(), request);
	}

	@ExceptionHandler(Exception.class)
	ResponseEntity<ApiError> unexpected(Exception exception, HttpServletRequest request) {
		logger.error("Unhandled error for {} {}", request.getMethod(), request.getRequestURI(), exception);
		return response(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred", request);
	}

	private ResponseEntity<ApiError> response(HttpStatus status, String message, HttpServletRequest request) {
		return ResponseEntity.status(status).body(new ApiError(Instant.now(), status.value(), status.getReasonPhrase(), message, request.getRequestURI()));
	}
}