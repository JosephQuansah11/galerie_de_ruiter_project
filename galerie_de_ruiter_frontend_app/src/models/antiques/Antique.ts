type Antique = {
  id: string;
  title: string;
  category?: string | null;
  modelUrl?: string | null;
  imageUrls?: string[];
  imageUrl?: string | null;
  sixViewImages?: { position: string; url: string }[];
  artist?: {
    id?: string;
    name?: string;
    displayName?: string;
  } | null;
  description?: string | null;
  price?: number | null;
};

export type Category = {
  id: string;
  name: string;
  visible: boolean;
  parentId?: string | null;
  itemCount: number;
  children: Category[];
};

export type Designer = {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
};

export type AntiqueForm = {
  title: string;
  artistId: string;
  description: string;
  price: number;
  categoryId?: string;
  imageUrl?: string;
  modelUrl?: string;
};

// imageUrl from the backend is relative (e.g. /api/antiques/{id}/image); resolve it against the API origin.
export const resolveAntiqueImageUrl = (imageUrl?: string | null): string | undefined => {
  if (!imageUrl) return undefined;
  const backendBaseURL = import.meta.env.VITE_JAVA_BACKEND_URL ?? "http://localhost:8080";
  return `${backendBaseURL}${imageUrl}`;
};

export const initialAntiqueForm: AntiqueForm = {
  title: "",
  artistId: "",
  description: "",
  price: 0.0,
};

export default Antique;
