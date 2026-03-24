import AdminLayout from "../../layouts/AdminLayout";
import { useContext, useMemo, useState } from "react";
import { ProductContext } from "../../contexts/ProductContext";
import {
  Search,
  Package,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Trash2,
  Plus,
  Pencil,
  X,
  Filter,
  Layers,
  MoreVertical,
  ChevronRight,
  Minus
} from "lucide-react";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function AdminProducts() {
  const { products, addProduct, editProduct, deleteProduct } = useContext(ProductContext);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [gender, setGender] = useState("all");

  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(null);

  const [form, setForm] = useState({
    name: "",
    price: "",
    stock_s: 0,
    stock_m: 0,
    stock_l: 0,
    stock_xl: 0,
    image_url: "",
    category: "",
    gender: "",
    description: "",
  });

  /* ---------------- STATS ---------------- */
  const totalProducts = products.length;
  const inventoryValue = products.reduce((sum, p) => sum + (p.price || 0) * ((p.stock_s || 0) + (p.stock_m || 0) + (p.stock_l || 0) + (p.stock_xl || 0)), 0);

  const sizeStats = ['S', 'M', 'L', 'XL'].map(size => {
    const key = `stock_${size.toLowerCase()}`;
    const lowCount = products.filter(p => (p[key] || 0) > 0 && (p[key] || 0) < 10).length;
    return { size, lowCount };
  });

  const totalLowStock = sizeStats.reduce((s, x) => s + x.lowCount, 0);

  /* ---------------- FILTER ---------------- */
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchCategory = category === "all" || p.category === category;
      const matchGender = gender === "all" || p.gender === gender;
      return matchSearch && matchCategory && matchGender;
    });
  }, [products, search, category, gender]);

  /* ---------------- HANDLERS ---------------- */
  const handleAdd = async () => {
    if (!form.name || !form.price) { toast.warning("Name and price are required."); return; }
    await addProduct({ ...form, price: Number(form.price), stock_s: Number(form.stock_s), stock_m: Number(form.stock_m), stock_l: Number(form.stock_l), stock_xl: Number(form.stock_xl) });
    toast.success("Product added.");
    setAddModal(false);
  };

  /* ---------------- SIZE BREAKDOWN DATA ---------------- */
  const sizeBreakdown = ['S', 'M', 'L', 'XL'].map(size => {
    const key = `stock_${size.toLowerCase()}`;
    return {
      size,
      in: products.filter(p => (p[key] || 0) >= 10).length,
      low: products.filter(p => (p[key] || 0) > 0 && (p[key] || 0) < 10).length,
      out: products.filter(p => (p[key] || 0) === 0).length,
    };
  });

  const handleEdit = async () => {
    await editProduct(editModal.id, { ...form, price: Number(form.price), stock_s: Number(form.stock_s), stock_m: Number(form.stock_m), stock_l: Number(form.stock_l), stock_xl: Number(form.stock_xl) });
    toast.info("Product updated.");
    setEditModal(null);
  };

  return (
    <AdminLayout>
      <div className="space-y-8 pb-12">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-end gap-6 bg-white p-8 sm:p-12 rounded-[3.5rem] shadow-xl border border-gray-100">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Global <span className="text-blue-600">Inventory</span></h1>
            <p className="text-sm text-gray-500 font-medium">Professional catalog management and stock synchronization</p>
          </div>
          <button
            onClick={() => { setForm({ name: "", price: "", stock_s: 0, stock_m: 0, stock_l: 0, stock_xl: 0, image_url: "", category: "", gender: "", description: "" }); setAddModal(true); }}
            className="w-full sm:w-auto flex items-center justify-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-2xl hover:bg-blue-800 hover:scale-105 transition-all font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-200"
          >
            <Plus size={20} /> New Item
          </button>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total SKU" value={totalProducts} icon={<Package size={22}/>} color="from-blue-600 to-blue-800" />
          <StatCard title="Value" value={`₹${(inventoryValue / 1000).toFixed(1)}K`} icon={<DollarSign size={22}/>} color="from-rose-600 to-rose-800" />
          <StatCard title="Low Stock" value={totalLowStock} icon={<AlertTriangle size={22}/>} color="from-amber-500 to-amber-700" />
          <StatCard title="Active Size" value="S, M, L, XL" icon={<Layers size={22}/>} color="from-emerald-600 to-emerald-800" />
        </div>

        {/* SIZE STOCK BREAKDOWN */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
           {sizeBreakdown.map(s => (
              <div key={s.size} className="bg-white rounded-[2rem] p-6 shadow-xl border border-gray-100 space-y-4">
                 <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Size {s.size}</span>
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-[10px]">{s.size}</div>
                 </div>
                 <div className="space-y-2">
                    <StockRow label="Healthy" count={s.in} color="text-emerald-600" bg="bg-emerald-50" />
                    <StockRow label="Warning" count={s.low} color="text-amber-600" bg="bg-amber-50" />
                    <StockRow label="Critical" count={s.out} color="text-rose-600" bg="bg-rose-50" />
                 </div>
              </div>
           ))}
        </div>

        {/* CONTROLS */}
        <div className="bg-white rounded-[2.5rem] p-4 sm:p-6 shadow-xl border border-gray-100 flex flex-col lg:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full lg:w-auto">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search global inventory..."
                className="w-full pl-16 pr-6 py-4 bg-gray-50/50 border-none rounded-2xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
              />
            </div>
            
            <div className="flex gap-4 w-full lg:w-auto">
              <FilterSelect value={category} onChange={setCategory} icon={<Filter size={14}/>} options={["all", "jerseys", "caps", "jackets", "training"]} />
              <FilterSelect value={gender} onChange={setGender} icon={<TrendingUp size={14}/>} options={["all", "men", "women", "kids"]} />
            </div>
        </div>

        {/* PRODUCTS TABLE */}
        <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b">
                <th className="px-8 py-6">Product Details</th>
                <th className="px-8 py-6 text-center">Unit Price</th>
                <th className="px-8 py-6 text-center">Stock Breakdown</th>
                <th className="px-8 py-6 text-center">Status</th>
                <th className="px-8 py-6 text-center">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredProducts.map((p) => {
                const totalStock = (p.stock_s || 0) + (p.stock_m || 0) + (p.stock_l || 0) + (p.stock_xl || 0);
                const status = totalStock === 0 ? "out" : totalStock < 20 ? "low" : "in";

                return (
                  <tr key={p.id} className="group hover:bg-blue-50/20 transition-colors">
                    <td className="px-8 py-6 flex items-center gap-6">
                      <div className="relative group/img">
                        <img src={p.image_url} className="w-16 h-16 rounded-[1.25rem] object-cover shadow-lg group-hover/img:scale-110 transition-transform" />
                        <div className="absolute inset-0 rounded-[1.25rem] ring-1 ring-inset ring-black/10"></div>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-gray-900 truncate">{p.name}</p>
                        <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider flex items-center gap-1.5 mt-1">
                          <span className="w-1 h-1 rounded-full bg-blue-600"></span> {p.category}
                        </p>
                      </div>
                    </td>

                    <td className="px-8 py-6 text-center">
                      <span className="text-sm font-black text-gray-900 tracking-tighter">₹{p.price.toLocaleString()}</span>
                    </td>

                    <td className="px-8 py-6">
                      <div className="flex justify-center gap-2">
                        {['S', 'M', 'L', 'XL'].map(s => (
                           <SizeBadge key={s} label={s} count={p[`stock_${s.toLowerCase()}`] || 0} />
                        ))}
                      </div>
                    </td>

                    <td className="px-8 py-6 text-center">
                       <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest 
                          ${status === 'in' ? 'bg-green-100 text-green-700' : status === 'low' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                         <div className={`w-1.5 h-1.5 rounded-full ${status === 'in' ? 'bg-green-600' : status === 'low' ? 'bg-amber-600' : 'bg-red-600'}`}></div>
                         {status === 'in' ? 'In Stock' : status === 'low' ? 'Low Stock' : 'Out of Stock'}
                       </div>
                    </td>

                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center gap-3">
                        <button onClick={() => { setEditModal(p); setForm({ ...p, stock_s: p.stock_s || 0, stock_m: p.stock_m || 0, stock_l: p.stock_l || 0, stock_xl: p.stock_xl || 0 }); }} className="p-3 bg-gray-100 rounded-xl text-gray-500 hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => { if (confirm("Delete this product?")) deleteProduct(p.id); }} className="p-3 bg-gray-100 rounded-xl text-gray-400 hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredProducts.length === 0 && (
            <div className="py-32 flex flex-col items-center justify-center text-gray-300 gap-4">
              <Package size={64} strokeWidth={1} className="opacity-20" />
              <p className="font-black text-xs uppercase tracking-[0.3em]">No Products Found</p>
            </div>
          )}
        </div>

        {/* MODALS */}
        {(addModal || editModal) && (
          <Modal title={addModal ? "New Performance Kit" : "Optimize Product"} onClose={() => { setAddModal(false); setEditModal(null); }}>
             <div className="space-y-6 pt-4">
                <ProductForm form={form} setForm={setForm} />
                <button 
                  onClick={addModal ? handleAdd : handleEdit}
                  className="w-full bg-blue-900 border-b-4 border-blue-950 text-white py-4 rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-2xl active:translate-y-1 active:border-b-0"
                >
                  {addModal ? "Deploy to Store" : "Finalize Changes"}
                </button>
             </div>
          </Modal>
        )}

        <ToastContainer position="bottom-right" theme="dark" />
      </div>
    </AdminLayout>
  );
}

function StockRow({ label, count, color, bg }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[10px] font-bold text-gray-500 uppercase">{label}</span>
      <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${color} ${bg}`}>{count} SKU</span>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <div className={`relative bg-gradient-to-br ${color} rounded-[2.5rem] p-8 text-white shadow-2xl group overflow-hidden border-b-8 border-black/10`}>
      <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform duration-500">
         {icon}
      </div>
      <div className="relative z-10 flex flex-col gap-4">
        <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl inline-block shadow-inner border border-white/10 w-fit">
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">{title}</p>
          <h3 className="text-3xl font-black tracking-tighter">{value}</h3>
        </div>
      </div>
    </div>
  );
}

function SizeBadge({ label, count }) {
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase
      ${count === 0 ? 'bg-red-50 text-red-500 border-red-100 opacity-40' : count < 10 ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-gray-50 text-gray-900 border-gray-100'}
    `}>
      <span className="opacity-40">{label}</span>
      <span>{count}</span>
    </div>
  );
}

function FilterSelect({ value, onChange, options, icon }) {
  return (
    <div className="relative group">
       <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600">{icon}</div>
       <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 pr-10 py-3.5 bg-white border-none rounded-2xl text-xs font-black text-gray-900 uppercase tracking-widest shadow-sm ring-1 ring-gray-100 focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer appearance-none"
      >
        {options.map(opt => <option key={opt} value={opt}>{opt === 'all' ? `All ${options[1]}` : opt}</option>)}
      </select>
    </div>
  );
}

function ProductForm({ form, setForm }) {
  const fields = [
    { name: "name", label: "Model Name", type: "text" },
    { name: "price", label: "Price (INR)", type: "number" },
    { name: "category", label: "Category", type: "select", options: ["jerseys", "caps", "jackets", "training"] },
    { name: "gender", label: "Tag", type: "select", options: ["men", "women", "kids"] },
    { name: "image_url", label: "CDN Asset Path", type: "text" },
    { name: "description", label: "Logistics Notes", type: "textarea" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {fields.map(f => (
          <div key={f.name} className={f.type === 'textarea' ? 'col-span-2' : ''}>
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">{f.label}</label>
            {f.type === 'select' ? (
              <select value={form[f.name]} onChange={e => setForm({...form, [f.name]: e.target.value})} className="w-full bg-gray-50 border-none rounded-xl text-xs font-bold py-3 text-gray-900 focus:ring-2 focus:ring-blue-500">
                 <option value="">Select...</option>
                 {f.options.map(o => <option key={o} value={o}>{o.toUpperCase()}</option>)}
              </select>
            ) : f.type === 'textarea' ? (
              <textarea value={form[f.name]} onChange={e => setForm({...form, [f.name]: e.target.value})} className="w-full bg-gray-50 border-none rounded-xl text-xs font-bold py-3 text-gray-900 min-h-[80px] focus:ring-2 focus:ring-blue-500" />
            ) : (
              <input type={f.type} value={form[f.name]} onChange={e => setForm({...form, [f.name]: e.target.value})} className="w-full bg-gray-50 border-none rounded-xl text-xs font-bold py-3 text-gray-900 focus:ring-2 focus:ring-blue-500" />
            )}
          </div>
        ))}
      </div>
      <div className="pt-4 border-t border-gray-100 flex gap-4">
         {['s', 'm', 'l', 'xl'].map(s => (
            <div key={s} className="flex-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center block mb-1.5">{s}</label>
              <input type="number" value={form[`stock_${s}`]} onChange={e => setForm({...form, [`stock_${s}`]: Number(e.target.value)})} className="w-full bg-gray-900 text-white border-none rounded-xl text-center text-xs font-black py-2 focus:ring-2 focus:ring-gold" />
            </div>
         ))}
      </div>
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xl animate-in fade-in duration-500" onClick={onClose} />
      <div className="relative bg-white w-full max-w-xl rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] flex flex-col animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
        <div className="px-10 py-8 flex items-center justify-between border-b border-gray-100 shrink-0">
          <h2 className="text-xl font-black text-gray-900 tracking-tighter uppercase">{title}</h2>
          <button onClick={onClose} className="p-3 rounded-full hover:bg-gray-100 text-gray-400 transition-all active:scale-90"><X size={24} /></button>
        </div>
        <div className="px-10 pb-10 overflow-y-auto max-h-[80vh] custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}
