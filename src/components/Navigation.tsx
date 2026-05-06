import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Hexagon, LogOut, ChevronDown, LayoutDashboard, Code, Info, BarChart2, Radio, Mail } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "../context/AuthContext";

const NAV_LINKS = [
  { to: "/courses", label: "COURSES", icon: LayoutDashboard, activeColor: "text-primary bg-primary/10",    hoverColor: "hover:text-primary hover:bg-white/5" },
  { to: "/algos",   label: "ALGOS",   icon: Code,            activeColor: "text-secondary bg-secondary/10",  hoverColor: "hover:text-secondary hover:bg-white/5" },
  { to: "/simulator", label: "SIMULATOR", icon: BarChart2, activeColor: "text-accent bg-accent/10", hoverColor: "hover:text-accent hover:bg-white/5" },
  { to: "/signals", label: "SIGNALS", icon: Radio, activeColor: "text-primary bg-primary/10", hoverColor: "hover:text-primary hover:bg-white/5" },
  { to: "/about",   label: "ABOUT",   icon: Info,            activeColor: "text-foreground bg-white/10", hoverColor: "hover:text-foreground hover:bg-white/5" },
  { to: "/contact", label: "CONTACT", icon: Mail,            activeColor: "text-primary bg-primary/10",  hoverColor: "hover:text-primary hover:bg-white/5" },
];

export default function Navigation() {
  const [mobileOpen, setMobileOpen]       = useState(false);
  const [userMenuOpen, setUserMenuOpen]   = useState(false);
  const location  = useLocation();
  const navigate  = useNavigate();
  const { user, logout } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate("/");
  };

  const planColors = {
    free: "#5a7394",
    member: "#3b82f6",
    premium: "#00ffc8",
  };

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden fixed top-0 w-full z-50 h-[66px] flex items-center justify-between px-4"
           style={{ background: "rgba(3,10,20,0.93)", borderBottom: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(20px)" }}>
          <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 group">
            <Hexagon className="h-6 w-6 text-primary transition-all group-hover:scale-110" />
            <span className="text-base font-black tracking-tighter text-foreground">
              EDGE<span className="text-secondary">RIFT</span>
            </span>
          </Link>
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="text-foreground hover:text-primary transition-colors p-1"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
      </div>

      {/* Sidebar/Panel */}
      <aside
        className={"fixed left-0 top-0 h-screen z-40 transition-transform duration-300 w-64 flex flex-col " + (mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0")}
        style={{ background: "rgba(5, 10, 18, 0.95)", borderRight: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(20px)" }}
      >
        <div className="h-[78px] hidden md:flex items-center px-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 group">
            <Hexagon className="h-7 w-7 text-primary transition-all group-hover:scale-110" />
            <span className="text-lg font-black tracking-tighter text-foreground">
              EDGE<span className="text-secondary">RIFT</span>
            </span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-2 mt-[66px] md:mt-0">
          <div className="text-[10px] font-black text-muted-foreground tracking-widest mb-2 px-2 uppercase">Menu</div>
          {NAV_LINKS.map(({ to, label, icon: Icon, activeColor, hoverColor }) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={to} to={to}
                onClick={() => setMobileOpen(false)}
                className={"flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all " + (isActive ? activeColor : "text-muted-foreground " + hoverColor)}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            )
          })}
        </div>

        <div className="p-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center justify-between w-full p-2 rounded-xl text-sm font-semibold transition-all hover:bg-white/5"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-primary-foreground shrink-0"
                    style={{ background: "rgba(0,255,200,0.18)" }}
                  >
                    {user.username[0].toUpperCase()}
                  </div>
                  <div className="text-left truncate">
                    <div className="text-sm font-bold text-foreground truncate">{user.username}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest" style={{ color: planColors[user.plan] || "#fff" }}>{user.plan}</div>
                  </div>
                </div>
                <ChevronDown className={"h-4 w-4 text-muted-foreground transition-transform shrink-0 " + (userMenuOpen ? "rotate-180" : "")} />
              </button>

              {userMenuOpen && (
                <div
                  className="absolute bottom-full left-0 mb-2 w-full rounded-2xl shadow-2xl overflow-hidden z-50"
                  style={{ background: "rgba(7,17,31,0.98)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(24px)" }}
                >
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-3 text-sm font-semibold transition-colors"
                    style={{ color: "#f87171" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/auth" onClick={() => setMobileOpen(false)}>
              <Button className="w-full text-sm font-bold tracking-wide">
                Sign In / Register
              </Button>
            </Link>
          )}
        </div>
      </aside>

      {mobileOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 md:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}
