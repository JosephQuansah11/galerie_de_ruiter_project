package be.galerie_de_ruiter.project.controller;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.CacheControl;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * The API origin's root page, used only to prove ownership to Google Search Console.
 *
 * <p>The photographs are served from this host, so Google's image-sitemap rules require this
 * origin to be verified as well as the gallery's page origin. A verification meta tag can only
 * live in an HTML document, not in a JSON or image response, so this small page is served at the
 * root. It contains no API data and does not change any endpoint.</p>
 */
@RestController
public class GoogleSiteVerificationController {
    /** The value Search Console generated for the galerie-java-api.onrender.com property. */
    static final String GOOGLE_SITE_VERIFICATION = "4DSPCH0_ZlHK4Orgjd4FfaHoE2n6_hLvsNR_RQx3-LE";

    @GetMapping(value = { "/", "/index.html" }, produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> verificationPage() {
        String html = """
                <!doctype html>
                <html lang="nl">
                  <head>
                    <meta charset="utf-8">
                    <meta name="google-site-verification" content="%s">
                    <title>Galerie de Ruiter API</title>
                  </head>
                  <body>
                    <p>Galerie de Ruiter API</p>
                  </body>
                </html>
                """.formatted(GOOGLE_SITE_VERIFICATION);
        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_HTML)
                .cacheControl(CacheControl.noStore())
                .body(html);
    }
}
