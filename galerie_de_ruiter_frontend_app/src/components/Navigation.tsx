import { Dropdown, Nav, OverlayTrigger, Tooltip } from "react-bootstrap";
import Navbar from "react-bootstrap/Navbar";

import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, LibraryBig, Map, Menu, MessageCircle, Settings, ShoppingBag, Heart, SlidersHorizontal, UserRound, BookOpen } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getVisibleCategories } from "@/apis/backend_api";
import type { Category } from "@/models/antiques/Antique";
import { useLanguage } from "@/context/LanguageContext";

export function CustomNav() {
  const auth = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [expanded, setExpanded] = useState(() => localStorage.getItem("galerie-nav-expanded") !== "false");

  useEffect(() => { getVisibleCategories().then(setCategories).catch(() => setCategories([])); }, []);
  useEffect(() => {
    document.documentElement.style.setProperty("--nav-width", expanded ? "14rem" : "4.5rem");
  }, [expanded]);

  const navLinkList = [
    { href: "/profile", icon: CalendarDays, title: t("profile") },
    { href: "/preferences", icon: Settings, title: t("settings") },
    { href: "/wishlist", icon: Heart, title: t("wishlist") },
    { href: "/cart", icon: ShoppingBag, title: t("cart") },
    { href: "/dashboard/chat", icon: MessageCircle, title: "Gallery chat" },
    { href: "/about", icon: BookOpen, title: "About the gallery" },
  ];

  // const handleShowHelp = () => {
  //     // Trigger quick start guide
  //     const event = new CustomEvent('showQuickStartGuide');
  //     window.dispatchEvent(event);
  // };

  return (
    <Navbar
      id="Navbar"
      className={expanded ? "navbar-expanded" : "navbar-collapsed"}
      // d-flex flex-column justify-items-center align-items-center h-100
    >
      <div className="navbar-brand-div">
        <button className="navbar-toggle" type="button" aria-label={expanded ? "Collapse navigation" : "Expand navigation"} onClick={() => { const next = !expanded; setExpanded(next); localStorage.setItem("galerie-nav-expanded", String(next)); }}>
          {expanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
        <NavLink
          to="/dashboard"
          // className="w-100 m-0 p-0 position-relative d-flex justify-content-center align-items-center"
        >
          <img
            src="/images/galerie_de_ruiter.png"
            alt="My Icon"
            width="60%"
            style={{ borderRadius: "20%" }}
          />
        </NavLink>
      </div>
      <Nav
      // className="d-flex flex-column justify-content-between h-100"
      >
        <div className="icons-list">
          <div className="nav-category-dropdown">
            <OverlayTrigger placement="right" overlay={<Tooltip>Antiques and categories</Tooltip>}>
              <NavLink to="/antiques" className="nav-item-link">
                <LibraryBig className="nav-icon" aria-hidden="true" />
                {expanded && <span>{t("antiques")}</span>}
              </NavLink>
            </OverlayTrigger>
            <div className="nav-category-submenu" aria-label="Antique categories">
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
          {auth.isAdmin && <OverlayTrigger placement="right" overlay={<Tooltip>Admin: antiques</Tooltip>}><NavLink to="/admin/antiques" className="nav-item-link"><LibraryBig className="nav-icon" />{expanded && <span>Manage antiques</span>}</NavLink></OverlayTrigger>}
          {auth.isAdmin && <OverlayTrigger placement="right" overlay={<Tooltip>Admin: add antique</Tooltip>}><NavLink to="/admin/antiques/new" className="nav-item-link"><Menu className="nav-icon" />{expanded && <span>Add antique</span>}</NavLink></OverlayTrigger>}
          {auth.isAdmin && <OverlayTrigger placement="right" overlay={<Tooltip>{t("categories")}</Tooltip>}><NavLink to="/admin/categories" className="nav-item-link"><Menu className="nav-icon" />{expanded && <span>{t("categories")}</span>}</NavLink></OverlayTrigger>}
          {!auth.isAdmin && <OverlayTrigger placement="right" overlay={<Tooltip>{t("location")}</Tooltip>}><NavLink to="/map" className="nav-item-link"><Map className="nav-icon" />{expanded && <span>{t("location")}</span>}</NavLink></OverlayTrigger>}
          {auth.isAdmin && <div className="nav-location-dropdown"><OverlayTrigger placement="right" overlay={<Tooltip>Location</Tooltip>}><NavLink to="/map" className="nav-item-link"><Map className="nav-icon" />{expanded && <><span>Location</span><ChevronDown className="nav-submenu-chevron" size={15} /></>}</NavLink></OverlayTrigger><div className="nav-admin-submenu"><NavLink to="/admin/location">Edit location</NavLink></div></div>}
          {auth.isAdmin && <OverlayTrigger placement="right" overlay={<Tooltip>Edit About page</Tooltip>}><NavLink to="/admin/about" className="nav-item-link"><BookOpen className="nav-icon" />{expanded && <span>Edit About page</span>}</NavLink></OverlayTrigger>}
        </div>
      </Nav>
      {/* User Profile Section */}
      <div className="icons-list-user-profile">
        <NavLink
          to="/profile"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          <UserRound size={18} />
          {expanded && "My profile"}
        </NavLink>
        <NavLink
          to="/preferences"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          <SlidersHorizontal size={18} />
          {expanded && t("preferences")}
        </NavLink>
        <div className="status">
          <span className="status-dot"></span>
          {/* <strong>Java API connected</strong> */}
        </div>
         <Dropdown drop="up">
                            <Dropdown.Toggle
                                variant="link"
                                className="text-light p-0 border-0 shadow-none"
                                style={{ background: 'none' }}
                            >
                                <OverlayTrigger placement="top" overlay={<Tooltip>Profile Menu</Tooltip>}>
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
                                    Profile
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => navigate('/preferences')}>
                                    <i className="bi bi-gear me-2"></i>{" "}
                                    Settings
                                </Dropdown.Item>
                                {/* <Dropdown.Item onClick={handleShowHelp}>
                                    <i className="bi bi-question-circle me-2"></i>
                                    Quick Start Guide
                                </Dropdown.Item> */}
                                <Dropdown.Divider />
                                <Dropdown.Item onClick={()=>{auth.logout()}} className="text-danger">
                                    <i className="bi bi-box-arrow-right me-2"></i>{" "}
                                    Logout
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
      </div>
    </Navbar>
  );
}
