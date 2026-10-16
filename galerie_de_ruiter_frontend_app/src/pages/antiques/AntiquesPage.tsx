import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useAntiqueContent } from "@/hooks/useAddAntiques";
import { useCatalogueCategories } from "./useCatalogueCategories";
import { matchesAntiqueQuery } from "./matchesAntiqueQuery";
import { CataloguePage } from "./CataloguePage";

export default function AntiquesPage() {
  const { antiques, loading, error } = useAntiqueContent();
  // The list is open to everyone; what an account buys is the rest of it (see CataloguePage).
  const { authenticated, loading: checkingSession } = useAuth();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const categoryState = useCatalogueCategories(searchParams.get("category") ?? "");
  const selectedCategory = categoryState.category;
  // The search box and the category filter keep the same URL shape, so the filtered views all
  // point back at the catalogue itself.
  usePageMeta({ title: t("metaCatalogueTitle"), description: t("metaCatalogueDescription"), canonicalPath: "/antiques" });
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
    signedIn={authenticated}
    checkingSession={checkingSession}
    {...categoryState}
  />;
}
