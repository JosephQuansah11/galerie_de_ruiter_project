import { BookOpen, Heart, LibraryBig, Map, MapPin, MessageCircle, Plus, ShoppingBag, Tags } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Nav } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useEffect, useState } from "react";
import type { Category } from "@/models/antiques/Antique";
import { NavCategoryLinks } from "./NavCategoryLinks";
import { getVisibleCategories } from "@/apis/backend_api";
import { subscribeToContentUpdates } from "@/services/contentUpdates";

type LinkItem = { href: string; icon: LucideIcon; translationKey: string };

export function NavigationLinks({ onNavigate }: { onNavigate: () => void }) {
  const { t } = useLanguage();
  const { isAdmin } = useAuth();
    const [categories, setCategories] = useState<Category[]>([]);
    const [categoryError, setCategoryError] = useState(false);
  const publicLinks: LinkItem[] = [
    { href: "/wishlist", icon: Heart, translationKey: "wishlist" },
    { href: "/cart", icon: ShoppingBag, translationKey: "cart" },
    { href: "/dashboard/chat", icon: MessageCircle, translationKey: "navGalleryChat" },
    { href: "/about", icon: BookOpen, translationKey: "navAbout" },
  ];
  const adminLinks: LinkItem[] = isAdmin
    ? [
        { href: "/admin/antiques", icon: LibraryBig, translationKey: "navAdminAntiques" },
        { href: "/admin/antiques/new", icon: Plus, translationKey: "navAddAntique" },
        { href: "/admin/categories", icon: Tags, translationKey: "categories" },
        { href: "/admin/location", icon: MapPin, translationKey: "navEditLocation" },
        { href: "/admin/about", icon: BookOpen, translationKey: "navEditAbout" },
      ]
    : [{ href: "/map", icon: Map, translationKey: "location" }];

  useEffect(() => {
    let active = true;
    const load = () => getVisibleCategories().then((items) => {
      if (active) { setCategories(items); setCategoryError(false); }
    }).catch(() => { if (active) setCategoryError(true); });
    void load();
    const unsubscribe = subscribeToContentUpdates("categories", load);
    return () => { active = false; unsubscribe(); };
  }, []);

  return <div className="icons-list">
    <NavCategoryLinks categories={categories} hasError={categoryError} onNavigate={onNavigate} />
    {[...publicLinks, ...adminLinks].map((item) => <Nav.Link as={NavLink} key={item.href} to={item.href} className="nav-item-link" onClick={onNavigate}>
      <item.icon className="nav-icon" aria-hidden="true" /><span>{t(item.translationKey)}</span>
    </Nav.Link>)}
  </div>;
}
