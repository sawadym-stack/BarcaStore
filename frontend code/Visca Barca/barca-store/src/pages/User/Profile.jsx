import UserLayout from "../../layouts/UserLayout";
import { useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import * as api from "../../api/api";
import {
  User,
  ShoppingBag,
  LogOut,
  Pencil,
  Save,
  Camera,
  ShieldCheck,
  Mail,
  MapPin,
  Plus,
  Trash2,
  Lock,
  RotateCcw,
  XCircle,
  ArrowRight,
  Package,
  FileText,
  Tag
} from "lucide-react";
import { toast } from "react-toastify";
import ReviewModal from "../../components/ReviewModal";
import ReturnModal from "../../components/ReturnModal";

export default function Profile() {
  const { user, status, logout, updateProfile, setUser } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "profile";

  const [activeTab, setActiveTab] = useState(initialTab);
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [isReviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedOrderItem, setSelectedOrderItem] = useState(null);
  const [existingReview, setExistingReview] = useState(null);
  const [isReturnModalOpen, setReturnModalOpen] = useState(false);
  const [returnItem, setReturnItem] = useState(null);
  const [coupons, setCoupons] = useState([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    const tab = searchParams.get("tab");
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams, activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      api.getOrdersByUser().then(setOrders).catch(console.error);
      api.getAddresses().then(setAddresses).catch(console.error);
      api.getPublicCoupons().then(allcp => setCoupons((allcp || []).filter(c => c.is_active))).catch(console.error);
    }
  }, [user]);

  const fetchAddresses = async () => {
    try {
      const data = await api.getAddresses();
      setAddresses(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    try {
      await updateProfile(form);
      setIsEditing(false);
    } catch (e) {}
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const updatedUser = await api.uploadProfilePhoto(file);
      setUser(updatedUser);
      toast.success("Identity Matrix Updated: Photo synchronized.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Abort this deployment? This action is non-reversible.")) return;
    try {
      await api.cancelOrder(orderId);
      const updated = await api.getOrdersByUser();
      setOrders(updated);
      toast.success("Deployment aborted.");
    } catch (err) {
      toast.error(err.message || "Protocol failure: Could not abort.");
    }
  };

  const handleCancelItem = async (itemId) => {
    if (!window.confirm("Abort this specific asset?")) return;
    try {
      await api.cancelOrderItem(itemId);
      const updated = await api.getOrdersByUser();
      setOrders(updated);
      toast.success("Asset acquisition aborted.");
    } catch (err) {
      toast.error(err.message || "Protocol failure.");
    }
  };

  const handleOpenReturnModal = (item) => {
    setReturnItem(item);
    setReturnModalOpen(true);
  };

  const isWithinReturnWindow = (orderDate) => {
    const diff = Date.now() - new Date(orderDate).getTime();
    return diff <= 7 * 24 * 60 * 60 * 1000;
  };

  const handleDownloadInvoice = async (orderId) => {
    try {
      const buffer = await api.downloadInvoice(orderId);
      const blob = new Blob([buffer], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `invoice_${orderId}.pdf`;
      link.click();
    } catch (err) {
      toast.error(err.message || "Could not retrieve fiscal document.");
    }
  };

  const handleOpenReviewModal = async (productId, item) => {
    setSelectedProduct(productId);
    setSelectedOrderItem(item);
    try {
      const review = await api.getMyReview(productId);
      setExistingReview(review);
    } catch {
      setExistingReview(null);
    }
    setReviewModalOpen(true);
  };

  const [addressForm, setAddressForm] = useState({
    name: "",
    phone: "",
    address_line: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  });

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAddress) {
        await api.updateAddress(editingAddress.id, addressForm);
        toast.success("Coordinate update successful.");
      } else {
        await api.addAddress(addressForm);
        toast.success("New coordinates registered.");
      }
      setIsAddingAddress(false);
      setEditingAddress(null);
      setAddressForm({ name: "", phone: "", address_line: "", city: "", state: "", pincode: "", country: "India" });
      fetchAddresses();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleEditAddress = (addr) => {
    setEditingAddress(addr);
    setAddressForm({
      name: addr.name,
      phone: addr.phone,
      address_line: addr.address_line,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      country: addr.country,
    });
    setIsAddingAddress(true);
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm("Purge these coordinates?")) return;
    try {
      await api.deleteAddress(id);
      toast.success("Coordinates purged.");
      fetchAddresses();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (status === "loading") {
    return (
      <UserLayout>
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#0A102E] text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-yellow-400 border-transparent mb-4"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Synchronizing Identity...</p>
        </div>
      </UserLayout>
    );
  }
  if (!user) {
    return (
      <UserLayout>
        <div className="min-h-[70vh] flex items-center justify-center px-6">
          <div className="bg-[#111836]/60 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-12 text-center space-y-8 max-w-md w-full">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto text-white/20">
              <Lock size={32} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black uppercase tracking-tight">Access Restricted</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 leading-relaxed">Identity verification required to access personnel archives and acquisition history.</p>
            </div>
            <button 
              onClick={() => window.location.href = '/login'}
              className="w-full bg-white text-black py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-yellow-400 transition-all shadow-xl"
            >
              Verify Identity
            </button>
          </div>
        </div>
      </UserLayout>
    );
  }

  const getAvatarUrl = () => api.profilePhotoUrl(user.profile_photo ?? user.profilePhoto);

  return (
    <UserLayout>
      <div className="min-h-screen bg-[#0A102E] text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          
          {/* HEADER SECTION */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse" />
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] text-yellow-400">Personnel Terminal</p>
              </div>
              <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter leading-none">
                {activeTab === "profile" && <>PROFILE <span className="text-white/20">INFO</span></>}
                {activeTab === "orders" && <>ACQUISITION <span className="text-white/20">HISTORY</span></>}
                {activeTab === "addresses" && <>SECTOR <span className="text-white/20">LOGISTICS</span></>}
                {activeTab === "coupons" && <>ACTIVE <span className="text-white/20">PROTOCOLS</span></>}
              </h1>
            </div>
            
            <div className="flex items-center gap-6 bg-white/5 border border-white/10 p-3 rounded-[2rem] pr-8">
               <div className="relative group">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-[#111836] border border-white/10 flex items-center justify-center shrink-0">
                    {getAvatarUrl() ? (
                        <img src={getAvatarUrl()} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <User size={24} className="text-white/20" />
                    )}
                  </div>
                  <label className="absolute -bottom-2 -right-2 bg-yellow-400 text-black p-2 rounded-xl cursor-pointer shadow-xl hover:scale-110 transition-transform">
                      <Camera size={12} />
                      <input type="file" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
                  </label>
               </div>
               <div>
                  <p className="text-xs font-black uppercase tracking-tight">{user.name}</p>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{user.role} · {user.id || 'REDACTED'}</p>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* SIDEBAR NAVIGATION */}
            <div className="lg:col-span-3 space-y-3">
              {[
                { id: "profile", label: "Identity Matrix", icon: <User size={18} /> },
                { id: "orders", label: "Acquisitions", icon: <ShoppingBag size={18} /> },
                { id: "addresses", label: "Logistics Coordinates", icon: <MapPin size={18} /> },
                { id: "coupons", label: "Active Protocols", icon: <Tag size={18} /> }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`
                    w-full flex items-center justify-between p-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-300 border
                    ${activeTab === tab.id 
                      ? 'bg-yellow-400 border-yellow-400 text-black shadow-[0_0_30px_rgba(250,204,21,0.2)]' 
                      : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:border-white/20 hover:text-white'}
                  `}
                >
                  <span className="flex items-center gap-4">{tab.icon} {tab.label}</span>
                  <ArrowRight size={14} className={activeTab === tab.id ? 'opacity-100' : 'opacity-0'} />
                </button>
              ))}
              
              <div className="pt-8 mt-8 border-t border-white/5">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-4 p-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-red-500 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
                >
                  <LogOut size={18} /> TERMINATE SESSION
                </button>
              </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="lg:col-span-9">
               
               {/* ================= IDENTITY MATRIX (PROFILE) ================= */}
               {activeTab === "profile" && (
                 <div className="bg-[#111836]/60 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-8 space-y-12 animate-in fade-in slide-in-from-right-8 duration-500">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                      <div className="space-y-2">
                        <h2 className="text-xl font-black uppercase tracking-tight">Identity Intelligence</h2>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Personnel verification protocol</p>
                      </div>
                      
                      {!isEditing ? (
                        <button onClick={() => setIsEditing(true)} className="inline-flex items-center gap-3 bg-white/5 border border-white/10 px-8 py-4 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">
                          <Pencil size={12} /> Modify Intel
                        </button>
                      ) : (
                        <div className="flex gap-3">
                          <button onClick={() => setIsEditing(false)} className="px-8 py-4 rounded-full font-black text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-all">Cancel</button>
                          <button onClick={handleSave} className="bg-green-600 px-8 py-4 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-green-700 transition-all">Authorize Update</button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-3">
                          <p className="text-[9px] font-black uppercase tracking-widest text-white/20 ml-4">Personnel Appellation</p>
                          {isEditing ? (
                            <input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full bg-white/5 border border-white/10 px-8 py-5 rounded-[2rem] text-xs font-bold uppercase tracking-widest outline-none focus:border-yellow-400 transition-all" />
                          ) : (
                            <div className="bg-white/5 border border-white/10 px-8 py-5 rounded-[2rem] text-xs font-black uppercase tracking-widest text-white">{user.name}</div>
                          )}
                       </div>
                       
                       <div className="space-y-3">
                          <p className="text-[9px] font-black uppercase tracking-widest text-white/20 ml-4">Authorized Link (Email)</p>
                          <div className="bg-white/2 border border-white/5 px-8 py-5 rounded-[2rem] text-xs font-black uppercase tracking-widest text-white/40 flex items-center justify-between">
                            {user.email}
                            <Lock size={12} />
                          </div>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-white/5">
                       <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 space-y-2">
                          <p className="text-[9px] font-black uppercase tracking-widest text-white/20">Authorization</p>
                          <div className="flex items-center gap-2">
                             <ShieldCheck size={16} className="text-green-500" />
                             <span className="text-[10px] font-black uppercase text-white">Verified Tier</span>
                          </div>
                       </div>
                       <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 space-y-2 text-center">
                          <p className="text-[9px] font-black uppercase tracking-widest text-white/20 text-center">Acquisitions</p>
                          <p className="text-xl font-black">{orders.length}</p>
                       </div>
                       <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 space-y-2 text-right">
                          <p className="text-[9px] font-black uppercase tracking-widest text-white/20">Operational Status</p>
                          <p className="text-[10px] font-black uppercase text-green-500 tracking-widest">Active Status</p>
                       </div>
                    </div>
                 </div>
               )}

               {/* ================= ACQUISITIONS (ORDERS) ================= */}
               {activeTab === "orders" && (
                 <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                    {orders.length === 0 ? (
                       <div className="bg-[#111836]/60 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-32 text-center space-y-6">
                          <Package size={48} className="mx-auto text-white/10" />
                          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">No acquisition logs detected in range.</p>
                       </div>
                    ) : (
                      orders.map(order => (
                        <div key={order.id} className="bg-[#111836]/60 backdrop-blur-2xl border border-white/10 rounded-[3rem] overflow-hidden hover:border-white/20 transition-all duration-500">
                           {/* ORDER STRIP */}
                           <div className="p-8 border-b border-white/5 bg-white/[0.02] flex flex-wrap items-center justify-between gap-6">
                              <div className="flex items-center gap-8">
                                 <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-white/20">Protocol ID</p>
                                    <p className="text-sm font-black uppercase tracking-tighter">#{order.id}</p>
                                 </div>
                                 <div className="hidden sm:block w-px h-8 bg-white/5" />
                                 <div className="hidden sm:block">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-white/20">Authorized On</p>
                                    <p className="text-xs font-bold uppercase tracking-widest">{new Date(order.created_at).toLocaleDateString()}</p>
                                 </div>
                                 <div className="hidden sm:block w-px h-8 bg-white/5" />
                                 <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-white/20">Fiscal Value</p>
                                    <p className="text-sm font-black text-yellow-400">₹{order.total_amount}</p>
                                 </div>
                              </div>
                              
                              <div className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border shadow-lg ${
                                order.status?.toLowerCase() === 'delivered' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
                                order.status?.toLowerCase() === 'pending' ? 'bg-yellow-400/10 border-yellow-400/20 text-yellow-400' :
                                'bg-blue-500/10 border-blue-500/20 text-blue-500'
                              }`}>
                                {order.status}
                              </div>
                           </div>

                           {/* ITEM LIST */}
                           <div className="p-8 space-y-8">
                             {order.items.map((item, idx) => (
                                <div key={idx} className="flex flex-col sm:flex-row items-center gap-6 group">
                                   <div className="w-16 h-16 bg-[#1A2244] border border-white/10 rounded-2xl overflow-hidden grow-0 shrink-0">
                                      <img src={item.image_url} className="w-full h-full object-contain p-2" alt="" />
                                   </div>
                                   <div className="flex-1 text-center sm:text-left">
                                      <p className="text-xs font-black uppercase tracking-tight text-white group-hover:text-yellow-400 transition-colors">{item.name}</p>
                                      <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mt-1">Size: {item.size} · Quantity: {item.quantity}</p>
                                   </div>
                                   <div className="flex gap-2">
                                      {order.status?.toLowerCase() === 'delivered' && !['returned', 'return_requested', 'cancelled'].includes((item.status || 'active').toLowerCase()) && (
                                         <button onClick={() => handleOpenReviewModal(item.product_id, item)} className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest hover:bg-yellow-400 hover:text-black hover:border-yellow-400 transition-all">Submit Briefing</button>
                                      )}
                                      
                                      {order.status?.toLowerCase() === 'delivered' && isWithinReturnWindow(order.created_at) && !['returned', 'return_requested', 'return_rejected', 'cancelled'].includes((item.status || 'active').toLowerCase()) && (
                                         <button onClick={() => handleOpenReturnModal(item)} className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-orange-500/80 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all">Return Asset</button>
                                      )}

                                      {["pending", "confirmed"].includes(order.status?.toLowerCase()) && (item.status || 'active').toLowerCase() !== 'cancelled' && (
                                         <button onClick={() => handleCancelItem(item.id)} className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-red-500/50 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all">Abort</button>
                                      )}

                                      {item.status?.toLowerCase() === 'return_requested' && (
                                         <span className="px-5 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[9px] font-black uppercase tracking-widest text-purple-400">Return Requested</span>
                                      )}
                                      {item.status?.toLowerCase() === 'return_rejected' && (
                                         <span className="px-5 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-[9px] font-black uppercase tracking-widest text-red-500" title={item.return_admin_comment}>Return Rejected</span>
                                      )}
                                      {item.status?.toLowerCase() === 'returned' && (
                                         <span className="px-5 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-[9px] font-black uppercase tracking-widest text-green-500">Refunded</span>
                                      )}
                                      {item.status?.toLowerCase() === 'cancelled' && (
                                         <span className="px-5 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-[9px] font-black uppercase tracking-widest text-red-500">Aborted</span>
                                      )}
                                   </div>
                                </div>
                             ))}
                           </div>

                           {/* FOOTER STRIP */}
                           <div className="p-6 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
                              <div className="flex flex-wrap items-center gap-6">
                                 <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${order.payment_status?.toLowerCase() === 'paid' ? 'bg-green-500' : 'bg-yellow-400'}`} />
                                    <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Transmission: {order.payment_status || 'PENDING'}</p>
                                 </div>
                                 {order.payment_status?.toLowerCase() === 'paid' && (
                                   <button onClick={() => handleDownloadInvoice(order.id)} className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-blue-500 hover:underline">
                                      <FileText size={12} /> Retrieve Invoice
                                   </button>
                                 )}
                              </div>
                              {["pending", "confirmed"].includes((order.status || "").toLowerCase()) && (
                                <button onClick={() => handleCancelOrder(order.id)} className="text-[9px] font-black uppercase tracking-widest text-red-500/60 hover:text-red-500 transition-all">Abort Deployment</button>
                              )}
                           </div>
                        </div>
                      ))
                    )}
                 </div>
               )}

               {/* ================= LOGISTICS COORDINATES (ADDRESSES) ================= */}
               {activeTab === "addresses" && (
                 <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                    <div className="flex items-center justify-between">
                       <p className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-4">Authorized Sectors: {addresses.length} / 3</p>
                       {!isAddingAddress && addresses.length < 3 && (
                         <button onClick={() => setIsAddingAddress(true)} className="bg-white text-black px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-yellow-400 transition-all">Register New Sector</button>
                       )}
                    </div>

                    {isAddingAddress ? (
                       <div className="bg-[#111836]/60 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-8 space-y-8">
                          <h2 className="text-xl font-black uppercase tracking-tight">{editingAddress ? 'Update' : 'Initialize'} Coordinate Registry</h2>
                          <form onSubmit={handleAddressSubmit} className="space-y-6">
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="col-span-2 space-y-2">
                                   <p className="text-[9px] font-black uppercase text-white/20 ml-4 tracking-widest">Target Appellation</p>
                                   <input required value={addressForm.name} onChange={e => setAddressForm({...addressForm, name: e.target.value})} className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest outline-none focus:border-yellow-400" />
                                </div>
                                <div className="space-y-2">
                                   <p className="text-[9px] font-black uppercase text-white/20 ml-4 tracking-widest">Comm Contact (Phone)</p>
                                   <input required value={addressForm.phone} onChange={e => setAddressForm({...addressForm, phone: e.target.value})} className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest outline-none focus:border-yellow-400" />
                                </div>
                                <div className="space-y-2">
                                   <p className="text-[9px] font-black uppercase text-white/20 ml-4 tracking-widest">Sector PIN Code</p>
                                   <input required value={addressForm.pincode} onChange={e => setAddressForm({...addressForm, pincode: e.target.value})} className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest outline-none focus:border-yellow-400" />
                                </div>
                                <div className="col-span-2 space-y-2">
                                   <p className="text-[9px] font-black uppercase text-white/20 ml-4 tracking-widest">Detailed Coordinates</p>
                                   <textarea required value={addressForm.address_line} onChange={e => setAddressForm({...addressForm, address_line: e.target.value})} className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest outline-none focus:border-yellow-400 min-h-[100px]" />
                                </div>
                                <div className="space-y-2">
                                   <p className="text-[9px] font-black uppercase text-white/20 ml-4 tracking-widest">City Hub</p>
                                   <input required value={addressForm.city} onChange={e => setAddressForm({...addressForm, city: e.target.value})} className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest outline-none focus:border-yellow-400" />
                                </div>
                                <div className="space-y-2">
                                   <p className="text-[9px] font-black uppercase text-white/20 ml-4 tracking-widest">Region / State</p>
                                   <input required value={addressForm.state} onChange={e => setAddressForm({...addressForm, state: e.target.value})} className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest outline-none focus:border-yellow-400" />
                                </div>
                             </div>
                             <div className="flex gap-4 pt-4 border-t border-white/5">
                                <button type="submit" className="bg-yellow-400 text-black px-10 py-4 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-yellow-500 transition-all">Authorize Registration</button>
                                <button type="button" onClick={() => setIsAddingAddress(false)} className="px-10 py-4 rounded-full font-black text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-all">Abort</button>
                             </div>
                          </form>
                       </div>
                    ) : addresses.length === 0 ? (
                       <div className="bg-[#111836]/60 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-32 text-center space-y-8">
                          <MapPin size={48} className="mx-auto text-white/10" />
                          <div className="space-y-2">
                             <h3 className="text-xl font-black uppercase tracking-tight">No Operational Sectors</h3>
                             <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Register delivery coordinates for prioritized logistics.</p>
                          </div>
                          <button onClick={() => setIsAddingAddress(true)} className="bg-white text-black px-10 py-4 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-yellow-400 transition-all shadow-xl">Register First Sector</button>
                       </div>
                    ) : (
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {addresses.map((addr) => (
                             <div key={addr.id} className="bg-[#111836]/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 space-y-6 hover:border-white/20 transition-all duration-500 group">
                                <div className="flex justify-between items-start">
                                   <div className="bg-white/5 px-4 py-1.5 rounded-full border border-white/10">
                                      <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Sector {addresses.indexOf(addr) + 1}</p>
                                   </div>
                                   <div className="flex gap-2">
                                      <button onClick={() => handleEditAddress(addr)} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-yellow-400 hover:border-yellow-400/40 transition-all"><Pencil size={14} /></button>
                                      <button onClick={() => handleDeleteAddress(addr.id)} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-red-500 hover:border-red-500/40 transition-all"><Trash2 size={14} /></button>
                                   </div>
                                </div>
                                <div className="space-y-1">
                                   <h3 className="text-xl font-black uppercase tracking-tight">{addr.name}</h3>
                                   <p className="text-[10px] font-bold text-white/50">{addr.phone}</p>
                                </div>
                                <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                                   <p className="text-xs font-bold text-white/60 leading-relaxed uppercase tracking-wide">{addr.address_line}</p>
                                   <p className="text-[10px] font-black text-white/20 mt-2 uppercase tracking-widest">{addr.city}, {addr.state} - {addr.pincode}</p>
                                </div>
                             </div>
                          ))}
                       </div>
                    )}
                 </div>
               )}

               {/* ================= PROTOCOLS (COUPONS) ================= */}
               {activeTab === "coupons" && (
                 <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                    {coupons.length === 0 ? (
                       <div className="bg-[#111836]/60 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-32 text-center space-y-6">
                          <Tag size={48} className="mx-auto text-white/10" />
                          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">No active protocols detected.</p>
                       </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {coupons.map(c => (
                          <div key={c.id} className="bg-[#111836]/60 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-8 space-y-4 hover:border-yellow-400/50 transition-all group duration-300">
                             <div className="flex items-start justify-between">
                                <div className="bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest group-hover:bg-yellow-400 group-hover:text-black transition-all shadow-sm">
                                   {c.code}
                                </div>
                                <Tag size={20} className="text-white/10 group-hover:text-yellow-400 transition-colors" />
                             </div>
                             <div>
                                <p className="text-3xl font-black uppercase tracking-tighter text-white">
                                   {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}
                                </p>
                                <p className="text-[10px] font-bold text-white/40 uppercase mt-2">
                                   {c.minimum_order_amount > 0 ? `Valid on orders above ₹${c.minimum_order_amount}` : 'No minimum order value limits.'}
                                </p>
                                <p className="text-[9px] font-bold text-white/20 uppercase mt-1">
                                   Expires: {new Date(c.expiry_date).toLocaleDateString()}
                                </p>
                             </div>
                          </div>
                        ))}
                      </div>
                    )}
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        productId={selectedProduct}
        orderItem={selectedOrderItem}
        initialReview={existingReview}
        onSuccess={() => {}}
      />
      <ReturnModal
        isOpen={isReturnModalOpen}
        onClose={() => setReturnModalOpen(false)}
        orderItem={returnItem}
        onSuccess={async () => {
           const updated = await api.getOrdersByUser();
           setOrders(updated);
        }}
      />
    </UserLayout>
  );
}
