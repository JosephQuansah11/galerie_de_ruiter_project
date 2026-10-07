import { useEffect, useMemo, useState } from "react";
import { Alert, Badge, Col, Dropdown, Form, Row, Spinner } from "react-bootstrap";
import { Button } from "@/components/ReactButton";
import { Heart, Search, ShoppingBag } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAntiqueContent } from "@/hooks/useAddAntiques";
import type Antique from "@/models/antiques/Antique";
import { resolveAntiqueImageUrl } from "@/models/antiques/Antique";
import { useShopping } from "@/context/ShoppingContext";
import { getVisibleCategories } from "@/apis/backend_api";
import type { Category } from "@/models/antiques/Antique";
import { useLanguage } from "@/context/LanguageContext";
import { formatEuroAmount } from "@/i18n";

function artistName(antique: Antique, fallback: string) {
  return antique.artist?.displayName ?? antique.artist?.name ?? fallback;
}

function priceLabel(price: number | null | undefined, priceText: string, locale: string) {
  return price == null ? priceText : formatEuroAmount(price, locale);
}

export default function AntiquesPage() {
  const { antiques, loading, error } = useAntiqueContent();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToCart, toggleWishlist, isWishlisted } = useShopping();
  const { t, locale } = useLanguage();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(() => searchParams.get("category") ?? "");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState(false);

  useEffect(() => {
    let active = true;
    getVisibleCategories()
      .then((visibleCategories) => {
        if (active) setCategories(visibleCategories);
      })
      .catch(() => {
        if (active) setCategoriesError(true);
      })
      .finally(() => {
        if (active) setCategoriesLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  const allPiecesCategory = t("allPieces");
  useEffect(() => { setCategory(searchParams.get("category") ?? ""); }, [searchParams]);

  const filteredAntiques = useMemo(() => {
    const antiqueList = Array.isArray(antiques) ? antiques : [];
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery && (!category || category === allPiecesCategory)) return antiqueList;
    return antiqueList.filter((antique) =>
      [antique.title, antique.description, artistName(antique, t("galerieCollection")), antique.category]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedQuery)) &&
      ((!category || category === allPiecesCategory) || antique.category?.toLowerCase() === category.toLowerCase()),
    );
  }, [antiques, query, category, allPiecesCategory]);

  return (
    <section className= "catalogue-page" >
    <div className="catalogue-heading" >
      <div>
      <Badge bg="dark" className = "catalogue-kicker" > { t("collection") } </Badge>
        < h1 > { t("collectionTitle") } </h1>
        < p > { t("collectionIntro") } </p>
        </div>
        < div className = "catalogue-count" >
          <strong>{ Array.isArray(antiques) ? antiques.length : 0 } </strong>
          < span > {t("piecesListed")} </span>
            </div>
            </div>

            <Form className = "catalogue-search" role = "search" >
              <Search size={ 18 } aria-hidden="true" />
                <Form.Control  aria-label={t("searchAntiques")} value = { query } onChange = {(event) => setQuery(event.target.value)} placeholder = { t("searchPlaceholder") } />

                        <Dropdown className="collection-filter-dropdown">
                          <Dropdown.Toggle variant="outline-secondary" type="button">
                            {category || t("allPieces")}
                          </Dropdown.Toggle>
                          <Dropdown.Menu className="collection-dropdown-menu">
                            <Dropdown.Item
                              as="button"
                              type="button"
                              onClick={() => setCategory("")}
                            >
                              {t("allPieces")}
                            </Dropdown.Item>
                            <div className="collection-dropdown-grid">
                              {categories.map((item) => (
                                <div className="collection-dropdown-group" key={item.id}>
                                  <Dropdown.Item
                                    as="button"
                                    type="button"
                                    onClick={() => setCategory(item.name)}
                                  >
                                    {item.name}
                                    <span>{item.itemCount}</span>
                                  </Dropdown.Item>
                                  {item.children?.map((child) => (
                                    <Dropdown.Item
                                      as="button"
                                      className="collection-dropdown-child"
                                      key={child.id}
                                      type="button"
                                      onClick={() => setCategory(child.name)}
                                    >
                                      {child.name}
                                      <span>{child.itemCount}</span>
                                    </Dropdown.Item>
                                  ))}
                                </div>
                              ))}
                            </div>
                          </Dropdown.Menu>
                        </Dropdown>

                          { categoriesLoading && <div className="catalogue-state" ><Spinner animation="border" size = "sm" /> { t("loadingCategories") }</div> }
                          { categoriesError && <Alert variant="danger" > {t("categoriesLoadError")}</Alert> }
                          { loading && <div className="catalogue-state" > <Spinner animation="border" size = "sm" /> { t("loadingCollection") } </div> }
                          { error && <Alert variant="danger" > {t("collectionLoadError")}</Alert> }
                          {
                            !loading && !error && filteredAntiques.length === 0 && (
                              <div className="catalogue-state" > <ShoppingBag size={ 28 } /><span>{query ? t("noPiecesMatch") : t("collectionWaiting")}</span > </div>
                                )
                          }
                          <Row xs={ 1 } md = { 2} xl = { 3} className = "g-4" >
                          {
                            filteredAntiques.map((antique) => (
                                <Col key= { antique.id } >
                                  <article className="catalogue-card" onClick = {() => navigate(`/antiques/${antique.id}`)} >
                                    <div className="catalogue-card-image" aria-hidden="true" > 
                                        {(antique.imageUrl ?? antique.imageUrls?.[0]) ? <img src={ resolveAntiqueImageUrl(antique.imageUrl ?? antique.imageUrls?.[0]) } alt = "" /> : antique.title.slice(0, 1).toUpperCase()} 
                                    </div>
                                      < div className = "catalogue-card-content" >
                                        <span className="catalogue-artist" > { artistName(antique, t("galerieCollection")) } </span>
                                          < h2 > { antique.title } </h2>
                                          < p > { antique.description || t("storyWaiting") } </p>
                                          < div className = "catalogue-card-footer" > 
                                              <strong>{ priceLabel(antique.price, t("priceOnRequest"), locale) } </strong>
                                              <div className="catalogue-card-actions">
                                                    <Button as="button" className="btn btn-sm btn-outline-dark" type="button" onClick={(event) => { event.stopPropagation(); addToCart(antique); }}>
                                                        <ShoppingBag size={15} / > { t("add") } 
                                                    </Button>
                                                    <Button as="button" className="btn btn-sm btn-link" type="button" aria-label={t("savePieceNamed", { title: antique.title })} onClick={(event) => { event.stopPropagation(); toggleWishlist(antique); }}>
                                                          <Heart size={18} fill={isWishlisted(antique.id) ? "currentColor" : "none"} / > 
                                                    </Button>
                                                    
                                              </div > 
                                            </div>
                                      </div>
                                  </article>
                                </Col>
                              )
                              )
                          }
                          </Row>
                          </Form>
  </section>
  );
}