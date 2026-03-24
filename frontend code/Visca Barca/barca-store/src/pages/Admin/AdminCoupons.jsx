import AdminLayout from "../../layouts/AdminLayout";
import { useEffect, useState } from "react";
import * as api from "../../api/api";
import {
    Ticket,
    Plus,
    Trash2,
    Calendar,
    Percent,
    IndianRupee,
    X,
    AlertCircle,
    Pencil,
    Activity,
    Clock,
    ShieldCheck,
    Tag
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const emptyForm = {
    code: "",
    discount_type: "percentage",
    discount_value: "",
    minimum_order_amount: 0,
    expiry_date: "",
    is_active: true
};

export default function AdminCoupons() {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [form, setForm] = useState({ ...emptyForm });

    useEffect(() => { fetchCoupons(); }, []);

    const fetchCoupons = async () => {
        try {
            const data = await api.getCoupons();
            setCoupons(data || []);
        } catch (err) {
            toast.error("Failed to fetch coupons");
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => { setEditingCoupon(null); setForm({ ...emptyForm }); setModal(true); };
    const openEditModal = (coupon) => {
        setEditingCoupon(coupon);
        setForm({
            code: coupon.code,
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value,
            minimum_order_amount: coupon.minimum_order_amount,
            expiry_date: coupon.expiry_date ? new Date(coupon.expiry_date).toISOString().split("T")[0] : "",
            is_active: coupon.is_active
        });
        setModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...form, discount_value: parseFloat(form.discount_value), minimum_order_amount: parseFloat(form.minimum_order_amount), expiry_date: new Date(form.expiry_date).toISOString() };
            if (editingCoupon) { await api.updateCoupon(editingCoupon.id, payload); toast.success("Coupon Updated"); }
            else { await api.createCoupon(payload); toast.success("Coupon Created"); }
            setModal(false); fetchCoupons();
        } catch (err) { toast.error(err.message || "Failed"); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this coupon permanently?")) return;
        try { await api.deleteCoupon(id); toast.success("Coupon Removed"); fetchCoupons(); } catch (err) { toast.error("Delete failed"); }
    };

    return (
        <AdminLayout>
            <div className="space-y-8 pb-12">
                {/* HEADER */}
                <div className="flex flex-col sm:flex-row justify-between items-end gap-6 bg-white p-8 sm:p-12 rounded-[3.5rem] shadow-xl border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
                        <Ticket size={300} />
                    </div>
                    <div className="space-y-2 relative z-10">
                        <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Discount <span className="text-rose-600">Assets</span></h1>
                        <p className="text-sm text-gray-500 font-medium">Create and manage elite promotional tier-codes</p>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="w-full sm:w-auto flex items-center justify-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-2xl hover:bg-blue-800 hover:scale-105 transition-all font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-200 relative z-10"
                    >
                        <Plus size={20} /> Create Asset
                    </button>
                </div>

                {/* STATS OVERVIEW */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatusCard title="Active Campaigns" value={coupons.filter(c => c.is_active).length} icon={<Activity size={22}/>} color="from-blue-600 to-blue-800" />
                    <StatusCard title="Total Inventory" value={coupons.length} icon={<Tag size={22}/>} color="from-rose-600 to-rose-800" />
                    <StatusCard title="Expiring Soon" value={coupons.filter(c => new Date(c.expiry_date) < new Date(Date.now() + 7*24*60*60*1000)).length} icon={<Clock size={22}/>} color="from-amber-500 to-amber-700" />
                    <StatusCard title="Security Level" value="Tier 1" icon={<ShieldCheck size={22}/>} color="from-emerald-600 to-emerald-800" />
                </div>

                {/* COUPON GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {loading ? (
                        <div className="col-span-full py-32 flex flex-col items-center justify-center text-gray-300 gap-4">
                            <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full shadow-lg" />
                            <p className="font-black text-xs uppercase tracking-[0.2em] animate-pulse">Initializing Assets...</p>
                        </div>
                    ) : coupons.length === 0 ? (
                        <div className="col-span-full py-40 bg-white rounded-[3rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center gap-4">
                            <Ticket className="text-gray-200" size={64} />
                            <p className="text-gray-400 font-black text-xs uppercase tracking-[0.3em]">No Coupons Deployed</p>
                        </div>
                    ) : (
                        coupons.map((c) => (
                            <div key={c.id} className="group relative bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                                {/* Ticket Design Top */}
                                <div className={`h-24 p-6 flex items-center justify-between text-white ${c.is_active ? 'bg-gradient-to-r from-blue-700 to-blue-900' : 'bg-gray-400'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl border border-white/10">
                                            <Ticket size={24} />
                                        </div>
                                        <h3 className="text-xl font-black tracking-widest">{c.code}</h3>
                                    </div>
                                    <div className="flex bg-white/10 rounded-xl">
                                        <button onClick={() => openEditModal(c)} className="p-2.5 hover:bg-blue-600 transition-colors"><Pencil size={18} /></button>
                                        <button onClick={() => handleDelete(c.id)} className="p-2.5 hover:bg-rose-600 transition-colors"><Trash2 size={18} /></button>
                                    </div>
                                </div>
                                {/* Ticket Content */}
                                <div className="p-8 space-y-5 relative">
                                    {/* Perforation holes */}
                                    <div className="absolute top-0 left-0 w-4 h-4 rounded-full bg-gray-50 border border-gray-100 -translate-x-1/2 -translate-y-1/2"></div>
                                    <div className="absolute top-0 right-0 w-4 h-4 rounded-full bg-gray-50 border border-gray-100 translate-x-1/2 -translate-y-1/2"></div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-tighter">Offer Value</p>
                                            <p className="text-lg font-black text-emerald-600 tracking-tight">
                                                {c.discount_type === "percentage" ? `${c.discount_value}% Discount` : `₹${c.discount_value.toLocaleString()} Rebate`}
                                            </p>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-tighter">Minimum Tier</p>
                                            <p className="text-lg font-black text-gray-900 tracking-tight">₹{c.minimum_order_amount.toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <div className="pt-5 border-t border-dashed border-gray-100 flex justify-between items-center">
                                         <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400">
                                            <Calendar size={12} className="text-blue-500" /> Ends {new Date(c.expiry_date).toLocaleDateString()}
                                         </div>
                                         <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${c.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                            {c.is_active ? 'Operational' : 'Deactivated'}
                                         </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* MODAL */}
            {modal && (
                <Modal title={editingCoupon ? "Modify Asset" : "Deploy New Asset"} onClose={() => setModal(false)}>
                    <form onSubmit={handleSubmit} className="space-y-8 pt-4">
                        <div className="space-y-6">
                            <div className="bg-gray-900 p-8 rounded-[2rem] text-white shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-10 transform scale-150 rotate-12 group-hover:rotate-45 transition-transform duration-700">
                                    <Tag size={120} />
                                </div>
                                <div className="relative z-10 space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Asset Identity Code</label>
                                    <input 
                                        required placeholder="E.G. CHAMPIONS24"
                                        className="w-full bg-transparent border-none p-0 text-3xl font-black uppercase tracking-widest placeholder:text-white/10 focus:ring-0 text-gold"
                                        value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                    />
                                    <div className="w-12 h-1 bg-gold/30 rounded-full"></div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <FormItem label="Tier Type">
                                    <select className="w-full bg-gray-50 border-none rounded-2xl p-4 text-xs font-black text-gray-900 uppercase tracking-widest focus:ring-2 focus:ring-blue-500" value={form.discount_type} onChange={e => setForm({...form, discount_type: e.target.value})}>
                                        <option value="percentage">Percentage</option>
                                        <option value="fixed">Fixed Global</option>
                                    </select>
                                </FormItem>
                                <FormItem label="Value Units">
                                    <div className="relative">
                                        <input type="number" className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-black text-gray-900 focus:ring-2 focus:ring-blue-500" value={form.discount_value} onChange={e => setForm({...form, discount_value: e.target.value})}/>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                                            {form.discount_type === "percentage" ? <Percent size={14}/> : <IndianRupee size={14}/>}
                                        </div>
                                    </div>
                                </FormItem>
                                <FormItem label="Minimum Order (₹)">
                                    <input type="number" className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-black text-gray-900 focus:ring-2 focus:ring-blue-500" value={form.minimum_order_amount} onChange={e => setForm({...form, minimum_order_amount: e.target.value})}/>
                                </FormItem>
                                <FormItem label="Expiry Cycle">
                                    <input type="date" className="w-full bg-gray-50 border-none rounded-2xl p-4 text-xs font-black text-gray-900 uppercase focus:ring-2 focus:ring-blue-500" value={form.expiry_date} onChange={e => setForm({...form, expiry_date: e.target.value})}/>
                                </FormItem>
                            </div>

                            {editingCoupon && (
                                <label className="flex items-center gap-4 p-5 bg-blue-50 rounded-2xl border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors">
                                    <input type="checkbox" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} className="w-6 h-6 rounded-lg text-blue-600 focus:ring-blue-500 border-gray-300"/>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black uppercase text-blue-900 tracking-tight">Operational Active</span>
                                        <span className="text-[10px] font-bold text-blue-600/60 leading-none">Enable this asset for global customers</span>
                                    </div>
                                </label>
                            )}
                        </div>
                        <button type="submit" className="w-full bg-blue-900 border-b-6 border-blue-950 text-white py-5 rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] hover:bg-black transition-all shadow-2xl active:translate-y-1 active:border-b-0">
                            {editingCoupon ? "Synchronize Asset" : "Deploy Asset"}
                        </button>
                    </form>
                </Modal>
            )}
            <ToastContainer position="bottom-right" theme="dark"/>
        </AdminLayout>
    );
}

function StatusCard({ title, value, icon, color }) {
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

function FormItem({ label, children }) {
    return (
        <div className="space-y-1.5">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
            {children}
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
                <div className="px-10 pb-10 overflow-y-auto max-h-[85vh] custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );
}
