import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Ticket,
  ShieldCheck,
  ChevronRight
} from "lucide-react";

export default function AdminSidebar() {
  return (
    <aside className="w-64 h-screen bg-[#0A102E] border-r border-white/5 flex flex-col overflow-hidden relative shadow-2xl">
      {/* GLOW EFFECT */}
      <div className="absolute top-[-10%] left-[-10%] w-32 h-32 bg-blue-600/20 blur-[100px] rounded-full pointer-events-none" />
      
      {/* LOGO / BRAND */}
      <div className="px-8 py-10 flex flex-col items-center gap-4 relative z-10">
        <div className="relative group">
           <div className="absolute -inset-1 bg-gradient-to-tr from-gold via-blue-600 to-garnet rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
           <div className="relative w-20 h-20 bg-[#0A102E] rounded-2xl border border-white/10 flex items-center justify-center p-1 overflow-hidden shadow-2xl">
              <img src="/barca-logo.jpg" alt="FCB Logo" className="w-full h-full object-contain rounded-xl" />
           </div>
        </div>
        <div className="text-center">
          <h2 className="text-lg font-black text-white tracking-widest uppercase"><span className="text-blue-500">Barca</span> Store</h2>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em] mt-1">Admin Command</p>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 px-4 py-6 space-y-2 text-sm overflow-y-auto custom-scrollbar relative z-10">
        <SidebarItem
          to="/admin"
          icon={<LayoutDashboard size={20} />}
          label="Intelligence Panel"
        />

        <SidebarItem
          to="/admin/users"
          icon={<Users size={20} />}
          label="Member Directory"
        />

        <SidebarItem
          to="/admin/products"
          icon={<Package size={20} />}
          label="Global Inventory"
        />

        <SidebarItem
          to="/admin/orders"
          icon={<ShoppingCart size={20} />}
          label="Package Logistics"
        />
        <SidebarItem
          to="/admin/coupons"
          icon={<Ticket size={20} />}
          label="Discount Assets"
        />
      </nav>

      {/* BOTTOM ADMIN INFO */}
      <div className="px-6 py-8 border-t border-white/5 bg-white/5 backdrop-blur-sm relative z-10">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-900 text-white flex items-center justify-center font-black shadow-lg border border-white/10">
             A
           </div>
           <div className="leading-tight">
             <p className="text-xs font-black text-white tracking-wide uppercase">Elite Staff</p>
             <p className="text-[10px] font-bold text-gray-400">admin@fcbarcelona.com</p>
           </div>
        </div>
      </div>
    </aside>
  );
}

/* ---------- SIDEBAR ITEM ---------- */

function SidebarItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `
        group relative flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300
        ${isActive
          ? "bg-gradient-to-r from-blue-600/20 to-transparent text-white border-l-4 border-gold shadow-[inset_0_0_20px_rgba(37,99,235,0.1)]"
          : "text-gray-400 hover:text-white hover:bg-white/5"
        }
        `
      }
    >
      <span className="transition-transform group-hover:scale-110">{icon}</span>
      <span className="flex-1 font-bold text-[11px] uppercase tracking-widest">{label}</span>
      <ChevronRight size={14} className="opacity-0 group-hover:opacity-40 transition-opacity" />
    </NavLink>
  );
}
