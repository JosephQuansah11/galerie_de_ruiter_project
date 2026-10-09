package be.galerie_de_ruiter.project.controller;

import be.galerie_de_ruiter.project.dto.AntiqueEngagementResponse;
import be.galerie_de_ruiter.project.service.AntiqueEngagementService;

import java.util.UUID;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public counters for an antique. Visitors who are not signed in still count: the browser
 * sends the stable id it keeps locally and the API counts each id once.
 */
@RestController
@RequestMapping("/api/antiques/{id}")
@RequiredArgsConstructor
public class AntiqueEngagementController {
    private static final String VISITOR_HEADER = "X-Visitor-Id";

    private final AntiqueEngagementService engagement;

    @PostMapping("/views")
    public AntiqueEngagementResponse view(@PathVariable UUID id,
            @RequestHeader(value = VISITOR_HEADER, required = false) String visitorId,
            @AuthenticationPrincipal Jwt jwt) {
        return engagement.registerView(id, key(jwt, visitorId));
    }

    @PostMapping("/likes")
    public AntiqueEngagementResponse like(@PathVariable UUID id,
            @RequestHeader(value = VISITOR_HEADER, required = false) String visitorId,
            @AuthenticationPrincipal Jwt jwt) {
        return engagement.like(id, key(jwt, visitorId));
    }

    @DeleteMapping("/likes")
    public AntiqueEngagementResponse unlike(@PathVariable UUID id,
            @RequestHeader(value = VISITOR_HEADER, required = false) String visitorId,
            @AuthenticationPrincipal Jwt jwt) {
        return engagement.unlike(id, key(jwt, visitorId));
    }

    private static String key(Jwt jwt, String visitorId) {
        return AntiqueEngagementService.viewerKey(jwt == null ? null : jwt.getSubject(), visitorId);
    }
}
