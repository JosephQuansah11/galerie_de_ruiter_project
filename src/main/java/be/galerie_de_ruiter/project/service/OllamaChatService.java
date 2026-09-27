package be.galerie_de_ruiter.project.service;

import be.galerie_de_ruiter.project.domain.Appointment;
import be.galerie_de_ruiter.project.dto.ChatRequest;
import be.galerie_de_ruiter.project.dto.ChatResponse;
import be.galerie_de_ruiter.project.repository.AppointmentRepository;

import java.time.LocalDateTime;
import java.util.Map;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import com.fasterxml.jackson.databind.*;



@Service
@RequiredArgsConstructor
public class OllamaChatService {

    private final AppointmentRepository appointments;

    @Value("${ollama.base-url:http://localhost:11434}")
    private String ollamaUrl;

    @Value("${ollama.model:llama3.2:3b}")
    private String model;

    public ChatResponse reply(ChatRequest request, String subject) {

        String prompt = """
                You are the Galerie de Ruiter appointment assistant.
                Reply warmly and briefly.

                If the user clearly requests an appointment, extract:
                - a local date/time
                - an appointment type: VISIT or ONLINE

                Return ONLY valid JSON with these keys:
                {
                  "reply": "string",
                  "appointmentAt": "ISO local datetime or null",
                  "appointmentType": "VISIT or ONLINE or null"
                }

                User message:
                %s
                """.formatted(request.message());

        Map<?, ?> response = RestClient.create(ollamaUrl)
                .post()
                .uri("/api/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of(
                        "model", model,
                        "stream", false,
                        "format", "json",
                        "messages", java.util.List.of(
                                Map.of(
                                        "role", "user",
                                        "content", prompt
                                )
                        )
                ))
                .retrieve()
                .body(Map.class);

        Map<?, ?> message =
                response != null && response.get("message") instanceof Map<?, ?> value
                        ? value
                        : Map.of();

        Object contentValue = message.get("content");

        String content = String.valueOf(
                contentValue == null
                        ? "I could not process that request."
                        : contentValue
        );

        try {
            JsonNode json =
                    new ObjectMapper()
                            .readTree(content);

            LocalDateTime appointmentAt =
                    json.path("appointmentAt").isNull()
                            || json.path("appointmentAt").asText().isBlank()
                            ? null
                            : LocalDateTime.parse(
                                    json.path("appointmentAt").asText()
                            );

            String type =
                    json.path("appointmentType").isNull()
                            ? null
                            : json.path("appointmentType").asText(null);

            if (appointmentAt != null && type != null) {
                appointments.save(
                        new Appointment(
                                subject,
                                appointmentAt,
                                type,
                                request.message()
                        )
                );
            }

            return new ChatResponse(
                    json.path("reply").asText(content),
                    appointmentAt,
                    type
            );

        } catch (Exception ignored) {
            return new ChatResponse(content, null, null);
        }
    }
}
