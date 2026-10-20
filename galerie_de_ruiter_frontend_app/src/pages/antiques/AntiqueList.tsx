import type { RefObject } from "react";
import type Antique from "@/models/antiques/Antique";
import { AntiqueRow } from "./AntiqueRow";

/** The catalogue as a vertical list of compact rows rather than a wall of grid tiles. */
export function AntiqueList({ antiques, listRef }: {
  antiques: Antique[];
  /** The list itself, so a shortcut can bring its last row into view. */
  listRef?: RefObject<HTMLDivElement | null>;
}) {
  return <div className="catalogue-list" ref={listRef}>
    {antiques.map((antique) => <AntiqueRow key={antique.id} antique={antique} />)}
  </div>;
}
