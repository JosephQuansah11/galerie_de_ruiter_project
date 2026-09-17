package be.galerie_de_ruiter.project.error;

import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {
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

	@ExceptionHandler(DataIntegrityViolationException.class)
	ResponseEntity<ApiError> conflict(DataIntegrityViolationException exception, HttpServletRequest request) {
		return response(HttpStatus.CONFLICT, "The request conflicts with existing data", request);
	}

	@ExceptionHandler(HttpMessageNotReadableException.class)
	ResponseEntity<ApiError> unreadable(HttpMessageNotReadableException exception, HttpServletRequest request) {
		return response(HttpStatus.BAD_REQUEST, "Malformed JSON request body", request);
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
		log.error("Unexpected error handling {} {}", request.getMethod(), request.getRequestURI(), exception);
		return response(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred", request);
	}

	private ResponseEntity<ApiError> response(HttpStatus status, String message, HttpServletRequest request) {
		return ResponseEntity.status(status).body(new ApiError(Instant.now(), status.value(), status.getReasonPhrase(), message, request.getRequestURI()));
	}
}