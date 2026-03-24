import AdminLayout from "../../layouts/AdminLayout";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "../../contexts/UserContext";
import { ProductContext } from "../../contexts/ProductContext";
import * as api from "../../api/api";

import {
  Users,
  ShoppingCart,
  Package,
  AlertTriangle,
  TrendingUp,
  Activity,
  Calendar,
  Layers,
  LayoutDashboard
} from "lucide-react";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

const COLORS = {
  blue: "#1e3a8a",
  garnet: "#be123c",
  gold: "#eab308",
  emerald: "#10b981",
  slate: "#64748b"
};

export default function Dashboard() {
  const { users } = useContext(UserContext);
  const { products } = useContext(ProductContext);

  const [orders, setOrders] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [filter, setFilter] = useState("month");

  /* ---------------- FETCH METRICS ---------------- */
  useEffect(() => {
    api.getOrders().then(setOrders);
    api.getDashboardMetrics().then(setMetrics);
  }, []);

  /* ---------------- CALCULATIONS ---------------- */
  const getProductTotalStock = (p) => (p.stock_s || 0) + (p.stock_m || 0) + (p.stock_l || 0) + (p.stock_xl || 0);

  const inStock = products.filter((p) => getProductTotalStock(p) > 5).length;
  const lowStock = products.filter((p) => {
    const total = getProductTotalStock(p);
    return total > 0 && total <= 5;
  }).length;
  const outOfStock = products.filter((p) => getProductTotalStock(p) === 0).length;

  const filteredOrders = orders.filter((o) => {
    if (filter === "all") return true;
    const d = new Date(o.created_at);
    const n = new Date();
    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  });

  const filteredRevenue = filteredOrders
    .filter((o) => (o.status || "").toLowerCase() !== "cancelled")
    .reduce((sum, o) => sum + (o.total_amount || 0), 0);

  /* ---------------- CHART DATA ---------------- */
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const buildMonthlyData = () => {
    const map = {};
    filteredOrders.forEach((o) => {
      const d = new Date(o.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
      const label = `${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
      if (!map[key]) map[key] = { key, month: label, revenue: 0, units: 0 };
      if ((o.status || "").toLowerCase() !== "cancelled") {
        map[key].revenue += o.total_amount || 0;
      }
      map[key].units += 1;
    });
    return Object.values(map).sort((a, b) => a.key.localeCompare(b.key));
  };
  const monthlyData = buildMonthlyData();

  const revenueTrend = monthlyData.map((d) => ({ month: d.month, revenue: Math.round(d.revenue) }));
  const monthlySales = monthlyData.map((d) => ({ month: d.month, units: d.units }));
  const ordersVsRevenue = monthlyData.map((d) => ({ month: d.month, orders: d.units, revenue: Math.round(d.revenue) }));

  const buildCategoryData = () => {
    const catMap = {};
    filteredOrders.forEach((o) => {
      (o.items || []).forEach((item) => {
        const cat = item.category || "Other";
        catMap[cat] = (catMap[cat] || 0) + (item.quantity || 1);
      });
    });
    if (Object.keys(catMap).length === 0) {
      products.forEach((p) => {
        const cat = p.category || "Other";
        catMap[cat] = (catMap[cat] || 0) + 1;
      });
    }
    return Object.entries(catMap).map(([name, value]) => ({ name, value }));
  };
  const salesByCategory = buildCategoryData();
  const PIE_COLORS = [COLORS.blue, COLORS.garnet, COLORS.gold, COLORS.emerald, "#8b5cf6", "#f97316"];

  return (
    <AdminLayout>
      <div className="space-y-8 pb-12">
        
        {/* HERO HEADER */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-rose-900 rounded-[3rem] p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden border-b-8 border-gold/20">
          <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
             <LayoutDashboard size={400} />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-gold border border-white/10">
                <Activity size={12} /> Systems Live
              </div>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tighter">Visca Barca <span className="text-gold">Store</span></h1>
              <p className="text-blue-100/60 font-medium max-w-md">Professional commerce intelligence and real-time package tracking for the FC Barcelona global catalog.</p>
            </div>
            
            <div className="flex bg-white/5 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 shadow-inner">
               <button onClick={() => setFilter("month")} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === "month" ? "bg-white text-blue-900 shadow-xl scale-105" : "text-white/70 hover:text-white"}`}>Monthly View</button>
               <button onClick={() => setFilter("all")} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === "all" ? "bg-white text-blue-900 shadow-xl scale-105" : "text-white/70 hover:text-white"}`}>Global History</button>
            </div>
          </div>
        </div>

        {/* CORE STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Revenue Flow" value={`₹${Math.round(filteredRevenue).toLocaleString()}`} icon={<ShoppingCart size={24}/>} color="from-blue-600 to-blue-800" trend="+12.5% this week" />
          <StatCard title="Global Orders" value={orders.length} icon={<Package size={24}/>} color="from-rose-600 to-rose-800" trend={`${filteredOrders.length} processed today`} />
          <StatCard title="Total Customers" value={metrics?.total_users || 0} icon={<Users size={24}/>} color="from-amber-500 to-amber-700" trend="verified accounts" />
          <StatCard title="Avg. Ticket" value={`₹${orders.length ? Math.round(filteredRevenue/orders.length).toLocaleString() : 0}`} icon={<TrendingUp size={24}/>} color="from-emerald-600 to-emerald-800" trend="per checkout" />
        </div>

        {/* ANALYTICS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <ChartCard title="Revenue Trajectory" icon={<Layers size={18} className="text-blue-500"/>} subtitle="Cumulative sales growth over time">
                <AreaChart data={revenueTrend}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.1}/>
                      <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" hide />
                  <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                  <Area type="monotone" dataKey="revenue" stroke={COLORS.blue} strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ChartCard>

              <ChartCard title="Category Dominance" icon={<Calendar size={18} className="text-rose-500"/>} subtitle="Order distribution by department">
                <PieChart>
                  <Pie data={salesByCategory} dataKey="value" innerRadius={60} outerRadius={80} paddingAngle={5} stroke="none">
                    {salesByCategory.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ChartCard>

              <ChartCard title="Sales Volume" icon={<Activity size={18} className="text-emerald-500"/>} subtitle="Units moved per monthly cycle">
                <BarChart data={monthlySales}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" hide />
                  <Tooltip contentStyle={{borderRadius: '16px'}} />
                  <Bar dataKey="units" fill={COLORS.gold} radius={[10, 10, 0, 0]} barSize={30} />
                </BarChart>
              </ChartCard>

              <ChartCard title="Operational Performance" icon={<LayoutDashboard size={18} className="text-amber-500"/>} subtitle="Orders vs Revenue correlation">
                <LineChart data={ordersVsRevenue}>
                  <XAxis dataKey="month" hide />
                  <Tooltip />
                  <Line type="monotone" dataKey="orders" stroke={COLORS.blue} strokeWidth={3} dot={{r:4, fill: COLORS.blue}} />
                  <Line type="monotone" dataKey="revenue" stroke={COLORS.garnet} strokeWidth={3} dot={{r:4, fill: COLORS.garnet}} />
                </LineChart>
              </ChartCard>
            </div>
          </div>

          <div className="space-y-8">
            {/* INVENTORY DEPTH */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="font-black text-gray-900 tracking-tight uppercase text-xs">Inventory Health</h3>
                 <span className="text-[10px] font-bold text-gray-400">Total: {products.length} Items</span>
               </div>
               <div className="space-y-6">
                 <InventoryBar label="Full Stock" value={inStock} total={products.length} color="bg-emerald-500" />
                 <InventoryBar label="Low Warning" value={lowStock} total={products.length} color="bg-amber-500" />
                 <InventoryBar label="Stock Out" value={outOfStock} total={products.length} color="bg-rose-500" />
               </div>
            </div>

            {/* TOP PERFORMERS */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100">
               <h3 className="font-black text-gray-900 tracking-tight uppercase text-xs mb-6">Top Performers</h3>
               <div className="space-y-5">
                 {products.slice(0, 4).map(p => (
                   <div key={p.id} className="flex items-center gap-4 group cursor-pointer">
                     <div className="relative shrink-0">
                       <img src={p.image_url || p.img} alt={p.name} className="w-12 h-12 rounded-2xl object-cover shadow-md group-hover:scale-110 transition-transform" />
                       <div className="absolute -top-1 -right-1 bg-gold text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center text-blue-900 border-2 border-white shadow-sm">#</div>
                     </div>
                     <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-gray-900 truncate tracking-tight">{p.name}</p>
                        <p className="text-[10px] font-bold text-gray-400">₹{p.price.toLocaleString()}</p>
                     </div>
                     <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">Best Seller</span>
                   </div>
                 ))}
               </div>
            </div>
          </div>

        </div>
      </div>
    </AdminLayout>
  );
}

function StatCard({ title, value, icon, color, trend }) {
  return (
    <div className={`relative bg-gradient-to-br ${color} rounded-[2.5rem] p-8 text-white shadow-2xl shadow-blue-900/10 group overflow-hidden border-b-4 border-black/20`}>
      <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform duration-500">
         {icon}
      </div>
      <div className="relative z-10 space-y-4">
        <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl inline-block shadow-inner border border-white/10">
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-1">{title}</p>
          <h3 className="text-3xl font-black tracking-tighter">{value}</h3>
        </div>
        <div className="text-[10px] font-bold text-white/40 flex items-center gap-1.5 uppercase tracking-tighter">
           <div className="w-1 h-1 rounded-full bg-white/40 animate-pulse" /> {trend}
        </div>
      </div>
    </div>
  );
}

function InventoryBar({ label, value, total, color }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{label}</span>
        <span className="text-xs font-black text-gray-900">{value}</span>
      </div>
      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-1000 shadow-sm`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ChartCard({ title, icon, subtitle, children }) {
  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100 flex flex-col min-h-[380px]">
      <div className="flex items-center gap-3 mb-1">
        <div className="p-2 rounded-xl bg-gray-50 text-gray-400 shadow-inner">
          {icon}
        </div>
        <h3 className="font-black text-gray-900 tracking-tight uppercase text-xs">{title}</h3>
      </div>
      <p className="text-[10px] font-bold text-gray-400 mb-8 px-1">{subtitle}</p>
      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
