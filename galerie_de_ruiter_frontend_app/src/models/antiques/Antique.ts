type Antique = {
  id: number;
  keycloakId: string;
  title: string;
  artistId: string;
  description: string;
  price: number;
};

export type AntiqueForm = {
  keycloakId: string;
  title: string;
  artistId: string;
  description: string;
  price: number;
};

export const initialAntiqueForm: AntiqueForm = {
  keycloakId: "",
  title: "",
  artistId: "",
  description: "",
  price: 0.0,
};

export default Antique;
