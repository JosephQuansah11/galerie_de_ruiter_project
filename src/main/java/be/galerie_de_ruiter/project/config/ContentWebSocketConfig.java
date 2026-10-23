package be.galerie_de_ruiter.project.config;

import be.galerie_de_ruiter.project.service.ContentWebSocketHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

/** Registers the public, data-free content socket used for live admin updates. */
@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class ContentWebSocketConfig implements WebSocketConfigurer {
    private final ContentWebSocketHandler contentUpdates;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        // The socket only carries topic names; the API still authorizes every read and write.
        registry.addHandler(contentUpdates, "/ws/content").setAllowedOriginPatterns("*");
    }
}
