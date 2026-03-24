import AdminSidebar from "../components/AdminSidebar";
import { Bell, LogOut, Menu, X } from "lucide-react";
import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import * as api from "../api/api";

export default function AdminLayout({ children }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [showPanel, setShowPanel] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [readIds, setReadIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem("barca_notif_read") || "[]"); } catch { return []; }
  });
  const panelRef = useRef(null);

  useEffect(() => {
    api.getOrders()
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => { });
  }, []);

  // Close panel on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setShowPanel(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Build notifications from recent orders (last 7 days)
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  const notifications = orders
    .filter((o) => now - new Date(o.created_at).getTime() < sevenDays)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 20)
    .map((o) => {
      const status = (o.status || "pending").toLowerCase();
      let message = `New order #${o.id} by ${o.shipping_name || "Customer"}`;
      let color = "bg-blue-100 text-blue-700";
      if (status === "cancelled") { message = `Order #${o.id} was cancelled`; color = "bg-red-100 text-red-700"; }
      else if (status === "delivered") { message = `Order #${o.id} delivered successfully`; color = "bg-green-100 text-green-700"; }
      else if (status === "shipped") { message = `Order #${o.id} has been shipped`; color = "bg-purple-100 text-purple-700"; }
      return { id: `order-${o.id}`, message, color, time: o.created_at, amount: o.total_amount };
    });

  const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length;

  const markAllRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadIds(allIds);
    localStorage.setItem("barca_notif_read", JSON.stringify(allIds));
  };

  const timeAgo = (dateStr) => {
    const diff = now - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="h-screen bg-gray-50/50 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/30 blur-[150px] rounded-full -mr-64 -mt-64 pointer-events-none" />

      {/* SIDEBAR */}
      <div className="hidden lg:block fixed left-0 top-0 h-screen w-64 z-50">
        <AdminSidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 z-[70] animate-in slide-in-from-left duration-500 shadow-2xl">
            <AdminSidebar />
            <button onClick={() => setSidebarOpen(false)} className="absolute top-6 right-[-50px] p-3 rounded-2xl bg-[#0A102E] text-white shadow-xl">
              <X size={24} />
            </button>
          </div>
        </div>
      )}

      {/* MAIN WRAPPER */}
      <div className="lg:ml-64 h-full flex flex-col relative z-10">

        {/* FLOATING TOP NAVBAR */}
        <div className="px-4 sm:px-8 pt-6 relative z-50">
          <header className={`bg-white/70 backdrop-blur-2xl rounded-[2.5rem] p-4 sm:p-5 flex items-center justify-between shadow-2xl border border-white/50 transition-all duration-500`}>

            {/* LEFT */}
            <div className="flex items-center gap-5">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-3 rounded-2xl bg-gray-100/50 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                <Menu size={22} />
              </button>
              <div className="space-y-0.5">
                <h1 className="text-xl font-black text-gray-900 tracking-tighter uppercase leading-none">
                  Barca <span className="text-blue-600 font-black">Store</span>
                </h1>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest hidden sm:block">
                  Operations & Logistics Center
                </p>
              </div>
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-6 pr-2">
              {/* NOTIFICATION */}
              <div className="relative" ref={panelRef}>
                <button onClick={() => setShowPanel(!showPanel)} className={`relative p-3 rounded-2xl transition-all shadow-sm hover:scale-105 active:scale-95 ${showPanel ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-gray-100/50 text-gray-500 hover:bg-white '}`}>
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] min-w-[20px] h-[20px] flex items-center justify-center px-1 rounded-full font-black border-2 border-white shadow-lg">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* DROPDOWN PANEL */}
                {showPanel && (
                  <div className="absolute right-0 mt-6 w-80 sm:w-96 bg-white/95 backdrop-blur-3xl rounded-[2rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden z-[100] animate-in zoom-in-95 slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between px-8 py-5 border-b bg-gray-50/50">
                      <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Protocol Alerts</h3>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-800 transition-colors tracking-tighter">Mark Secure</button>
                      )}
                    </div>
                    <div className="max-h-[28rem] overflow-y-auto divide-y divide-gray-50 custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-12 text-center text-gray-400 space-y-3">
                           <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto opacity-50"><Bell size={20}/></div>
                           <p className="text-[10px] font-black uppercase tracking-widest">System Idle</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div key={n.id} className={`px-8 py-5 flex items-start gap-4 transition-colors ${readIds.includes(n.id) ? "hover:bg-gray-50" : "bg-blue-50/30 font-bold hover:bg-blue-50/50"}`}>
                            <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 animate-pulse ${n.color.includes('red') ? 'bg-rose-500' : n.color.includes('green') ? 'bg-emerald-500' : 'bg-blue-600'}`} />
                            <div className="flex-1 space-y-1">
                              <p className="text-xs text-gray-700 leading-tight tracking-tight">{n.message}</p>
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{timeAgo(n.time)}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* PROFILE CONTROL */}
              <div className="flex items-center gap-4 py-1 px-1 rounded-2xl bg-gray-100/50 hover:bg-white transition-all group border border-transparent hover:border-gray-100 cursor-default shadow-sm">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#0A102E] to-blue-900 text-white flex items-center justify-center text-sm font-black shadow-lg border border-white/10 group-hover:scale-105 transition-transform">
                  {user?.name?.charAt(0)?.toUpperCase() || "A"}
                </div>
                <div className="leading-tight hidden sm:block pr-3">
                  <p className="text-xs font-black text-gray-900 truncate uppercase mt-0.5">{user?.name || "Admin User"}</p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{user?.role || "Administrator"}</p>
                  </div>
                </div>
              </div>

              {/* LOGOUT */}
              <button onClick={() => { logout(); navigate("/login"); }} className="p-3 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm hover:scale-105 active:scale-95 border border-rose-100">
                <LogOut size={20} />
              </button>
            </div>
          </header>
        </div>

        {/* CONTENT HUB */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar scroll-smooth">
          {children}
        </main>
      </div>
    </div>
  );
}
