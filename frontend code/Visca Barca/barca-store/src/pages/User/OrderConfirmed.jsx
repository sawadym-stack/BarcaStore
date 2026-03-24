import UserLayout from "../../layouts/UserLayout";
import { useContext, useEffect } from "react";
import { StoreContext } from "../../contexts/StoreContext";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { CheckCircle2, ArrowRight, Package, CreditCard, ShoppingBag } from "lucide-react";

export default function OrderConfirmed() {
  const { clearCart } = useContext(StoreContext);
  const nav = useNavigate();
  const location = useLocation();

  const { orderId, total, itemsCount, paymentMethod } = location.state || {};
  const isCOD = paymentMethod === "COD";

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!orderId) {
      nav("/");
    } else {
      clearCart();
    }
  }, [orderId, nav, clearCart]);

  if (!orderId) return null;

  return (
    <UserLayout>
      <div className="min-h-screen bg-[#0A102E] text-white flex items-center justify-center py-20 px-6">
        <div className="max-w-3xl w-full">
           
           {/* CINEMATIC SUCCESS HEADER */}
           <div className="text-center space-y-8 mb-16 animate-in fade-in zoom-in duration-700">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-yellow-400 blur-3xl opacity-20 scale-150 animate-pulse" />
                <div className="relative w-24 h-24 bg-yellow-400 rounded-[2rem] flex items-center justify-center shadow-[0_0_50px_rgba(250,204,21,0.4)] text-black">
                  <CheckCircle2 size={48} strokeWidth={2.5} />
                </div>
              </div>
              
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-yellow-400">Order Authorized Successfully</p>
                <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none">
                  VISCA <span className="text-white/20">BARÇA</span>
                </h1>
                <p className="text-white/40 font-black uppercase tracking-widest text-xs">Thank you for acquiring official FC Barcelona equipment.</p>
              </div>
           </div>

           {/* INTEL CARDS */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-[#111836]/60 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] text-center space-y-4 group hover:border-white/20 transition-all">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center mx-auto text-white/40 group-hover:text-yellow-400">
                   <Package size={20} />
                </div>
                <div>
                   <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-1">Asset Count</p>
                   <p className="text-xl font-black">{itemsCount} Units</p>
                </div>
              </div>
              
              <div className="bg-[#111836]/60 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] text-center space-y-4 group hover:border-white/20 transition-all">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center mx-auto text-white/40 group-hover:text-yellow-400">
                   <CreditCard size={20} />
                </div>
                <div>
                   <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-1">Fiscal Status</p>
                   <p className="text-xl font-black">₹{total}</p>
                </div>
              </div>

              <div className="bg-[#111836]/60 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] text-center space-y-4 group hover:border-white/20 transition-all">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center mx-auto text-white/40 group-hover:text-yellow-400">
                   <ShoppingBag size={20} />
                </div>
                <div>
                   <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-1">Order Protocol</p>
                   <p className="text-xs font-black uppercase truncate px-2">{orderId}</p>
                </div>
              </div>
           </div>

           {/* STATUS BRIEFING */}
           <div className="bg-white text-black p-8 rounded-[3rem] mb-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
              <div className="space-y-1">
                 <p className="text-[10px] font-black uppercase tracking-widest text-black/40">Logistics Deployment Status</p>
                 <h3 className="text-2xl font-black uppercase tracking-tight">Deployment is now being processed</h3>
                 <p className="text-[10px] font-bold text-black/60 uppercase">You will receive a confirmation link via the registered communication channel.</p>
              </div>
              <div className="bg-black/5 px-6 py-4 rounded-2xl text-center min-w-[120px]">
                 <p className="text-[9px] font-black uppercase text-black/40 mb-1">Payment</p>
                 <p className="text-xs font-black uppercase">{isCOD ? "Liquid (COD)" : "Authorized"}</p>
              </div>
           </div>

           {/* COMMANDS */}
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => nav("/profile?tab=orders")}
                className="bg-white text-black py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-yellow-400 transition-all duration-300 shadow-xl flex items-center justify-center gap-3 active:scale-95"
              >
                Profile Registry <ArrowRight size={14} />
              </button>
              <button
                onClick={() => nav("/shop")}
                className="bg-transparent border border-white/10 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-white/5 transition-all duration-300 flex items-center justify-center gap-3 active:scale-95"
              >
                Back to Collection
              </button>
           </div>

        </div>
      </div>
    </UserLayout>
  );
}
