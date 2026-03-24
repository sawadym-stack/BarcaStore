import AdminLayout from "../../layouts/AdminLayout";
import { useContext, useMemo, useState, useEffect } from "react";
import { UserContext } from "../../contexts/UserContext";
import { AuthContext } from "../../contexts/AuthContext";
import * as api from "../../api/api";
import {
  Users,
  UserCheck,
  Shield,
  ShoppingCart,
  Search,
  Eye,
  X,
  Mail,
  Phone,
  Calendar,
  Activity,
  UserPlus,
  ChevronRight
} from "lucide-react";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function AdminUsers() {
  const { users, updateUser } = useContext(UserContext);
  const { user: currentUser } = useContext(AuthContext);
  const isSuperAdmin = currentUser?.role === "superadmin";

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [orders, setOrders] = useState([]);
  const [viewUser, setViewUser] = useState(null);

  /* fetch orders */
  useEffect(() => {
    api.getOrders().then(setOrders);
  }, []);

  const ordersCountByUser = (userId) => orders.filter((o) => o.user_id === userId).length;

  /* ---------------- FILTER USERS ---------------- */
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (u.role === "superadmin") return false;
      const q = search.toLowerCase();
      const matchSearch = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.phone || "").includes(q) || String(u.id).toLowerCase().includes(q);
      const matchRole = roleFilter === "all" || u.role === roleFilter;
      const matchStatus = statusFilter === "all" || (u.status || "Active") === statusFilter;
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  /* ---------------- STATS ---------------- */
  const activeUsers = users.filter((u) => (u.status || "Active") !== "Suspended").length;
  const admins = users.filter((u) => u.role === "admin").length;

  return (
    <AdminLayout>
      <div className="space-y-8 pb-12">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-end gap-6 bg-white p-8 sm:p-12 rounded-[3.5rem] shadow-xl border border-gray-100 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
             <Users size={300} />
          </div>
          <div className="space-y-2 relative z-10">
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter">User <span className="text-blue-600">Directory</span></h1>
            <p className="text-sm text-gray-500 font-medium">Global permissions and account management console</p>
          </div>
          <div className="flex items-center gap-3 bg-blue-50 px-6 py-3 rounded-2xl border border-blue-100 shadow-sm relative z-10">
             <div className="p-2 bg-blue-600 rounded-lg text-white shadow-lg"><UserPlus size={16}/></div>
             <div className="flex flex-col">
               <span className="text-[10px] font-black uppercase text-blue-900 tracking-widest">Active Seats</span>
               <span className="text-lg font-black text-blue-600 tracking-tighter">{activeUsers} / {users.length}</span>
             </div>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatBox title="Total Members" value={users.length} icon={<Users size={22}/>} color="from-blue-600 to-blue-800" />
          <StatBox title="Online Ready" value={activeUsers} icon={<UserCheck size={22}/>} color="from-emerald-600 to-emerald-800" />
          <StatBox title="Staff/Admins" value={admins} icon={<Shield size={22}/>} color="from-rose-600 to-rose-800" />
          <StatBox title="Engagement" value={orders.length} icon={<ShoppingCart size={22}/>} color="from-amber-500 to-amber-700" />
        </div>

        {/* SEARCH + FILTER */}
        <div className="bg-white rounded-[2.5rem] p-4 sm:p-6 shadow-xl border border-gray-100 flex flex-col lg:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full lg:w-auto">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search global directory by name, email or ID..."
                className="w-full pl-16 pr-6 py-4 bg-gray-50/50 border-none rounded-2xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
              />
            </div>
            
            <div className="flex gap-4 w-full lg:w-auto">
               <div className="flex-1 lg:w-48">
                 <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="w-full bg-white text-gray-900 border-none rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest shadow-sm ring-1 ring-gray-100 focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer">
                   <option value="all">All Roles</option>
                   <option value="customer">Customer</option>
                   <option value="admin">Admin</option>
                 </select>
               </div>
               <div className="flex-1 lg:w-48">
                 <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full bg-white text-gray-900 border-none rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest shadow-sm ring-1 ring-gray-100 focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer">
                   <option value="all">All Status</option>
                   <option value="Active">Active</option>
                   <option value="Suspended">Suspended</option>
                 </select>
               </div>
            </div>
        </div>

        {/* USERS TABLE */}
        <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b">
                <th className="px-8 py-6">Member Identity</th>
                <th className="px-8 py-6">Security & Role</th>
                <th className="px-8 py-6 text-center">Status Control</th>
                <th className="px-8 py-6 text-center">Engagement</th>
                <th className="px-8 py-6 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {filteredUsers.map((u) => {
                const isActive = (u.status || "Active") !== "Suspended";
                const isAdmin = u.role === "admin";
                
                return (
                  <tr key={u.id} className="group hover:bg-blue-50/20 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-6">
                        <div className="relative">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg transform group-hover:scale-110 transition-transform ${isAdmin ? 'bg-gradient-to-br from-rose-600 to-rose-800 text-white' : 'bg-gradient-to-br from-blue-600 to-blue-800 text-white'}`}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          {isActive && <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-sm"></div>}
                        </div>
                        <div>
                          <p className="font-black text-gray-900 text-sm tracking-tight">{u.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                             <Mail size={10} className="text-gray-300" />
                             <p className="text-[11px] font-bold text-gray-500 truncate max-w-[180px]">{u.email}</p>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-8 py-6">
                       <div className="space-y-2">
                         <div className="flex items-center gap-2">
                            {isSuperAdmin ? (
                              <select 
                                value={u.role}
                                onChange={async (e) => {
                                  try { await updateUser(u.id, { role: e.target.value }); toast.success("Role updated."); } catch { toast.error("Failed."); }
                                }}
                                className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border-none focus:ring-2 cursor-pointer
                                  ${isAdmin ? 'bg-purple-100 text-purple-700 focus:ring-purple-500' : 'bg-blue-100 text-blue-700 focus:ring-blue-500'}
                                `}
                              >
                                <option value="user">Customer</option>
                                <option value="admin">Admin</option>
                              </select>
                            ) : (
                              <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                {u.role}
                              </span>
                            )}
                         </div>
                         <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-tighter pl-1">
                           <Calendar size={10} /> Joined {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                         </div>
                       </div>
                    </td>

                    <td className="px-8 py-6 text-center">
                       <select
                        value={u.status || "Active"}
                        onChange={async (e) => {
                          const newStatus = e.target.value;
                          await updateUser(u.id, { status: newStatus });
                          toast.info(`Account set to ${newStatus}`);
                        }}
                        className={`text-[10px] font-black uppercase px-4 py-2 rounded-xl border-none focus:ring-2 cursor-pointer shadow-sm
                          ${isActive ? 'bg-emerald-50 text-emerald-700 focus:ring-emerald-500' : 'bg-red-50 text-red-700 focus:ring-red-500'}
                        `}
                      >
                        <option value="Active">Active</option>
                        <option value="Suspended">Suspended</option>
                      </select>
                    </td>

                    <td className="px-8 py-6 text-center">
                       <div className="inline-flex flex-col items-center">
                          <span className="text-sm font-black text-gray-900 tracking-tighter">{ordersCountByUser(u.id)} Checkout{ordersCountByUser(u.id) !== 1 ? 's' : ''}</span>
                          <div className="flex items-center gap-1 text-[9px] font-black uppercase text-emerald-600 mt-1">
                             <Activity size={8} /> 
                             {orders.filter((o) => o.user_id === u.id && (o.status || "").toLowerCase() !== "cancelled").length} Active Orders
                          </div>
                       </div>
                    </td>

                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center">
                        <button onClick={() => setViewUser(u)} className="p-3 bg-gray-100 rounded-xl text-gray-500 hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95">
                          <Eye size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="py-32 flex flex-col items-center justify-center text-gray-300 gap-4">
              <Users size={64} strokeWidth={1} className="opacity-20" />
              <p className="font-black text-xs uppercase tracking-[0.3em]">No Users Found</p>
            </div>
          )}
        </div>
      </div>

      {/* VIEW MODAL */}
      {viewUser && (
        <Modal title="Member Intelligence" onClose={() => setViewUser(null)}>
           <div className="space-y-8 pt-4">
              <div className="flex items-center gap-6 p-6 bg-gray-50 rounded-[2.5rem] border border-gray-100">
                 <div className="w-20 h-20 rounded-[2rem] bg-blue-600 text-white flex items-center justify-center font-black text-3xl shadow-xl">
                    {viewUser.name.charAt(0).toUpperCase()}
                 </div>
                 <div className="space-y-1">
                    <h3 className="text-2xl font-black text-gray-900 tracking-tighter">{viewUser.name}</h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 align-middle">
                       <Shield size={12} className="text-blue-500"/> {viewUser.role} Account
                    </p>
                 </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <DetailItem label="Primary Email" value={viewUser.email} icon={<Mail size={16}/>} />
                 <DetailItem label="Phone Line" value={viewUser.phone || "—"} icon={<Phone size={16}/>} />
                 <DetailItem label="Status" value={viewUser.status || "Active"} icon={<Activity size={16}/>} isStatus />
                 <DetailItem label="Member Since" value={new Date(viewUser.created_at).toLocaleDateString()} icon={<Calendar size={16}/>} />
              </div>

              <div className="p-8 bg-blue-600 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform">
                   <ShoppingCart size={80} />
                 </div>
                 <div className="relative z-10 flex justify-between items-center">
                    <div className="space-y-1">
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100/60 leading-none">Commerce Level</p>
                       <p className="text-2xl font-black tracking-tighter">{ordersCountByUser(viewUser.id)} Successful Orders</p>
                    </div>
                    <ChevronRight size={32} className="text-white/20" />
                 </div>
              </div>
           </div>
        </Modal>
      )}

      <ToastContainer position="bottom-right" theme="dark" />
    </AdminLayout>
  );
}

function StatBox({ title, value, icon, color }) {
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

function DetailItem({ label, value, icon, isStatus }) {
  return (
    <div className="p-5 bg-gray-50/50 rounded-2xl border border-gray-100 flex items-start gap-4">
       <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 text-blue-600 shrink-0">
          {icon}
       </div>
       <div className="min-w-0">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
          <p className={`text-sm font-black truncate tracking-tight ${isStatus ? 'text-emerald-600' : 'text-gray-900'}`}>{value}</p>
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
