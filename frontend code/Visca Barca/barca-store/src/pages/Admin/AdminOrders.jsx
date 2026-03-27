import AdminLayout from "../../layouts/AdminLayout";
import { useEffect, useState, useMemo } from "react";
import * as api from "../../api/api";
import {
  Search,
  Eye,
  Trash2,
  Filter,
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  FileText,
  CreditCard,
  MapPin,
  Lock,
  ArrowRight,
  TrendingUp,
  X,
  ShoppingCart,
  Activity
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const statusColors = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  confirmed: "bg-blue-100 text-blue-700 border-blue-200",
  shipped: "bg-indigo-100 text-indigo-700 border-indigo-200",
  delivered: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelled: "bg-rose-100 text-rose-700 border-rose-200",
};

const statusRanks = {
  pending: 1,
  confirmed: 2,
  shipped: 3,
  delivered: 4,
  cancelled: 0,
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const data = await api.getOrders();
      setOrders(data || []);
    } catch (err) {
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        (o.order_id || "").toLowerCase().includes(q) ||
        (o.user_name || "").toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || (o.status || "").toLowerCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  const updateStatus = async (orderId, newStatus) => {
    try {
      await api.updateOrder(orderId, { status: newStatus });
      toast.success(`Order set to ${newStatus}`);
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        const updated = await api.getOrders();
        const found = updated.find(o => o.id === orderId);
        if (found) setSelectedOrder(found);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Update failed");
    }
  };

  const updatePaymentStatus = async (orderId, newStatus) => {
    try {
      await api.updateOrderPaymentStatus(orderId, newStatus);
      toast.success(`Payment set to ${newStatus}`);
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        const updated = await api.getOrders();
        const found = updated.find(o => o.id === orderId);
        if (found) setSelectedOrder(found);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Payment update failed");
    }
  };

  const handleManualRefundItem = async (orderId, itemId) => {
    try {
      await api.refundOrderItem(itemId);
      toast.success("Item Marked as Refunded");
      fetchOrders();
      const updated = await api.getOrders();
      const found = updated.find(o => o.id === orderId);
      if (found) setSelectedOrder(found);
    } catch (err) {
      toast.error("Refund failed");
    }
  };

  const handleApproveReturn = async (orderId, itemId) => {
    if (!window.confirm("Approve this return request and process refund?")) return;
    try {
       await api.approveReturnOrderItem(itemId);
       toast.success("Return request approved and refunded.");
       fetchOrders();
       const updated = await api.getOrders();
       const found = updated.find(o => o.id === orderId);
       if (found) setSelectedOrder(found);
    } catch (err) {
       toast.error(err.message || "Failed to approve return");
    }
  };

  const handleRejectReturn = async (orderId, itemId) => {
    const reason = window.prompt("Rejection Reason (Optional):");
    if (reason === null) return; // cancelled
    try {
       await api.rejectReturnOrderItem(itemId, { comment: reason });
       toast.success("Return request rejected.");
       fetchOrders();
       const updated = await api.getOrders();
       const found = updated.find(o => o.id === orderId);
       if (found) setSelectedOrder(found);
    } catch (err) {
       toast.error(err.message || "Failed to reject return");
    }
  };

  const canCancel = (status) => !["shipped", "delivered", "cancelled"].includes((status || "").toLowerCase());

  return (
    <AdminLayout>
      <div className="space-y-8 pb-12">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-end gap-6 bg-white p-8 sm:p-12 rounded-[3.5rem] shadow-xl border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
             <ShoppingCart size={300} />
          </div>
          <div className="space-y-2 relative z-10">
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Package <span className="text-blue-600">Logistics</span></h1>
            <p className="text-sm text-gray-500 font-medium">Real-time order fulfillment and global shipping intelligence</p>
          </div>
          <div className="flex items-center gap-3 bg-blue-50 px-6 py-3 rounded-2xl border border-blue-100 shadow-sm relative z-10">
             <div className="p-2 bg-blue-600 rounded-lg text-white shadow-lg"><Activity size={16}/></div>
             <div className="flex flex-col">
               <span className="text-[10px] font-black uppercase text-blue-900 tracking-widest">Active Pipeline</span>
               <span className="text-lg font-black text-blue-600 tracking-tighter">
                  {orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length} Orders
               </span>
             </div>
          </div>
        </div>

        {/* QUICK STATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <StatusBox title="Pending Action" value={orders.filter(o => o.status === 'pending').length} icon={<Clock size={22}/>} color="from-amber-500 to-amber-700" />
           <StatusBox title="Confirmed" value={orders.filter(o => o.status === 'confirmed').length} icon={<CheckCircle size={22}/>} color="from-blue-600 to-blue-800" />
           <StatusBox title="Shipped" value={orders.filter(o => (o.status || '').toLowerCase() === 'shipped').length} icon={<Truck size={22}/>} color="from-indigo-600 to-indigo-800" />
           <StatusBox title="Delivered" value={orders.filter(o => (o.status || '').toLowerCase() === 'delivered').length} icon={<Package size={22}/>} color="from-emerald-600 to-emerald-800" />
        </div>

        {/* CONTROLS */}
        <div className="bg-white rounded-[2.5rem] p-4 sm:p-6 shadow-xl border border-gray-100 flex flex-col lg:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full lg:w-auto">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by Order ID or Customer Name..."
                className="w-full pl-16 pr-6 py-4 bg-gray-50/50 border-none rounded-2xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
              />
            </div>
            
            <div className="flex gap-4 w-full lg:w-auto">
               <div className="flex-1 lg:w-64">
                 <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full bg-white text-gray-900 border-none rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest shadow-sm ring-1 ring-gray-100 focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer">
                   <option value="all">Full Registry View</option>
                   <option value="pending">Pending Orders</option>
                   <option value="confirmed">Confirmed</option>
                   <option value="shipped">Shipped</option>
                   <option value="delivered">Delivered</option>
                   <option value="cancelled">Archive / Cancelled</option>
                 </select>
               </div>
            </div>
        </div>

        {/* ORDERS TABLE */}
        <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b">
                <th className="px-8 py-6">Order Information</th>
                <th className="px-8 py-6">Tier & Value</th>
                <th className="px-8 py-6 text-center">Fulfillment Status</th>
                <th className="px-8 py-6 text-center">Payment Level</th>
                <th className="px-8 py-6 text-center">Logistics Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredOrders.map((o) => (
                <tr key={o.id} className="group hover:bg-blue-50/20 transition-colors">
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <p className="font-black text-gray-900 text-sm tracking-tight">{o.order_id?.slice(-8)}</p>
                      <div className="flex items-center gap-2">
                         <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-black text-blue-800 border border-blue-200 uppercase">
                            { (o.user_name || "U").charAt(0) }
                         </div>
                         <div className="flex flex-col">
                            <p className="text-[11px] font-bold text-gray-900 truncate max-w-[150px]">{o.user_name}</p>
                            <p className="text-[9px] font-medium text-gray-400 truncate max-w-[150px]">{o.shipping_email}</p>
                         </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-8 py-6">
                     <div className="space-y-1">
                        <p className="text-sm font-black text-gray-900 tracking-tighter">₹{(o.total_amount || 0).toLocaleString()}</p>
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-tighter">{o.payment_method?.toUpperCase() || "COD"}</p>
                     </div>
                  </td>

                  <td className="px-8 py-6 text-center">
                    {["delivered", "cancelled"].includes((o.status || "").toLowerCase()) ? (
                      <div className="flex justify-center">
                        <span className={`text-[10px] font-black uppercase px-6 py-2.5 rounded-2xl border-2 transition-all shadow-md ${statusColors[o.status.toLowerCase()] || "bg-gray-100 text-gray-700"}`} disabled>
                          {o.status}
                        </span>
                      </div>
                    ) : (
                    <div className="relative group flex justify-center">
                      <select
                       value={(o.status || "pending").toLowerCase()}
                       onChange={(e) => updateStatus(o.id, e.target.value)}
                       disabled={(o.status || '').toLowerCase() === "cancelled"}
                       className={`appearance-none text-[10px] font-black uppercase pl-4 pr-10 py-2.5 rounded-2xl border-2 transition-all cursor-pointer outline-none shadow-md hover:scale-105 active:scale-95
                         ${statusColors[(o.status || '').toLowerCase()] || "bg-gray-100 text-gray-700"}
                       `}
                     >
                       {Object.keys(statusRanks).map(s => (
                         <option key={s} value={s} disabled={s !== 'cancelled' && statusRanks[s] < statusRanks[o.status]}>
                           {s}
                         </option>
                       ))}
                     </select>
                     <div className="absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity">
                        <ArrowRight size={14} className="rotate-90" />
                     </div>
                    </div>
                    )}
                  </td>

                  <td className="px-8 py-6">
                     <div className="flex justify-center">
                        <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest
                          ${o.payment_status === "Paid" ? "bg-emerald-100 text-emerald-700" : o.payment_status === "Refunded" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}
                        `}>
                           <div className={`w-1.5 h-1.5 rounded-full ${o.payment_status === "Paid" ? "bg-emerald-600" : "bg-amber-600"}`}></div>
                           {o.payment_status}
                        </span>
                     </div>
                  </td>

                  <td className="px-8 py-6">
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => setSelectedOrder(o)} className="p-3 bg-gray-100 rounded-xl text-gray-500 hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95">
                        <Eye size={18} />
                      </button>
                      {canCancel(o.status) ? (
                        <button onClick={() => updateStatus(o.id, "cancelled")} className="p-3 bg-gray-100 rounded-xl text-gray-400 hover:bg-rose-600 hover:text-white transition-all shadow-sm active:scale-95">
                          <Trash2 size={18} />
                        </button>
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-xl text-gray-200">
                           <Lock size={18} />
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ORDER DETAIL MODAL */}
        {selectedOrder && (
          <Modal title={`Operation ${selectedOrder.order_id?.slice(-8)}`} onClose={() => setSelectedOrder(null)}>
             <div className="space-y-8 pt-6">
                
                {/* QUICK ACTIONS BAR */}
                <div className="p-6 bg-blue-900 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-8 opacity-10 transform scale-150 rotate-12 group-hover:rotate-45 transition-transform duration-700">
                      <Package size={120} />
                   </div>
                   <div className="relative z-10 grid grid-cols-2 gap-6 items-center">
                      <div className="space-y-1">
                         <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100/60">Fulfillment Engine</p>
                         {["delivered", "cancelled"].includes((selectedOrder.status || "").toLowerCase()) ? (
                            <div className={`px-6 py-3 rounded-2xl border-2 text-xs font-black uppercase tracking-widest text-center ${statusColors[selectedOrder.status.toLowerCase()] || "bg-white/10 text-white"}`}>
                               {selectedOrder.status}
                            </div>
                         ) : (
                         <div className="relative group">
                            <select 
                               value={(selectedOrder.status || '').toLowerCase()} 
                               onChange={(e) => updateStatus(selectedOrder.id, e.target.value)}
                               disabled={(selectedOrder.status || '').toLowerCase() === 'cancelled'}
                               className="text-white bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl pl-5 pr-12 py-3 text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-gold appearance-none w-full shadow-xl transition-all hover:bg-white/20"
                             >
                               {Object.keys(statusRanks).map(s => (
                                 <option key={s} value={s} className="bg-blue-900" disabled={s !== 'cancelled' && statusRanks[s] < statusRanks[(selectedOrder.status || '').toLowerCase()]}>{s}</option>
                               ))}
                            </select>
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity">
                               <ArrowRight size={16} className="rotate-90" />
                            </div>
                         </div>
                         )}
                      </div>
                      <div className="space-y-1">
                         <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100/60 text-right">Payment Stream</p>
                         <div className="relative group">
                            <select 
                               value={selectedOrder.payment_status} 
                               onChange={(e) => updatePaymentStatus(selectedOrder.id, e.target.value)}
                               disabled={selectedOrder.status === 'delivered' && selectedOrder.payment_status === 'Paid'}
                               className="text-white bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl pl-5 pr-12 py-3 text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-gold appearance-none w-full text-right shadow-xl transition-all hover:bg-white/20"
                             >
                                {["Pending", "Paid", "Failed", "Refunded"].map(ps => (
                                  <option key={ps} value={ps} className="bg-blue-900" disabled={ps === 'Paid' && selectedOrder.status === 'delivered'}>{ps}</option>
                                ))}
                            </select>
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity">
                               <ArrowRight size={16} className="rotate-90" />
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                {/* INFO GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <DetailCard icon={<MapPin size={18}/>} label="Shipping Node" value={selectedOrder.shipping_address?.full_name || selectedOrder.user_name} sub={`${selectedOrder.shipping_email} • ${selectedOrder.shipping_address?.address_line}`} />
                   <DetailCard icon={<CreditCard size={18}/>} label="Finance Protocol" value={selectedOrder.payment_method?.toUpperCase()} sub={`Auth ID: ${selectedOrder.order_id?.slice(0, 8)}`} />
                </div>

                {/* ITEMS REGISTRY */}
                <div className="space-y-4">
                   <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] px-2 flex items-center justify-between">
                      Package Units <span>{selectedOrder.items?.length} items</span>
                   </h3>
                   <div className="space-y-3">
                      {selectedOrder.items?.map(item => (
                        <div key={item.id} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-colors">
                           <div className="flex items-center gap-4">
                              <img src={item.image_url} className="w-14 h-14 rounded-[1.25rem] object-cover shadow-md" />
                              <div className="space-y-0.5">
                                 <p className="text-xs font-black text-gray-900 tracking-tight">{item.product_name}</p>
                                 <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">{item.size}</span>
                                    <span className="text-[10px] font-bold text-gray-400">×{item.quantity}</span>
                                 </div>
                              </div>
                           </div>
                           <div className="text-right space-y-2">
                              {item.status === 'return_requested' ? (
                                <div className="flex flex-col items-end gap-2">
                                  <span className="text-[9px] font-black uppercase tracking-widest text-purple-600 bg-purple-50 px-3 py-1.5 rounded-full border border-purple-100">Return Requested</span>
                                  {item.return_reason && <p className="text-[10px] text-gray-500 font-bold max-w-[200px] truncate" title={item.return_reason}>Reason: {item.return_reason}</p>}
                                  <div className="flex gap-2">
                                    <button onClick={() => handleApproveReturn(selectedOrder.id, item.id)} className="text-[9px] font-black uppercase tracking-widest text-green-600 hover:text-white hover:bg-green-600 transition-colors bg-green-50 px-3 py-1.5 rounded-full border border-green-200">Approve</button>
                                    <button onClick={() => handleRejectReturn(selectedOrder.id, item.id)} className="text-[9px] font-black uppercase tracking-widest text-rose-600 hover:text-white hover:bg-rose-600 transition-colors bg-rose-50 px-3 py-1.5 rounded-full border border-rose-200">Reject</button>
                                  </div>
                                </div>
                              ) : item.status === 'return_rejected' ? (
                                <div className="flex flex-col items-end gap-1">
                                  <span className="text-[9px] font-black uppercase tracking-widest text-red-600 bg-red-50 px-3 py-1.5 rounded-full border border-red-100">Return Rejected</span>
                                  {item.return_admin_comment && <p className="text-[9px] text-gray-400 capitalize">{item.return_admin_comment}</p>}
                                </div>
                              ) : ['returned', 'Refunded'].includes(item.status) ? (
                                <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">Archived/Refunded</span>
                              ) : (
                                <button onClick={() => handleManualRefundItem(selectedOrder.id, item.id)} className="text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-rose-600 transition-colors flex items-center gap-1.5 underline underline-offset-4 decoration-dashed">
                                   Refund Unit
                                </button>
                              )}
                              <p className="text-sm font-black text-gray-900 tracking-tighter">₹{(item.price * item.quantity).toLocaleString()}</p>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="pt-6 border-t border-dashed border-gray-100 flex justify-between items-end">
                   <div className="space-y-1 text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                      <p>Protocol Date: {new Date(selectedOrder.created_at).toLocaleDateString()}</p>
                      <p>Timecode: {new Date(selectedOrder.created_at).toLocaleTimeString()}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Settlement Total</p>
                      <p className="text-3xl font-black tracking-tighter text-blue-900 animate-pulse">₹{(selectedOrder.total_amount || 0).toLocaleString()}</p>
                   </div>
                </div>
             </div>
          </Modal>
        )}

        <ToastContainer position="bottom-right" theme="dark" />
      </div>
    </AdminLayout>
  );
}

function StatusBox({ title, value, icon, color }) {
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

function DetailCard({ icon, label, value, sub }) {
  return (
    <div className="p-6 bg-gray-50/50 rounded-[2.5rem] border border-gray-100 space-y-3">
       <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-100 text-blue-600">
             {icon}
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
       </div>
       <div className="space-y-1">
          <p className="text-sm font-black text-gray-900 tracking-tight">{value}</p>
          <p className="text-[11px] font-bold text-gray-400 leading-tight">{sub}</p>
       </div>
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xl animate-in fade-in duration-500" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl rounded-[3.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] flex flex-col animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
        <div className="px-10 py-10 flex items-center justify-between border-b border-gray-100 shrink-0">
          <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">{title}</h2>
          <button onClick={onClose} className="p-3 rounded-full hover:bg-gray-100 text-gray-400 transition-all active:scale-90"><X size={28} /></button>
        </div>
        <div className="px-10 pb-10 overflow-y-auto max-h-[85vh] custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}
