package be.galerie_de_ruiter.project.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class AntiqueEngagementServiceTest {
    @Test
    void signedInVisitorIsIdentifiedByTheirKeycloakSubject() {
        assertThat(AntiqueEngagementService.viewerKey(" 3f0a2c1e-1c2b-4a5d-9e6f-7a8b9c0d1e2f ", "browser-id"))
                .isEqualTo("user:3f0a2c1e-1c2b-4a5d-9e6f-7a8b9c0d1e2f");
    }

    @Test
    void anonymousVisitorIsIdentifiedByTheIdTheirBrowserKeeps() {
        assertThat(AntiqueEngagementService.viewerKey(null, "guest-42")).isEqualTo("guest:guest-42");
        assertThat(AntiqueEngagementService.viewerKey("", "guest-42")).isEqualTo("guest:guest-42");
    }

    @Test
    void untrustedBrowserIdIsReducedToASafeBoundedKey() {
        assertThat(AntiqueEngagementService.viewerKey(null, "a'; drop table antiques; --"))
                .isEqualTo("guest:adroptableantiques--");
        assertThat(AntiqueEngagementService.viewerKey(null, "x".repeat(200)))
                .isEqualTo("guest:" + "x".repeat(64));
    }

    @Test
    void visitorWithoutAnyUsableIdentityIsNotCounted() {
        assertThat(AntiqueEngagementService.viewerKey(null, null)).isNull();
        assertThat(AntiqueEngagementService.viewerKey("   ", "!!!")).isNull();
    }
}
