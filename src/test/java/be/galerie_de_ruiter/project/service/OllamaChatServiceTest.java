package be.galerie_de_ruiter.project.service;

import static org.assertj.core.api.Assertions.assertThat;

import be.galerie_de_ruiter.project.domain.Category;
import be.galerie_de_ruiter.project.dto.ChatConnectionStatus;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class OllamaChatServiceTest {
    private static final String MODEL = "llama3.2:3b";
    @Test
    void categoryContextIncludesExactVisibleCountAndNamesOnly() {
        Category antiques = new Category("Antiques", null, true);
        Category art = new Category("Art", null, true);
        Category hidden = new Category("Internal", null, false);

        assertThat(OllamaChatService.describeCategories(List.of(antiques, art, hidden)))
                .isEqualTo("There are 2 visible categories: Antiques, Art.");
    }

    @Test
    void categoryContextReportsWhenNoVisibleCategoriesExist() {
        assertThat(OllamaChatService.describeCategories(List.of(new Category("Hidden", null, false))))
                .isEqualTo("There are 0 visible categories.");
    }

    @Test
    void downloadTextReportsPercentageAndFallsBackWithoutASize() {
        assertThat(OllamaChatService.downloadProgress(MODEL, "downloading", 42, 100))
                .isEqualTo("Downloading the gallery assistant model 'llama3.2:3b' (42%): downloading.");
        assertThat(OllamaChatService.downloadProgress(MODEL, "pulling manifest", 0, 0))
                .isEqualTo("Downloading the gallery assistant model 'llama3.2:3b': pulling manifest.");
        assertThat(OllamaChatService.downloadProgress(MODEL, "", 0, 0))
                .isEqualTo("Downloading the gallery assistant model 'llama3.2:3b': starting.");
    }

    @Test
    void failedDownloadTextNamesTheModelAndReason() {
        assertThat(OllamaChatService.downloadFailure(MODEL, "the model service answered with status 500"))
                .contains("'llama3.2:3b'", "status 500", "retried automatically");
    }

    /** A fresh installation has no model, so the first status call has to install it once. */
    @Test
    void installsTheConfiguredModelOnceAndKeepsUsingItForTheSession() throws Exception {
        AtomicInteger downloads = new AtomicInteger();
        AtomicReference<String> installed = new AtomicReference<>();
        List<String> generateBodies = new CopyOnWriteArrayList<>();
        HttpServer ollama = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        // The streaming download keeps a worker busy, so status polls need their own thread.
        ExecutorService workers = Executors.newCachedThreadPool();
        ollama.setExecutor(workers);
        ollama.createContext("/api/tags", exchange -> respond(exchange, installed.get() == null
                ? "{\"models\":[]}" : "{\"models\":[{\"name\":\"%s\"}]}".formatted(installed.get())));
        ollama.createContext("/api/pull", exchange -> streamPull(exchange, downloads, installed));
        ollama.createContext("/api/generate", exchange -> {
            generateBodies.add(readBody(exchange));
            respond(exchange, "{\"done\":true}");
        });
        ollama.start();

        try {
            OllamaChatService service = serviceFor(ollama, true);
            ChatConnectionStatus first = service.connectionStatus();
            assertThat(first.ready()).isFalse();
            assertThat(first.model()).isEqualTo(MODEL);
            assertThat(first.detail()).contains("Downloading the gallery assistant model '%s'".formatted(MODEL));

            // The chat page polls every few seconds; the download must not be started twice.
            List<String> observed = new ArrayList<>();
            ChatConnectionStatus status = first;
            Instant deadline = Instant.now().plus(Duration.ofSeconds(15));
            while (!status.ready() && Instant.now().isBefore(deadline)) {
                Thread.sleep(120);
                status = service.connectionStatus();
                if (status.detail() != null) observed.add(status.detail());
            }

            assertThat(observed).anyMatch(detail -> detail.contains("(50%)"));
            assertThat(status.ready()).isTrue();
            assertThat(downloads).hasValue(1);

            // The session then talks to that same pinned model, kept resident by keep_alive.
            ChatConnectionStatus warmed = service.warmUp();
            assertThat(warmed.ready()).isTrue();
            assertThat(warmed.model()).isEqualTo(MODEL);
            assertThat(generateBodies).isNotEmpty();
            assertThat(generateBodies).allSatisfy(body -> assertThat(body)
                    .contains("\"model\":\"%s\"".formatted(MODEL), "\"keep_alive\":\"30m\""));
            assertThat(generateBodies.get(generateBodies.size() - 1)).contains("\"prompt\":\"\"");
        } finally {
            ollama.stop(0);
            workers.shutdownNow();
        }
    }

    @Test
    void reportsTheMissingModelWhenTheDownloadIsDisabled() throws Exception {
        HttpServer ollama = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        ollama.createContext("/api/tags", exchange -> respond(exchange, "{\"models\":[]}"));
        ollama.start();
        try {
            ChatConnectionStatus status = serviceFor(ollama, false).connectionStatus();
            assertThat(status.ready()).isFalse();
            assertThat(status.detail()).isEqualTo(
                    "The gallery assistant model '%s' is not loaded yet. Please try again in a moment.".formatted(MODEL));
        } finally {
            ollama.stop(0);
        }
    }

    private static OllamaChatService serviceFor(HttpServer ollama, boolean autoPull) {
        OllamaChatService service = new OllamaChatService(null, null);
        ReflectionTestUtils.setField(service, "ollamaUrl", "http://127.0.0.1:" + ollama.getAddress().getPort());
        ReflectionTestUtils.setField(service, "model", MODEL);
        ReflectionTestUtils.setField(service, "keepAlive", "30m");
        ReflectionTestUtils.setField(service, "autoPull", autoPull);
        ReflectionTestUtils.setField(service, "pullRetry", Duration.ofSeconds(5));
        ReflectionTestUtils.setField(service, "pullTimeout", Duration.ofSeconds(30));
        ReflectionTestUtils.setField(service, "touchInterval", Duration.ofMinutes(10));
        return service;
    }

    /** Streams download progress the way Ollama does, then marks the model as installed. */
    private static void streamPull(HttpExchange exchange, AtomicInteger downloads,
            AtomicReference<String> installed) throws IOException {
        downloads.incrementAndGet();
        readBody(exchange);
        exchange.getResponseHeaders().add("Content-Type", "application/x-ndjson");
        exchange.sendResponseHeaders(200, 0);
        try (OutputStream out = exchange.getResponseBody()) {
            write(out, "{\"status\":\"pulling manifest\"}\n");
            pause(150);
            write(out, "{\"status\":\"downloading\",\"completed\":50,\"total\":100}\n");
            pause(400);
            installed.set(MODEL);
            write(out, "{\"status\":\"success\"}\n");
        }
    }

    private static void write(OutputStream out, String line) throws IOException {
        out.write(line.getBytes(StandardCharsets.UTF_8));
        out.flush();
    }

    private static void pause(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
        }
    }

    private static void respond(HttpExchange exchange, String json) throws IOException {
        readBody(exchange);
        byte[] payload = json.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().add("Content-Type", "application/json");
        exchange.sendResponseHeaders(200, payload.length);
        try (OutputStream out = exchange.getResponseBody()) {
            out.write(payload);
        }
    }

    private static String readBody(HttpExchange exchange) {
        try (InputStream input = exchange.getRequestBody();
                ByteArrayOutputStream buffer = new ByteArrayOutputStream()) {
            input.transferTo(buffer);
            return buffer.toString(StandardCharsets.UTF_8);
        } catch (IOException ignored) {
            return "";
        }
    }
}
