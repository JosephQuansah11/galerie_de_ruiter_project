import { useEffect, useState } from "react";

export function useModelPreviewUrl(image?: File | string) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (typeof image === "string") {
      setUrl(image);
      return;
    }
    if (!image) {
      setUrl(undefined);
      return;
    }
    const nextUrl = URL.createObjectURL(image);
    setUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [image]);
  return url;
}
