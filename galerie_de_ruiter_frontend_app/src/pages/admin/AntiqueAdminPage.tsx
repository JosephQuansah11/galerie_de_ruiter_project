import { useEffect, useState } from "react";
import { Alert, Button, Spinner } from "react-bootstrap";
import { Image, Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getAllAntiques } from "@/apis/backend_api";
import type Antique from "@/models/antiques/Antique";
import { suggestedAntiques } from "@/data/suggestedAntiques";

export default function AntiqueAdminPage() {
  const navigate = useNavigate();
  const [antiques, setAntiques] = useState<Antique[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => { getAllAntiques().then(setAntiques).catch(() => undefined).finally(() => setLoading(false)); }, []);
  const filtered = antiques.filter((antique) => antique.title.toLowerCase().includes(query.toLowerCase()));
  return <section className="admin-page"><div className="shopping-heading"><div><span className="catalogue-artist">ADMINISTRATION</span><h1>Antique inventory</h1></div><Button onClick={() => navigate("/admin/antiques/new")}><Plus size={16} /> Add antique</Button></div><div className="inventory-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search inventory" aria-label="Search inventory" /></div>{loading && <div className="catalogue-state"><Spinner animation="border" size="sm" /> Loading inventory...</div>}{!loading && filtered.length === 0 && <Alert variant="light">No antiques found.</Alert>}<div className="inventory-list">{filtered.map((antique) => <button className="inventory-row" key={antique.id} type="button" onClick={() => navigate(`/antiques/${antique.id}`)}>{antique.imageUrl ? <img src={antique.imageUrl} alt="" /> : <span className="inventory-placeholder"><Image size={20} /></span>}<span><strong>{antique.title}</strong><small>{antique.category ?? "Uncategorized"} · {antique.price == null ? "Price on request" : `EUR ${antique.price.toFixed(2)}`}</small></span></button>)}</div><div className="reference-heading"><div><span className="catalogue-artist">REFERENCE SHORTLIST</span><h2>Pieces to add next</h2></div><span>Images are visual references for six-view capture.</span></div><div className="reference-grid">{suggestedAntiques.map((item) => <article className="reference-card" key={item.title}><img src={item.imageUrl} alt={item.title} loading="lazy" /><div className="reference-card-body"><strong>{item.title}</strong><span>{item.category}</span><p>{item.modellingNote}</p><Button size="sm" variant="outline-dark" onClick={() => navigate("/admin/antiques/new")}>Use as reference</Button></div></article>)}</div></section>;
}