import { useEffect, useMemo, useState } from "react";
import { Alert, Badge, Col, Form, Row, Spinner } from "react-bootstrap";
import { Heart, Search, ShoppingBag } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAntiqueContent } from "@/hooks/useAddAntiques";
import type Antique from "@/models/antiques/Antique";
import { resolveAntiqueImageUrl } from "@/models/antiques/Antique";
import { useShopping } from "@/context/ShoppingContext";
import { getVisibleCategories } from "@/apis/backend_api";
import type { Category } from "@/models/antiques/Antique";
import { useLanguage } from "@/context/LanguageContext";

function artistName(antique: Antique) {
  return antique.artist?.displayName ?? antique.artist?.name ?? "Galerie collection";
}

function priceLabel(price: number | null | undefined, priceText: string) {
  return price == null ? priceText : `EUR ${price.toLocaleString("en-BE", { minimumFractionDigits: 2 })}`;
}

export default function AntiquesPage() {
  const { antiques, loading, error } = useAntiqueContent();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToCart, toggleWishlist, isWishlisted } = useShopping();
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(() => searchParams.get("category") ?? "All pieces");
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    getVisibleCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => { setCategory(searchParams.get("category") ?? "All pieces"); }, [searchParams]);

  const filteredAntiques = useMemo(() => {
    const antiqueList = Array.isArray(antiques) ? antiques : [];
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery && category === "All pieces") return antiqueList;
    return antiqueList.filter((antique) =>
      [antique.title, antique.description, artistName(antique), antique.category]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedQuery)) &&
      (category === "All pieces" || antique.category?.toLowerCase() === category.toLowerCase()),
    );
  }, [antiques, query, category]);

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
          < span > pieces listed </span>
            </div>
            </div>

            <Form className = "catalogue-search" role = "search" >
              <Search size={ 18 } aria-hidden="true" />
                <Form.Control  aria-label="Search antiques" value = { query } onChange = {(event) => setQuery(event.target.value)} placeholder = { t("searchPlaceholder") } />

                        <div className = "category-tabs" aria-label="Collection categories" >
                            <button className={ `btn btn-sm ${category === "All pieces" ? "btn-dark" : "btn-outline-secondary"}` } type = "button" onClick = {() => setCategory("All pieces")} >
                            { t("allPieces") }
                            </button>
                            {
                                categories.map((item) => (
                                  <button key= { item.id } className = {`btn btn-sm ${category === item.name ? "btn-dark" : "btn-outline-secondary"}`} type = "button" onClick = {() => setCategory(item.name)} >
                                      { item.name } 
                                      <span className = "category-count" > { item.itemCount } </span>
                                  </button>
                                    )
                                  )
                            }
                        </div>

                          { loading && <div className="catalogue-state" > <Spinner animation="border" size = "sm" /> { t("loadingCollection") } </div> }
                          { error && <Alert variant="danger" > The collection could not be loaded.Please try again.</Alert> }
                          {
                            !loading && !error && filteredAntiques.length === 0 && (
                              <div className="catalogue-state" > <ShoppingBag size={ 28 } /><span>{query ? "No pieces match that search." : "The collection is waiting for its next arrival."}</span > </div>
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
                                        <span className="catalogue-artist" > { artistName(antique) } </span>
                                          < h2 > { antique.title } </h2>
                                          < p > { antique.description || t("storyWaiting") } </p>
                                          < div className = "catalogue-card-footer" > 
                                              <strong>{ priceLabel(antique.price, t("priceOnRequest")) } </strong>
                                              <div className="catalogue-card-actions">
                                                    <button className="btn btn-sm btn-outline-dark" type="button" onClick={(event) => { event.stopPropagation(); addToCart(antique); }}>
                                                        <ShoppingBag size={15} / > { t("add") } 
                                                    </button>
                                                    <button className="btn btn-sm btn-link" type="button" aria-label={`Save ${antique.title}`} onClick={(event) => { event.stopPropagation(); toggleWishlist(antique); }}>
                                                          <Heart size={18} fill={isWishlisted(antique.id) ? "currentColor" : "none"} / > 
                                                    </button>
                                                    
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