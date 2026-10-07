import { Nav } from "react-bootstrap";
import Navbar from "react-bootstrap/Navbar";
import { NavLink } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { NavigationLinks } from "./NavigationLinks";
import { NavigationAccountMenu } from "./NavigationAccountMenu";

export function CustomNav() {
  const { t } = useLanguage();

  return <Navbar id="Navbar" aria-label={t("navMain")} className="navbar-dark navbar-expanded" expand="xl" fixed="top">
    <Navbar.Brand as={NavLink} to="/dashboard" className="navbar-brand-div">
      <img src="/images/galerie_de_ruiter.png" alt="Galerie de Ruiter" className="navbar-logo" />
    </Navbar.Brand>
    <Navbar.Toggle aria-controls="main-navigation" aria-label={t("navMain")} />
    <Navbar.Collapse id="main-navigation">
      <Nav className="main-navbar-links">
        <NavigationLinks />
      </Nav>
      <NavigationAccountMenu />
    </Navbar.Collapse>
  </Navbar>;
}
