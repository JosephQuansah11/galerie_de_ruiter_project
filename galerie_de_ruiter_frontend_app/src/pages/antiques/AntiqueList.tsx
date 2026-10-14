import type Antique from "@/models/antiques/Antique";
import { AntiqueRow } from "./AntiqueRow";

/** The catalogue as a vertical list of compact rows rather than a wall of grid tiles. */
export function AntiqueList({ antiques }: { antiques: Antique[] }) {
  return <div className="catalogue-list">
    {antiques.map((antique) => <AntiqueRow key={antique.id} antique={antique} />)}
  </div>;
}
