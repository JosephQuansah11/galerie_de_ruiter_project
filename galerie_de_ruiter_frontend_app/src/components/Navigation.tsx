import { Dropdown, Nav, OverlayTrigger, Tooltip } from "react-bootstrap";
import Navbar from "react-bootstrap/Navbar";

import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, LibraryBig, Map, Plus, Tags, MessageCircle, ShoppingBag, Heart, SlidersHorizontal, UserRound, BookOpen } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getVisibleCategories } from "@/apis/backend_api";
import type { Category } from "@/models/antiques/Antique";
import { useLanguage } from "@/context/LanguageContext";
import { subscribeToContentUpdates } from "@/services/contentUpdates";

export function CustomNav() {
  const auth = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryError, setCategoryError] = useState(false);
  const [expanded, setExpanded] = useState(() => localStorage.getItem("galerie-nav-expanded") !== "false");

  useEffect(() => {
    let active = true;
    const loadCategories = () => {
      getVisibleCategories().then((visibleCategories) => {
        if (active) {
          setCategories(visibleCategories);
          setCategoryError(false);
        }
      }).catch(() => {
        if (active) setCategoryError(true);
      });
    };
    loadCategories();
    const unsubscribe = subscribeToContentUpdates("categories", loadCategories);
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);
  useEffect(() => {
    document.documentElement.style.setProperty("--nav-width", expanded ? "14rem" : "4.5rem");
  }, [expanded]);

  const navLinkList = [
    { href: "/wishlist", icon: Heart, title: t("wishlist") },
    { href: "/cart", icon: ShoppingBag, title: t("cart") },
    { href: "/dashboard/chat", icon: MessageCircle, title: t("navGalleryChat") },
    { href: "/about", icon: BookOpen, title: t("navAbout") },
  ];

  // const handleShowHelp = () => {
  //     // Trigger quick start guide
  //     const event = new CustomEvent('showQuickStartGuide');
  //     window.dispatchEvent(event);
  // };

  return (
    <Navbar
      id="Navbar"
      aria-label={t("navMain")}
      className={expanded ? "navbar-expanded" : "navbar-collapsed"}
      // d-flex flex-column justify-items-center align-items-center h-100
    >
      <div className="navbar-brand-div">
          <button className="navbar-toggle" type="button" aria-label={expanded ? t("navCollapse") : t("navExpand")} aria-expanded={expanded} aria-controls="main-navigation" onClick={() => { const next = !expanded; setExpanded(next); localStorage.setItem("galerie-nav-expanded", String(next)); }}>
          {expanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
        <NavLink
          to="/dashboard"
          // className="w-100 m-0 p-0 position-relative d-flex justify-content-center align-items-center"
        >
          <img
            src="/images/galerie_de_ruiter.png"
            alt="Galerie de Ruiter"
            className="navbar-logo"
          />
        </NavLink>
      </div>
      <Nav
        id="main-navigation"
      >
        <div className="icons-list">
          <div className="nav-category-dropdown">
            <OverlayTrigger placement="right" overlay={<Tooltip>{t("navAntiquesCategories")}</Tooltip>}>
              <NavLink to="/antiques" className="nav-item-link">
                <LibraryBig className="nav-icon" aria-hidden="true" />
                {expanded && <span>{t("antiques")}</span>}
              </NavLink>
            </OverlayTrigger>
            <div className="nav-category-submenu" aria-label={t("navAntiquesCategories")}>
              {categoryError && <span className="nav-category-error">{t("navCategoriesUnavailable")}</span>}
              {categories.map((category) => <div key={category.id}><NavLink to={`/antiques?category=${encodeURIComponent(category.name)}`}>{category.name}<span>{category.itemCount}</span></NavLink>{category.children.map((child) => <NavLink className="category-child" key={child.id} to={`/antiques?category=${encodeURIComponent(child.name)}`}>{child.name}<span>{child.itemCount}</span></NavLink>)}</div>)}
            </div>
          </div>
          {navLinkList.map((link) => (
            <OverlayTrigger
              key={"link" + link.title}
              placement="right"
              overlay={<Tooltip>{link.title}</Tooltip>}
            >
              <NavLink to={link.href} className="nav-item-link">
                <link.icon className="nav-icon" aria-hidden="true" />
                {expanded && <span>{link.title}</span>}
              </NavLink>
            </OverlayTrigger>
          ))}
          {auth.isAdmin && <OverlayTrigger placement="right" overlay={<Tooltip>{t("navAdminAntiques")}</Tooltip>}><NavLink to="/admin/antiques" className="nav-item-link"><LibraryBig className="nav-icon" />{expanded && <span>{t("navAdminAntiques")}</span>}</NavLink></OverlayTrigger>}
          {auth.isAdmin && <OverlayTrigger placement="right" overlay={<Tooltip>{t("navAddAntique")}</Tooltip>}><NavLink to="/admin/antiques/new" className="nav-item-link"><Plus className="nav-icon" />{expanded && <span>{t("navAddAntique")}</span>}</NavLink></OverlayTrigger>}
          {auth.isAdmin && <OverlayTrigger placement="right" overlay={<Tooltip>{t("categories")}</Tooltip>}><NavLink to="/admin/categories" className="nav-item-link"><Tags className="nav-icon" />{expanded && <span>{t("categories")}</span>}</NavLink></OverlayTrigger>}
          {!auth.isAdmin && <OverlayTrigger placement="right" overlay={<Tooltip>{t("location")}</Tooltip>}><NavLink to="/map" className="nav-item-link"><Map className="nav-icon" />{expanded && <span>{t("location")}</span>}</NavLink></OverlayTrigger>}
          {auth.isAdmin && <div className="nav-location-dropdown"><OverlayTrigger placement="right" overlay={<Tooltip>{t("navLocation")}</Tooltip>}><NavLink to="/map" className="nav-item-link"><Map className="nav-icon" />{expanded && <><span>{t("navLocation")}</span><ChevronDown className="nav-submenu-chevron" size={15} /></>}</NavLink></OverlayTrigger><div className="nav-admin-submenu"><NavLink to="/admin/location">{t("navEditLocation")}</NavLink></div></div>}
          {auth.isAdmin && <OverlayTrigger placement="right" overlay={<Tooltip>{t("navEditAbout")}</Tooltip>}><NavLink to="/admin/about" className="nav-item-link"><BookOpen className="nav-icon" />{expanded && <span>{t("navEditAbout")}</span>}</NavLink></OverlayTrigger>}
        </div>
      </Nav>
      {/* User Profile Section */}
      <div className="icons-list-user-profile">
        <NavLink
          to="/profile"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          <UserRound size={18} />
          {expanded && t("navProfile")}
        </NavLink>
        <NavLink
          to="/preferences"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          <SlidersHorizontal size={18} />
          {expanded && t("navSettings")}
        </NavLink>
         <Dropdown drop="up">
                            <Dropdown.Toggle
                                variant="link"
                                className="text-light p-0 border-0 shadow-none"
                                style={{ background: 'none' }}
                            >
                                <OverlayTrigger placement="top" overlay={<Tooltip>{t("navProfileMenu")}</Tooltip>}>
                                    <div className="d-flex flex-column align-items-center">
                                        <div
                                          className="rounded-circle bg-primary d-flex align-items-center justify-content-center mb-1"
                                          style={{ width: '40px', height: '40px' }}
                                        >
                                          <i className="bi bi-person-fill text-white fs-5"></i>
                                        </div>
                                        <small className="text-truncate" style={{ maxWidth: '60px', fontSize: '0.7rem' }}>
                                            {auth.profile?.username}
                                        </small>
                                    </div>
                                </OverlayTrigger>
                            </Dropdown.Toggle>

                            <Dropdown.Menu>
                                <Dropdown.Header>
                                    <div className="text-center">
                                        <strong>{auth.profile?.username}</strong>
                                        <br />
                                        <small className="text-muted">{auth.profile?.username}</small>
                                    </div>
                                </Dropdown.Header>
                                <Dropdown.Divider />
                                <Dropdown.Item onClick={() => navigate('/profile')}>
                                    <i className="bi bi-person me-2"></i>{" "}
                                    {t("navProfile")}
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => navigate('/preferences')}>
                                    <i className="bi bi-gear me-2"></i>{" "}
                                    {t("navSettings")}
                                </Dropdown.Item>
                                {/* <Dropdown.Item onClick={handleShowHelp}>
                                    <i className="bi bi-question-circle me-2"></i>
                                    Quick Start Guide
                                </Dropdown.Item> */}
                                <Dropdown.Divider />
                                <Dropdown.Item onClick={()=>{auth.logout()}} className="text-danger">
                                    <i className="bi bi-box-arrow-right me-2"></i>{" "}
                                    {t("navLogout")}
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
      </div>
    </Navbar>
  );
}
