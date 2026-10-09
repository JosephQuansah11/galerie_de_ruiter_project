package be.galerie_de_ruiter.project.controller;

import be.galerie_de_ruiter.project.dto.ChatConnectionStatus;
import be.galerie_de_ruiter.project.dto.ChatRequest;
import be.galerie_de_ruiter.project.dto.ChatResponse;
import be.galerie_de_ruiter.project.service.OllamaChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {
    private final OllamaChatService chat;

    /**
     * Lets the chat interface confirm the model connection before it sends a prompt.
     */
    @GetMapping("/status")
    public ChatConnectionStatus status() {
        return chat.connectionStatus();
    }

    /**
     * Establishes the model connection for the current session when the visitor opens
     * the chat page, so the first prompt is not answered by a cold model.
     */
    @PostMapping("/warmup")
    public ChatConnectionStatus warmUp() {
        return chat.warmUp();
    }

    @PostMapping
    public ChatResponse reply(@Valid @RequestBody ChatRequest request, @AuthenticationPrincipal Jwt jwt) {
        return chat.reply(request, jwt == null ? null : jwt.getSubject());
    }
}