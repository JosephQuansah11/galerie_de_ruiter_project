import { useEffect, type Dispatch, type SetStateAction } from "react";

/**
 * Marks the app ready once the session is known.
 *
 * <p>The token already carries the visitor's name, address and roles, so a page load no longer asks
 * `/api/me` who this is. That request used to run on every load, and a slow or restarting API then
 * filled the console with failures for information the token had already provided. The profile page
 * reads the row when it actually needs it (see `refreshProfile`).</p>
 */
export function useAuthInitialization({ setLoading }: {
  setLoading: Dispatch<SetStateAction<boolean>>;
}) {
  useEffect(() => {
    setLoading(false);
  }, [setLoading]);
}
