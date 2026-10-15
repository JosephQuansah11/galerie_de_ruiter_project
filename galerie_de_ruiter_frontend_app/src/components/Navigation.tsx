import { Nav } from "react-bootstrap";
import Navbar from "react-bootstrap/Navbar";
import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { NavigationLinks } from "./NavigationLinks";
import { NavigationAccountMenu } from "./NavigationAccountMenu";

export function CustomNav() {
  const { t } = useLanguage();
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setExpanded(false);
  }, [location.pathname]);

  // The bar is only as tall as its own items, so the page below it cannot use a fixed
  // offset. Publish the measured height as `--top-nav-height`, which is what the content
  // margin and the collapsed panel are sized from.
  useEffect(() => {
    const navbar = document.getElementById("Navbar");
    if (!navbar || typeof ResizeObserver === "undefined") return;
    const desktop = window.matchMedia("(min-width: 1200px)");
    const apply = () => {
      if (!desktop.matches) {
        document.documentElement.style.removeProperty("--top-nav-height");
        return;
      }
      document.documentElement.style.setProperty(
        "--top-nav-height",
        `${navbar.getBoundingClientRect().height}px`,
      );
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(navbar);
    desktop.addEventListener("change", apply);
    return () => {
      observer.disconnect();
      desktop.removeEventListener("change", apply);
      document.documentElement.style.removeProperty("--top-nav-height");
    };
  }, []);

  return <Navbar id="Navbar" aria-label={t("navMain")} className="navbar-dark navbar-expanded" expand="xl" fixed="top" expanded={expanded} onToggle={setExpanded}>
    <Navbar.Brand as={NavLink} to="/home" className="navbar-brand-div" onClick={() => setExpanded(false)}>
      <span className="navbar-wordmark">{t("galleryName")}</span>
    </Navbar.Brand>
    <Navbar.Toggle aria-controls="main-navigation" aria-expanded={expanded} aria-label={t("navMain")} label={t("navMain")} />
    <Navbar.Collapse id="main-navigation">
      <Nav className="main-navbar-links">
        <NavigationLinks onNavigate={() => setExpanded(false)} />
      </Nav>
      <NavigationAccountMenu onNavigate={() => setExpanded(false)} />
    </Navbar.Collapse>
  </Navbar>;
}
