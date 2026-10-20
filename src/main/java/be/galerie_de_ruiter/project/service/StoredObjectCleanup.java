package be.galerie_de_ruiter.project.service;

import java.util.Collection;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * Deletes bucket objects only after the database transaction that removed their rows commits.
 *
 * <p>A delete that removes the row first and then fails on the object leaves an unreferenced object
 * (storage cost, no broken page). The opposite order could remove a photograph while the row still
 * points at it if the transaction rolled back, which is the failure that matters. There is no
 * transaction in a few maintenance paths; those clean up immediately.</p>
 */
public final class StoredObjectCleanup {
    private StoredObjectCleanup() {
    }

    public static void afterCommit(ImageStorage storage, Collection<String> keys) {
        if (keys == null || keys.isEmpty() || !storage.isEnabled()) return;
        Runnable remove = () -> storage.deleteAllQuietly(keys);
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    remove.run();
                }
            });
        } else {
            remove.run();
        }
    }
}
