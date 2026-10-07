import { useCallback, useEffect, useState } from "react";
import { loadProfileAvatar } from "@/apis/profile_api";

export function useAvatar(authenticated: boolean, token?: string) {
  const [avatarUrl, setAvatarUrl] = useState<string>();
  const refreshAvatar = useCallback(async () => setAvatarUrl(await loadProfileAvatar()), []);
  useEffect(() => () => { if (avatarUrl) URL.revokeObjectURL(avatarUrl); }, [avatarUrl]);
  useEffect(() => {
    if (!authenticated || !token) { setAvatarUrl(undefined); return; }
    let active = true;
    loadProfileAvatar().then((url) => {
      if (active) setAvatarUrl(url);
      else if (url) URL.revokeObjectURL(url);
    }).catch((error: unknown) => console.error("Could not load profile avatar.", error));
    return () => { active = false; };
  }, [authenticated, token]);
  return { avatarUrl, refreshAvatar };
}
