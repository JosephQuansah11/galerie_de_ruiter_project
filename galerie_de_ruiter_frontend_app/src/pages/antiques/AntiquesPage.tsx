import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { useAntiqueContent } from "@/hooks/useAddAntiques";
import { useCatalogueCategories } from "./useCatalogueCategories";
import { matchesAntiqueQuery } from "./matchesAntiqueQuery";
import { CataloguePage } from "./CataloguePage";

export default function AntiquesPage() {
  const { antiques, loading, error } = useAntiqueContent();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const categoryState = useCatalogueCategories(searchParams.get("category") ?? "");
  const selectedCategory = categoryState.category;
  const filteredAntiques = useMemo(
    () => antiques.filter((antique) => matchesAntiqueQuery(antique, query, selectedCategory, t("allPieces"), t("galerieCollection"))),
    [antiques, query, selectedCategory, t],
  );
  return <CataloguePage
    antiques={antiques}
    filteredAntiques={filteredAntiques}
    loading={loading}
    error={Boolean(error)}
    query={query}
    onQueryChange={setQuery}
    {...categoryState}
  />;
}
