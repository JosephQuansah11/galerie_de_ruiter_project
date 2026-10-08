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

  return <Navbar id="Navbar" aria-label={t("navMain")} className="navbar-dark navbar-expanded" expand="xl" fixed="top" expanded={expanded} onToggle={setExpanded}>
    <Navbar.Brand as={NavLink} to="/dashboard" className="navbar-brand-div" onClick={() => setExpanded(false)}>
      <img src="/images/galerie_de_ruiter.png" alt="Galerie de Ruiter" className="navbar-logo" />
    </Navbar.Brand>
    <Navbar.Toggle aria-controls="main-navigation" aria-label={t("navMain")} />
    <Navbar.Collapse id="main-navigation">
      <Nav className="main-navbar-links">
        <NavigationLinks onNavigate={() => setExpanded(false)} />
      </Nav>
      <NavigationAccountMenu onNavigate={() => setExpanded(false)} />
    </Navbar.Collapse>
  </Navbar>;
}
