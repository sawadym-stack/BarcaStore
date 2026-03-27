import UserLayout from "../../layouts/UserLayout";
import { toast } from "react-toastify";
import { useContext, useState, useEffect } from "react";
import { StoreContext } from "../../contexts/StoreContext";
import { AuthContext } from "../../contexts/AuthContext";
import * as api from "../../api/api";
import { useNavigate, Link } from "react-router-dom";
import { MapPin, Lock, ArrowLeft, CreditCard, ShieldCheck, CheckCircle2, Tag } from "lucide-react";

export default function Checkout() {
  const { cart, clearCart } = useContext(StoreContext);
  const { user, status } = useContext(AuthContext);
  const nav = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    if (status !== "loading" && !user) {
      toast.warn("Authentication required: Please identify to proceed.");
      nav("/login");
    }
  }, [user, status, nav]);

  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [availableCoupons, setAvailableCoupons] = useState([]);

  useEffect(() => {
    if (user) {
      api.getAddresses()
        .then(setAddresses)
        .catch(console.error);
    }
    api.getPublicCoupons()
      .then(coupons => setAvailableCoupons((coupons || []).filter(c => c.is_active)))
      .catch(console.error);
  }, [user]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = subtotal * 0.18;
  const delivery = subtotal >= 5000 ? 0 : 250;
  const total = subtotal + tax + delivery - discountAmount;

  const handleApplyCoupon = async () => {
    try {
      if (!couponCode) return;
      const data = await api.applyCoupon(couponCode, subtotal);
      setDiscountAmount(data.discount);
      setAppliedCoupon(data.coupon_code);
      toast.success(`Coupon protocol "${data.coupon_code}" activated.`);
    } catch (err) {
      toast.error(err.message || "Invalid protocol code");
      setDiscountAmount(0);
      setAppliedCoupon(null);
    }
  };

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  });

  const [paymentMethod, setPaymentMethod] = useState("COD");

  const change = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSelectAddress = (addr) => {
    setSelectedAddressId(addr.id);
    setForm({
      name: addr.name,
      email: user?.email || "",
      phone: addr.phone,
      address: addr.address_line,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      country: addr.country,
    });
  };

  const placeOrder = async (mockStatus = "success") => {
    try {
      if (!form.name || !form.email || !form.phone || !form.address || !form.city || !form.pincode) {
        return toast.error("Deployment failure: Shipping intel incomplete.");
      }

      const { name, email, phone, address, city, state, pincode } = form;

      if (!/^\d{10}$/.test(phone)) {
        toast.error("Valid communication link required (10-digit phone).");
        return;
      }

      if (!/^\d{6}$/.test(pincode)) {
        toast.error("Valid sector code required (6-digit PIN).");
        return;
      }

      const orderItems = cart.map((item) => ({
        product_id: item.id || item.product_id,
        quantity: item.qty,
        price: item.price,
        size: item.selectedSize || item.size || "M",
      }));

      const payload = {
        subtotal: parseFloat(subtotal),
        tax: parseFloat(tax),
        total_amount: parseFloat(total),
        payment_method: paymentMethod,
        shipping_name: name,
        shipping_email: email,
        shipping_phone: phone,
        shipping_address: address,
        shipping_city: city,
        shipping_state: state,
        shipping_pincode: pincode,
        coupon_code: appliedCoupon,
        discount_amount: discountAmount,
        items: orderItems,
      };

      const res = await api.createOrder(payload);
      let orderId = res.id;

      if (paymentMethod === "MOCK_ONLINE") {
        try {
          await api.createPayment({
            order_id: orderId,
            mock_status: mockStatus,
          });

          if (mockStatus === "failed") {
            toast.error("Payment transmission failed. Order status: Pending.");
            nav("/profile");
            return;
          }
        } catch (paymentErr) {
          toast.error("Transaction protocol error.");
          return;
        }
      }

      clearCart();
      toast.success("Order authorized successfully.");

      const itemsCount = cart.length;
      setTimeout(() => {
        nav("/order-confirmed", {
          state: {
            orderId: orderId || "FCB" + Date.now(),
            total,
            itemsCount,
            paymentMethod,
          },
        });
      }, 1200);
    } catch (err) {
      toast.error(err.message || "System error during authorization.");
    }
  };

  return (
    <UserLayout>
      <div className="min-h-screen bg-[#0A102E] text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          
          {/* HEADER */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div className="space-y-4">
               <Link to="/cart" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors group mb-4">
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                Return to Allocation
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-400 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(250,204,21,0.3)] text-black">
                  <Lock size={18} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-yellow-400">Checkout Protocol</p>
              </div>
              <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter leading-none">
                AUTHORIZE <span className="text-white/20">ORDER</span>
              </h1>
            </div>
            <div className="hidden lg:flex items-center gap-4 text-white/40">
                <ShieldCheck size={20} className="text-green-500" />
                <p className="text-[10px] font-black uppercase tracking-widest">End-to-End Encrypted Transmission</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* LEFT: SHIPPING & DATA */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* ADDRESS SECTOR */}
              <div className="bg-[#111836]/60 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-8 space-y-8">
                <div className="space-y-2">
                  <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                    <MapPin size={20} className="text-yellow-400" />
                    Deployment Sector
                  </h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Specify target delivery coordinates</p>
                </div>

                {addresses.length > 0 && (
                  <div className="space-y-6">
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/20">Stored Coordinates</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {addresses.map((addr) => (
                        <button
                          key={addr.id}
                          onClick={() => handleSelectAddress(addr)}
                          className={`
                            text-left p-6 rounded-[2rem] border transition-all duration-300 relative group
                            ${selectedAddressId === addr.id 
                                ? 'bg-yellow-400 border-yellow-400 text-black shadow-[0_0_30px_rgba(250,204,21,0.2)]' 
                                : 'bg-white/5 border-white/10 text-white hover:border-white/30 hover:bg-white/10'}
                          `}
                        >
                          {selectedAddressId === addr.id && (
                             <div className="absolute top-4 right-4"><CheckCircle2 size={16} /></div>
                          )}
                          <p className={`text-xs font-black uppercase mb-1 ${selectedAddressId === addr.id ? 'text-black' : 'text-white'}`}>{addr.name}</p>
                          <p className={`text-[10px] font-bold line-clamp-1 opacity-60`}>{addr.address_line}</p>
                          <p className={`text-[10px] font-bold opacity-60`}>{addr.city}, {addr.pincode}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* FORM GRID */}
                <div className="grid grid-cols-2 gap-4 pt-4">
                   <div className="col-span-2 sm:col-span-1 space-y-2">
                      <p className="text-[9px] font-black uppercase text-white/20 ml-4 tracking-widest">Full Personnel Name</p>
                      <input name="name" value={form.name} onChange={change} className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest outline-none focus:border-yellow-400 transition-all" />
                   </div>
                   <div className="col-span-2 sm:col-span-1 space-y-2">
                      <p className="text-[9px] font-black uppercase text-white/20 ml-4 tracking-widest">Comm Link (Email)</p>
                      <input name="email" value={form.email} onChange={change} className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest outline-none focus:border-yellow-400 transition-all" />
                   </div>
                   <div className="col-span-2 sm:col-span-1 space-y-2">
                      <p className="text-[9px] font-black uppercase text-white/20 ml-4 tracking-widest">Personnel Phone</p>
                      <input name="phone" value={form.phone} onChange={change} className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest outline-none focus:border-yellow-400 transition-all" />
                   </div>
                   <div className="col-span-2 sm:col-span-1 space-y-2">
                      <p className="text-[9px] font-black uppercase text-white/20 ml-4 tracking-widest">Sector PIN Code</p>
                      <input name="pincode" value={form.pincode} onChange={change} className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest outline-none focus:border-yellow-400 transition-all" />
                   </div>
                   <div className="col-span-2 space-y-2">
                      <p className="text-[9px] font-black uppercase text-white/20 ml-4 tracking-widest">Detailed Street Coordinates</p>
                      <input name="address" value={form.address} onChange={change} className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest outline-none focus:border-yellow-400 transition-all" />
                   </div>
                   <div className="col-span-2 sm:col-span-1 space-y-2">
                      <p className="text-[9px] font-black uppercase text-white/20 ml-4 tracking-widest">City / Hub</p>
                      <input name="city" value={form.city} onChange={change} className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest outline-none focus:border-yellow-400 transition-all" />
                   </div>
                   <div className="col-span-2 sm:col-span-1 space-y-2">
                      <p className="text-[9px] font-black uppercase text-white/20 ml-4 tracking-widest">State / Region</p>
                      <input name="state" value={form.state} onChange={change} className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest outline-none focus:border-yellow-400 transition-all" />
                   </div>
                </div>
              </div>

              {/* PAYMENT SECTOR */}
              <div className="bg-[#111836]/60 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-8 space-y-6">
                 <div className="space-y-2">
                    <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                      <CreditCard size={20} className="text-yellow-400" />
                      Payment Protocol
                    </h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Select funding transmission method</p>
                 </div>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button 
                      onClick={() => setPaymentMethod("COD")}
                      className={`p-6 rounded-[2rem] border transition-all flex items-center justify-between group ${paymentMethod === "COD" ? 'bg-white border-white text-black' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}
                    >
                      <span className="text-xs font-black uppercase tracking-widest">Liquid (COD)</span>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === "COD" ? 'border-black' : 'border-white/20'}`}>
                         {paymentMethod === "COD" && <div className="w-2.5 h-2.5 rounded-full bg-black" />}
                      </div>
                    </button>
                    <button 
                      onClick={() => setPaymentMethod("MOCK_ONLINE")}
                      className={`p-6 rounded-[2rem] border transition-all flex items-center justify-between group ${paymentMethod === "MOCK_ONLINE" ? 'bg-white border-white text-black' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}
                    >
                      <span className="text-xs font-black uppercase tracking-widest">Secure Online</span>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === "MOCK_ONLINE" ? 'border-black' : 'border-white/20'}`}>
                         {paymentMethod === "MOCK_ONLINE" && <div className="w-2.5 h-2.5 rounded-full bg-black" />}
                      </div>
                    </button>
                 </div>
              </div>
            </div>

            {/* RIGHT: FISCAL SUMMARY */}
            <div className="lg:col-span-5 space-y-8">
               <div className="bg-[#111836]/60 backdrop-blur-3xl border border-white/10 p-8 rounded-[3rem] shadow-2xl sticky top-32 space-y-8 overflow-hidden group">
                  {/* DECORATIVE GOLD GLOW */}
                  <div className="absolute -top-24 -right-24 w-48 h-48 bg-yellow-400/5 rounded-full blur-[80px] group-hover:bg-yellow-400/10 transition-colors duration-700" />
                  
                  <div className="relative space-y-8">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                         <p className="text-[10px] font-black uppercase tracking-[0.4em] text-yellow-400/60">Acquisition Intel</p>
                      </div>
                      <h3 className="text-3xl font-black uppercase tracking-tighter text-white">ORDER <span className="text-white/20">REVIEW</span></h3>
                    </div>

                    {/* MINI ITEM LIST */}
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                       {cart.map(item => (
                         <div key={`${item.id}-${item.selectedSize}`} className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                            <div className="w-12 h-12 bg-[#1A2244] rounded-xl flex items-center justify-center p-1 border border-white/5">
                               <img src={item.img || item.image || item.image_url} className="w-full h-full object-contain" alt="" />
                            </div>
                            <div className="flex-1 min-w-0">
                               <p className="text-[10px] font-black uppercase truncate text-white">{item.name}</p>
                               <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">SIZE: {item.selectedSize} · QTY: {item.qty}</p>
                            </div>
                            <p className="text-xs font-black text-white">₹{item.price * item.qty}</p>
                         </div>
                       ))}
                    </div>

                    {/* COUPON */}
                    <div className="pt-4 space-y-3">
                       <p className="text-[9px] font-black uppercase tracking-widest text-white/20 ml-4 leading-none">Authorized Protocol Code</p>
                       <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="CODE" 
                            value={couponCode} 
                            onChange={(e) => setCouponCode(e.target.value)} 
                            className="flex-1 bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-yellow-400 transition-all text-white placeholder:text-white/10" 
                          />
                          <button onClick={handleApplyCoupon} className="bg-white/10 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-yellow-400 hover:text-black transition-all border border-white/5">Apply</button>
                       </div>
                       {appliedCoupon && <p className="text-[9px] font-black text-green-500 uppercase tracking-widest ml-4 italic">Protocol Activated</p>}
                    </div>

                    {/* AVAILABLE COUPONS */}
                    {availableCoupons.length > 0 && !appliedCoupon && (
                       <div className="pt-2">
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-3 px-1 border-b border-white/5 pb-2">Available Protocols</p>
                          <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                             {availableCoupons.map(c => (
                                <button
                                   key={c.id}
                                   onClick={() => setCouponCode(c.code)}
                                   className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-yellow-400/30 transition-all text-left group"
                                >
                                   <div>
                                      <p className="text-[10px] font-black uppercase tracking-widest text-yellow-400 group-hover:text-yellow-300 shadow-sm">{c.code}</p>
                                      <p className="text-[8px] font-bold text-white/50 uppercase mt-0.5">
                                         {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}
                                         {c.minimum_order_amount > 0 ? ` (MIN ₹${c.minimum_order_amount})` : ''}
                                      </p>
                                   </div>
                                   <Tag size={12} className="text-white/20 group-hover:text-yellow-400 transition-colors" />
                                </button>
                             ))}
                          </div>
                       </div>
                    )}

                    {/* TOTALS */}
                    <div className="space-y-4 pt-4 border-t border-white/5">
                       <div className="flex justify-between items-center px-4">
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Base Acquisition</span>
                          <span className="text-xs font-black text-white">₹{subtotal.toFixed(2)}</span>
                       </div>
                       <div className="flex justify-between items-center px-4">
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Logistics Registry</span>
                          <span className={`text-[10px] font-black uppercase tracking-widest ${delivery === 0 ? 'text-green-500' : 'text-white'}`}>{delivery === 0 ? 'FREE' : `₹${delivery.toFixed(2)}`}</span>
                       </div>
                       <div className="flex justify-between items-center px-4">
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Protocol Tax (18%)</span>
                          <span className="text-[10px] font-black text-white">₹{tax.toFixed(2)}</span>
                       </div>
                       {discountAmount > 0 && (
                          <div className="flex justify-between items-center bg-green-500/5 p-4 rounded-2xl border border-green-500/10">
                            <span className="text-[10px] font-black uppercase tracking-widest text-green-500/60">Protocol Discount</span>
                            <span className="text-sm font-black text-green-500">-₹{discountAmount.toFixed(2)}</span>
                          </div>
                       )}
                    </div>

                    <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 flex justify-between items-end">
                      <div>
                         <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 mb-1">Grand Total</p>
                         <p className="text-[10px] font-black uppercase tracking-widest text-yellow-400">Authorized Value</p>
                      </div>
                      <p className="text-4xl font-black tracking-tighter text-white">₹{total.toFixed(2)}</p>
                    </div>

                    {/* ACTIONS */}
                    <div className="pt-4 space-y-4">
                      {paymentMethod === "MOCK_ONLINE" ? (
                        <div className="space-y-3">
                          <p className="text-[9px] font-black uppercase tracking-widest text-white/20 text-center">Outcome Simulation Required</p>
                          <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => placeOrder("success")} className="bg-green-600 text-white py-5 rounded-[2rem] font-black text-[9px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg">Authorize Success</button>
                            <button onClick={() => placeOrder("failed")} className="bg-white/5 border border-white/10 text-red-500 py-5 rounded-[2rem] font-black text-[9px] uppercase tracking-widest hover:bg-red-500/5 hover:border-red-500/20 active:scale-95 transition-all">Simulate Failure</button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => placeOrder()}
                          className="w-full bg-yellow-400 text-black py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-white transition-all duration-500 shadow-[0_0_30px_rgba(250,204,21,0.2)] flex items-center justify-center gap-3 active:scale-95 group/btn"
                        >
                          <Lock size={14} className="group-hover/btn:scale-110 transition-transform" /> Authorize Order
                        </button>
                      )}
                      
                      <div className="flex items-center justify-center gap-2 opacity-20">
                         <ShieldCheck size={12} />
                         <p className="text-[8px] font-black text-center uppercase tracking-[0.2em]">Authorized Transaction Protocol · 256-Bit SSL Secured</p>
                      </div>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
