package be.galerie_de_ruiter.project.service;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import org.junit.jupiter.api.Test;

class StoredObjectCleanupTest {
    @Test
    void removesObjectsWhenThereIsNoTransactionToWaitFor() {
        ImageStorage storage = mock(ImageStorage.class);
        when(storage.isEnabled()).thenReturn(true);

        StoredObjectCleanup.afterCommit(storage, List.of("antiques/one/a.webp", "antiques/two/b.webp"));

        verify(storage).deleteAllQuietly(List.of("antiques/one/a.webp", "antiques/two/b.webp"));
    }

    @Test
    void doesNothingWhenStorageIsNotConfigured() {
        ImageStorage storage = mock(ImageStorage.class);
        when(storage.isEnabled()).thenReturn(false);

        StoredObjectCleanup.afterCommit(storage, List.of("antiques/one/a.webp"));

        verify(storage, org.mockito.Mockito.never()).deleteAllQuietly(org.mockito.ArgumentMatchers.anyCollection());
    }
}
