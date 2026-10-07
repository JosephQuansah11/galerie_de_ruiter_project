export const resolveAntiqueImageUrl = (imageUrl?: string | null): string | undefined => {
  if (!imageUrl) return undefined;
  const backendBaseURL = import.meta.env.VITE_JAVA_BACKEND_URL ?? "http://localhost:8080";
  return `${backendBaseURL}${imageUrl}`;
};
