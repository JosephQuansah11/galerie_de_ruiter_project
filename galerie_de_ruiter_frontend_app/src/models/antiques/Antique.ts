type Antique = {
  id: string;
  title: string;
  category?: string | null;
  modelUrl?: string | null;
  imageUrl?: string | null;
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

export type AntiqueForm = {
  title: string;
  artistId: string;
  description: string;
  price: number;
  categoryId?: string;
  imageUrl?: string;
  modelUrl?: string;
};

export const initialAntiqueForm: AntiqueForm = {
  title: "",
  artistId: "",
  description: "",
  price: 0.0,
};

export default Antique;
