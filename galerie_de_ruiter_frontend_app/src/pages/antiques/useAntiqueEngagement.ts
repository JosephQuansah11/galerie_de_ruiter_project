import { useCallback, useEffect, useRef, useState } from "react";
import type Antique from "@/models/antiques/Antique";
import { registerAntiqueView, setAntiqueLike } from "@/apis/backend_api";

/**
 * Public interest in the antique a visitor is looking at: how many people have seen it and
 * how many liked it, plus whether this visitor already liked it.
 *
 * <p>The view is registered once per antique for the session, so moving between pieces and
 * coming back does not count the same person twice.</p>
 */
export function useAntiqueEngagement(antique?: Antique) {
  const [viewCount, setViewCount] = useState(antique?.viewCount ?? 0);
  const [likeCount, setLikeCount] = useState(antique?.likeCount ?? 0);
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);
  const viewed = useRef(new Set<string>());

  useEffect(() => {
    if (!antique) return;
    setViewCount(antique.viewCount ?? 0);
    setLikeCount(antique.likeCount ?? 0);
    if (viewed.current.has(antique.id)) return;
    viewed.current.add(antique.id);
    registerAntiqueView(antique.id)
      .then((engagement) => {
        setViewCount(engagement.viewCount);
        setLikeCount(engagement.likeCount);
        setLiked(engagement.liked);
      })
      // A counter that cannot be recorded must never break the page.
      .catch(() => undefined);
  }, [antique]);

  const toggleLike = useCallback(async () => {
    if (!antique || busy) return;
    setBusy(true);
    try {
      const engagement = await setAntiqueLike(antique.id, !liked);
      setLiked(engagement.liked);
      setLikeCount(engagement.likeCount);
      setViewCount(engagement.viewCount);
    } catch {
      // Keep the numbers exactly as the gallery last reported them.
    } finally {
      setBusy(false);
    }
  }, [antique, busy, liked]);

  return { viewCount, likeCount, liked, busy, toggleLike };
}
