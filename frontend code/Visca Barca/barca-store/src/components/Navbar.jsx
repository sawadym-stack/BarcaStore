import { Link, useNavigate } from "react-router-dom";
import { useContext, useState, useEffect, useRef } from "react";
import { StoreContext } from "../contexts/StoreContext";
import * as api from "../api/api";
import { Heart, User, Menu, X } from "lucide-react";

export default function Navbar() {
  const { user, logout, cart, wishlist } = useContext(StoreContext);
  const nav = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    nav("/");
  };

  // Close mobile menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [nav]);

  return (
    <nav
      className="
        fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl
        bg-[#0A102E]/80
        backdrop-blur-2xl
        backdrop-saturate-200
        text-white
        shadow-[0_20px_50px_rgba(0,0,0,0.5)]
        border border-white/10
        rounded-[2.5rem]
        z-50
        transition-all duration-300
      "
    >
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between px-4 sm:px-6 py-3">

        {/* LEFT – LOGO */}
        <Link to="/" className="flex items-center gap-2 sm:gap-3 group shrink-0">
          <img
            src="https://upload.wikimedia.org/wikipedia/sco/thumb/4/47/FC_Barcelona_%28crest%29.svg/2020px-FC_Barcelona_%28crest%29.svg.png"
            className="h-8 sm:h-10 transition-transform group-hover:scale-105"
            alt="logo"
          />
          <div className="leading-tight text-[13px] sm:text-[15px] font-semibold tracking-wide">
            <span>BARCA</span> <br />
            <span className="text-xs opacity-80">Official Store</span>
          </div>
        </Link>

        {/* CENTER MENU – Desktop only */}
        <div className="hidden md:flex items-center gap-10 text-sm font-semibold tracking-wide">
          <Link
            to="/"
            className="relative after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-0 after:bg-yellow-400 hover:after:w-full after:transition-all"
          >
            Home
          </Link>
          <Link
            to="/shop"
            className="relative after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-0 after:bg-yellow-400 hover:after:w-full after:transition-all"
          >
            Kits
          </Link>
        </div>

        {/* RIGHT ICONS */}
        <div className="flex items-center gap-3 sm:gap-5">

          {/* ❤️ WISHLIST */}
          <Link
            to="/wishlist"
            className="relative group"
            title="Wishlist"
          >
            <Heart
              size={20}
              strokeWidth={1.8}
              className={`transition-all ${wishlist.length > 0
                ? "text-red-500 fill-red-500"
                : "text-white group-hover:text-red-400"
                }`}
            />
            {wishlist.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-semibold shadow">
                {wishlist.length}
              </span>
            )}
          </Link>

          {/* 🛒 CART */}
          <Link
            to="/cart"
            className="relative group"
            title="Cart"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.6"
              stroke="currentColor"
              className="h-5 w-5 sm:h-6 sm:w-6 transition group-hover:text-yellow-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-2 7h14l-2-7M10 21a1 1 0 100-2 1 1 0 000 2zM16 21a1 1 0 100-2 1 1 0 000 2z"
              />
            </svg>

            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] px-1.5 rounded-full font-semibold shadow">
                {cart.length}
              </span>
            )}
          </Link>

          {/* 👤 PROFILE */}
          <button
            onClick={() => (user ? nav("/profile") : nav("/login"))}
            className="flex transition hover:opacity-80 items-center justify-center min-w-[32px]"
            title="Profile"
          >
            {api.profilePhotoUrl(user?.profile_photo ?? user?.profilePhoto) ? (
              <img
                src={api.profilePhotoUrl(user?.profile_photo ?? user?.profilePhoto)}
                alt="Profile"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border-2 border-white/40 shadow"
              />
            ) : (
              <User size={20} strokeWidth={1.8} className="sm:w-[22px] sm:h-[22px]" />
            )}
          </button>

          {/* AUTH ACTIONS – Desktop */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <span className="hidden lg:inline text-sm opacity-90">
                  Hi, {user.name}
                </span>

                {['admin', 'superadmin'].includes(user.role) && (
                  <Link
                    to="/admin"
                    className="px-2 py-1 rounded-md hover:bg-white/10 text-sm"
                  >
                    Admin
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="
                    bg-yellow-400 text-black
                    px-4 py-1.5 rounded-md
                    font-semibold text-sm
                    hover:bg-yellow-500
                    transition
                  "
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => nav("/login")}
                className="hover:text-yellow-400 transition text-sm"
              >
                Login
              </button>
            )}
          </div>

          {/* HAMBURGER – Mobile / Tablet */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-1 hover:bg-white/10 rounded transition"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* ========= MOBILE MENU ========= */}
      {mobileOpen && (
        <div
          ref={menuRef}
          className="
            absolute top-[calc(100%+12px)] left-0 w-full
            bg-[#0A102E]/95
            backdrop-blur-2xl
            border border-white/10
            rounded-[2rem]
            shadow-2xl
            animate-[reveal_0.3s_ease-out]
            overflow-hidden
            z-50
          "
        >
          <div className="px-6 py-6 space-y-2">
            {/* NAV LINKS */}
            {[
              { label: "Home", to: "/" },
              { label: "Kits", to: "/shop" },
              { label: "Wishlist", to: "/wishlist", count: wishlist.length },
              { label: "Cart", to: "/cart", count: cart.length },
              { label: "Profile", to: "/profile" },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between px-5 py-4 rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-white/10 transition-all border border-transparent hover:border-white/5"
              >
                <span>{link.label}</span>
                {link.count > 0 && (
                  <span className="bg-yellow-400 text-black px-2 py-0.5 rounded-full text-[10px]">
                    {link.count}
                  </span>
                )}
              </Link>
            ))}

            {user && ['admin', 'superadmin'].includes(user.role) && (
              <Link
                to="/admin"
                onClick={() => setMobileOpen(false)}
                className="block px-5 py-4 rounded-xl text-sm font-bold uppercase tracking-widest text-yellow-400 hover:bg-white/10 transition-all"
              >
                Intelligence Panel
              </Link>
            )}

            {/* AUTH */}
            <div className="pt-4 border-t border-white/10 mt-2">
              {user ? (
                <div className="flex items-center justify-between px-5 py-3">
                  <span className="text-xs font-bold opacity-70 uppercase tracking-widest">
                    {user.name}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="
                      bg-red-600/20 text-red-100
                      border border-red-600/30
                      px-6 py-2 rounded-xl
                      font-black text-[10px] uppercase tracking-widest
                      hover:bg-red-600 transition-all
                    "
                  >
                    Terminate Session
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { nav("/login"); setMobileOpen(false); }}
                  className="w-full text-center py-4 bg-yellow-400 text-black rounded-xl font-black text-xs uppercase tracking-widest hover:bg-yellow-500 transition-all"
                >
                  Join the Squad
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
