package be.galerie_de_ruiter.project.service;

import java.io.IOException;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

/**
 * Broadcasts a small topic name to every open browser when the gallery's content changes.
 *
 * <p>Only the topic travels - `categories`, `antiques`, `home` - never a row or a photograph. A
 * subscriber hears that its cached copy is stale and fetches fresh data through the normal API,
 * which keeps authorization and serialization in one place. A session that has gone away is
 * removed on the next failed send.</p>
 */
@Component
public class ContentWebSocketHandler extends TextWebSocketHandler {
    private static final Logger LOG = LoggerFactory.getLogger(ContentWebSocketHandler.class);

    private final Set<WebSocketSession> sessions = ConcurrentHashMap.newKeySet();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessions.add(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session);
    }

    /** Tells every connected browser that one topic changed. */
    public void broadcast(String topic) {
        if (topic == null || topic.isBlank()) return;
        TextMessage message = new TextMessage("{\"topic\":\"" + topic.replace("\"", "") + "\"}");
        for (WebSocketSession session : sessions) {
            if (!session.isOpen()) {
                sessions.remove(session);
                continue;
            }
            try {
                session.sendMessage(message);
            } catch (IOException | RuntimeException failed) {
                sessions.remove(session);
                LOG.debug("Dropped a content socket that could not be written: {}", failed.getMessage());
            }
        }
    }
}
