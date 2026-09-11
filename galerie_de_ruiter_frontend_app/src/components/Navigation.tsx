import { Button, Dropdown, Nav, OverlayTrigger, Tooltip } from "react-bootstrap";
import Navbar from "react-bootstrap/Navbar";

import { NavLink, useNavigate } from "react-router-dom";
import { LogIn, LogOut, SlidersHorizontal, UserRound } from "lucide-react";
import { Avatar, DropdownPanel } from "./UI";
import { useAuth } from "../context/AuthContext";

export function CustomNav() {
  const auth = useAuth();
  const navigate = useNavigate();

  const navLinkList = [
    { href: "/dashboard", icon: "bi bi-house", title: "Home" },
    { href: "/antiques", icon: "bi bi-people", title: "Antiques" },
    { href: "/profile", icon: "bi bi-calendar", title: "Profile" },
    { href: "/preferences", icon: "bi bi-gear", title: "Settings" },
    { href: "/map", icon: "bi bi-map", title: "Location" },
  ];

  // const handleShowHelp = () => {
  //     // Trigger quick start guide
  //     const event = new CustomEvent('showQuickStartGuide');
  //     window.dispatchEvent(event);
  // };

  return (
    <Navbar
      id="Navbar"
      className=""
      // d-flex flex-column justify-items-center align-items-center h-100
    >
      <div className="navbar-brand-div">
        <NavLink
          to="/dashboard"
          // className="w-100 m-0 p-0 position-relative d-flex justify-content-center align-items-center"
        >
          <img
            src="@/images/galerie_de_ruiter.png"
            alt="My Icon"
            width="80%"
            style={{ borderRadius: "20%" }}
          />
        </NavLink>
      </div>
      <Nav
      // className="d-flex flex-column justify-content-between h-100"
      >
        <div className="icons-list">
          {navLinkList.map((link) => (
            <OverlayTrigger
              key={"link" + link.title}
              placement="right"
              overlay={<Tooltip>{link.title}</Tooltip>}
            >
              <NavLink to={link.href}>
                <i className={link.icon + " hover-effect "}></i>
              </NavLink>
            </OverlayTrigger>
          ))}
        </div>
      </Nav>
      {/* User Profile Section */}
      <div className="icons-list-user-profile">
        <NavLink
          to="/profile"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          <UserRound size={18} />
          My profile
        </NavLink>
        <NavLink
          to="/preferences"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          <SlidersHorizontal size={18} />
          Preferences
        </NavLink>
        <div className="status">
          <span className="status-dot"></span>
          {/* <strong>Java API connected</strong> */}
        </div>
        {/* <div className="topbar-actions">
          {auth.authenticated ? (
            <DropdownPanel
              label={
                <>
                  <Avatar name={auth.profile?.username} size="small" />
                  {auth.profile?.username ?? "Member"}
                </>
              }
            >
              <Button className="menu-action" onClick={auth.logout}>
                <LogOut size={15} />
                Sign out
              </Button>
            </DropdownPanel>
          ) : (
            <>
              <button className="quiet-button" onClick={auth.login}>
                <LogIn size={16} />
                Sign in
              </button>
              <NavLink className="primary-button" to="/register">
                Create account
              </NavLink>
            </>
          )}
        </div> */}
         <Dropdown drop="up">
                            <Dropdown.Toggle
                                variant="link"
                                className="text-light p-0 border-0 shadow-none"
                                style={{ background: 'none' }}
                            >
                                <OverlayTrigger placement="top" overlay={<Tooltip>Profile Menu</Tooltip>}>
                                    <div className="d-flex flex-column align-items-center">
                                        {auth.profile?.username ? (
                                            <img
                                                src={""}
                                                alt="Profile"
                                                width="40"
                                                height="40"
                                                className="rounded-circle mb-1"
                                                style={{ objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <div
                                                className="rounded-circle bg-primary d-flex align-items-center justify-content-center mb-1"
                                                style={{ width: '40px', height: '40px' }}
                                            >
                                                <i className="bi bi-person-fill text-white fs-5"></i>
                                            </div>
                                        )}
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
                                    <i className="bi bi-person me-2"></i>
                                    Profile
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => navigate('/settings')}>
                                    <i className="bi bi-gear me-2"></i>
                                    Settings
                                </Dropdown.Item>
                                {/* <Dropdown.Item onClick={handleShowHelp}>
                                    <i className="bi bi-question-circle me-2"></i>
                                    Quick Start Guide
                                </Dropdown.Item> */}
                                <Dropdown.Divider />
                                <Dropdown.Item onClick={()=>{auth.logout()}} className="text-danger">
                                    <i className="bi bi-box-arrow-right me-2"></i>
                                    Logout
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
      </div>
    </Navbar>
  );
}
