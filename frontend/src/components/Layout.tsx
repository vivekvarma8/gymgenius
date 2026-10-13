import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import { BrandLogo } from "./BrandLogo";
import { HangingLamp } from "./HangingLamp";
import { ChatWidget } from "./ChatWidget";

export function Layout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuthContext();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLightOn, setIsLightOn] = useState<boolean>(() => {
    const saved = localStorage.getItem("gymgenius_light_state");
    return saved !== null ? saved === "true" : true;
  });

  const toggleLight = () => {
    setIsLightOn((prev) => {
      const next = !prev;
      localStorage.setItem("gymgenius_light_state", String(next));
      return next;
    });
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className={`app-shell gym-theme ${isLightOn ? "gym-light-on" : "gym-light-off"}`}>
      {/* ATMOSPHERIC BLURRED GYM EQUIPMENT BACKDROP */}
      <div className="gym-scenery-backdrop" aria-hidden="true" />

      {/* INTERACTIVE HANGING CEILING LIGHT & PHYSICS PULL THREAD */}
      <HangingLamp isLightOn={isLightOn} onToggle={toggleLight} />

      <header className="app-header">
        <div className="header-left">
          <Link to="/" className="app-brand-link" onClick={closeMobileMenu}>
            <BrandLogo size={32} />
            <span className="brand-name">Gym<span className="brand-accent">Genius</span></span>
            <span className="brand-badge">AI CRM</span>
          </Link>
        </div>

        <button
          type="button"
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        <nav className={`app-nav ${mobileMenuOpen ? "mobile-open" : ""}`}>
          <Link
            to="/"
            className={location.pathname === "/" ? "app-nav-link active" : "app-nav-link"}
            onClick={closeMobileMenu}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="7" height="9" x="3" y="3" rx="1" />
              <rect width="7" height="5" x="14" y="3" rx="1" />
              <rect width="7" height="9" x="14" y="12" rx="1" />
              <rect width="7" height="5" x="3" y="16" rx="1" />
            </svg>
            Dashboard
          </Link>
          <Link
            to="/members"
            className={location.pathname === "/members" ? "app-nav-link active" : "app-nav-link"}
            onClick={closeMobileMenu}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Members
          </Link>
          <div className="nav-divider" />
          <button
            type="button"
            className="app-logout"
            onClick={() => {
              closeMobileMenu();
              logout();
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            Logout
          </button>
        </nav>
      </header>
      <main className="main-content">{children}</main>
      <ChatWidget />
    </div>
  );
}