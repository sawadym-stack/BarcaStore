import UserLayout from "../../layouts/UserLayout";
import { useContext } from "react";
import { StoreContext } from "../../contexts/StoreContext";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Trash2, Plus, Minus, ArrowRight, ShieldCheck, Truck, Lock, ShoppingBag } from "lucide-react";

export default function Cart() {
  const { cart, removeFromCart, clearCart, increaseQty, decreaseQty, updateCartItemSize } = useContext(StoreContext);
  const nav = useNavigate();
  
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = Math.round(subtotal * 0.18);
  const shipping = subtotal >= 5000 ? 0 : 250;
  const total = subtotal + tax + shipping;

  const getDisplayCategory = (item) => {
    const isAccessory = ["caps", "accessories"].includes((item.category || "").toLowerCase());
    if (item.selectedSize === "S" && !isAccessory) return "JUNIOR SQUAD";
    
    const nameLower = (item.name || "").toLowerCase();
    if (nameLower.includes("home")) return "HOME KIT";
    if (nameLower.includes("away")) return "AWAY KIT";
    if (nameLower.includes("training")) return "TRAINING";
    return (item.category || "EQUIPMENT").toUpperCase();
  };

  return (
    <UserLayout>
      <div className="min-h-screen bg-[#0A102E] text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          
          {/* HEADER */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-400 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(250,204,21,0.3)] text-black">
                  <ShoppingBag size={20} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-yellow-400">Inventory Allocation</p>
              </div>
              <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter leading-none">
                SHOPPING <span className="text-white/20">CART</span>
              </h1>
            </div>
            <Link to="/shop" className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors border-b border-white/10 pb-1">
              Continue Acquisition
            </Link>
          </div>

          {cart.length === 0 ? (
            <div className="py-32 text-center space-y-8 bg-[#111836]/40 backdrop-blur-2xl border border-white/5 rounded-[3rem]">
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10">
                <ShoppingBag size={40} className="text-white/10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black uppercase tracking-tight">Cart Empty</h2>
                <p className="text-white/40 font-medium uppercase tracking-widest text-xs">No assets currently allocated for checkout.</p>
              </div>
              <Link
                to="/shop"
                className="inline-flex items-center gap-3 bg-white text-black px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:bg-yellow-400 transition-all duration-300"
              >
                Access Store <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              
              {/* ASSET LIST */}
              <div className="lg:col-span-8 space-y-6">
                <div className="bg-[#111836]/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] overflow-hidden">
                   <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Allocated Assets: {cart.length}</p>
                   </div>
                   <div className="divide-y divide-white/5">
                      {cart.map((item) => (
                        <div key={`${item.id}-${item.selectedSize}`} className="p-6 flex flex-col sm:flex-row items-center gap-8 group">
                          {/* VISUAL */}
                          <div className="w-24 h-24 bg-[#1A2244] rounded-2xl overflow-hidden border border-white/5 grow-0 shrink-0">
                            <img src={item.img || item.image || item.image_url} alt={item.name} className="w-full h-full object-contain p-2" />
                          </div>

                          {/* INTEL */}
                          <div className="flex-1 text-center sm:text-left space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-yellow-400/60">{getDisplayCategory(item)}</p>
                            <h4 className="text-lg font-black uppercase tracking-tight text-white group-hover:text-yellow-400 transition-colors leading-tight">{item.name}</h4>
                            <div className="flex items-center justify-center sm:justify-start gap-4 pt-1">
                               <div className="flex items-center gap-2">
                                  <span className="text-[9px] font-black uppercase text-white/20">Size:</span>
                                  <select 
                                    value={item.selectedSize}
                                    onChange={(e) => updateCartItemSize(item.id, item.selectedSize, e.target.value)}
                                    className="bg-white/5 border border-white/10 rounded text-[10px] font-black px-2 py-0.5 outline-none focus:border-yellow-400 transition-colors"
                                  >
                                    {["S", "M", "L", "XL"].map(s => <option key={s} value={s} className="bg-[#0A102E]">{s}</option>)}
                                  </select>
                               </div>
                               <div className="w-px h-3 bg-white/10" />
                               <div className="flex items-center gap-3">
                                  <button onClick={() => { decreaseQty(item.id, item.selectedSize); toast.info("Quantity updated."); }} className="w-6 h-6 rounded-md bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10"><Minus size={10} /></button>
                                  <span className="text-xs font-black w-4 text-center">{item.qty}</span>
                                  <button onClick={() => { increaseQty(item.id, item.selectedSize); toast.success("Quantity updated."); }} className="w-6 h-6 rounded-md bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10"><Plus size={10} /></button>
                               </div>
                            </div>
                          </div>

                          {/* PRICE & ACTION */}
                          <div className="text-center sm:text-right space-y-3 grow-0 shrink-0">
                            <div>
                               <p className="text-xl font-black text-white">₹{item.price * item.qty}</p>
                               <p className="text-[9px] font-black uppercase text-white/20 tracking-tighter mt-1">₹{item.price} UNIT</p>
                            </div>
                            <button 
                              onClick={() => { removeFromCart(item.id, item.selectedSize); toast.error("Asset purged from cart."); }}
                              className="text-[9px] font-black uppercase tracking-widest text-red-500/50 hover:text-red-500 transition-colors flex items-center justify-center sm:justify-end gap-1 w-full"
                            >
                              <Trash2 size={10} /> Purge
                            </button>
                          </div>
                        </div>
                      ))}
                   </div>
                </div>

                {/* TRUST BADGES */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                  <div className="bg-[#111836]/40 border border-white/5 p-6 rounded-[2rem] flex flex-col items-center gap-3 text-center">
                    <Truck size={24} className="text-yellow-400 opacity-40" />
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 leading-relaxed uppercase">Logistics Priority<br/><span className="text-white/60">Free over ₹5K</span></p>
                  </div>
                  <div className="bg-[#111836]/40 border border-white/5 p-6 rounded-[2rem] flex flex-col items-center gap-3 text-center">
                    <ShieldCheck size={24} className="text-yellow-400 opacity-40" />
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 leading-relaxed uppercase">Authentic Registry<br/><span className="text-white/60">Official Barça Merch</span></p>
                  </div>
                  <div className="bg-[#111836]/40 border border-white/5 p-6 rounded-[2rem] flex flex-col items-center gap-3 text-center">
                    <Lock size={24} className="text-yellow-400 opacity-40" />
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 leading-relaxed uppercase">Secure Transmission<br/><span className="text-white/60">Encrypted checkout</span></p>
                  </div>
                </div>
              </div>

              {/* SUMMARY PANEL */}
              <div className="lg:col-span-4 sticky top-32">
                 <div className="bg-[#111836]/60 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 shadow-2xl relative overflow-hidden group">
                    {/* DECORATIVE GOLD GLOW */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-yellow-400/5 rounded-full blur-[80px] group-hover:bg-yellow-400/10 transition-colors duration-700" />
                    
                    <div className="relative space-y-8">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-yellow-400/60">Fiscal Summary</p>
                        </div>
                        <h3 className="text-3xl font-black uppercase tracking-tighter text-white">ORDER <span className="text-white/20">TOTAL</span></h3>
                      </div>

                      <div className="space-y-5 pt-2">
                         <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Subtotal Status</span>
                            <span className="text-sm font-black text-white">₹{subtotal}</span>
                         </div>
                         <div className="flex justify-between items-center px-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Logistics Fee</span>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${shipping === 0 ? 'text-green-500' : 'text-white'}`}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
                         </div>
                         <div className="flex justify-between items-center px-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Protocol Tax (18%)</span>
                            <span className="text-[10px] font-black text-white">₹{tax}</span>
                         </div>
                      </div>

                      <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 flex justify-between items-end">
                         <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 mb-1">Aggregate</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-yellow-400">Authorized Value</p>
                         </div>
                         <p className="text-4xl font-black tracking-tighter text-white">₹{total}</p>
                      </div>

                      <div className="space-y-4 pt-4">
                         <button
                           onClick={() => nav("/checkout")}
                           className="w-full bg-yellow-400 text-black py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-white transition-all duration-500 shadow-[0_0_30px_rgba(250,204,21,0.2)] flex items-center justify-center gap-3 active:scale-95 group/btn"
                         >
                           Authorize Checkout <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                         </button>
                         <button
                           onClick={() => { clearCart(); toast.warn("Cart fully purged."); }}
                           className="w-full bg-white/5 border border-white/10 text-white/20 py-4 rounded-[2rem] font-black text-[9px] uppercase tracking-widest hover:text-red-500 hover:border-red-500/20 hover:bg-red-500/5 transition-all active:scale-95"
                         >
                           Purge Entire Cart
                         </button>
                      </div>

                      <div className="flex items-center justify-center gap-3 pt-4 opacity-20">
                         <div className="h-px flex-1 bg-white/10" />
                         <span className="text-[8px] font-black uppercase tracking-[0.4em]">Official Protocol</span>
                         <div className="h-px flex-1 bg-white/10" />
                      </div>
                    </div>
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </UserLayout>
  );
}
