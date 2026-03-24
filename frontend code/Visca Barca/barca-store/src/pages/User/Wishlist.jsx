import { useContext } from "react";
import { StoreContext } from "../../contexts/StoreContext";
import UserLayout from "../../layouts/UserLayout";
import { Link } from "react-router-dom";
import { Trash2, ShoppingCart, Heart, ArrowRight } from "lucide-react";
import { toast } from "react-toastify";

export default function Wishlist() {
  const { wishlist, removeFromWishlist, addToCart } = useContext(StoreContext);

  const handleAddToCart = async (item) => {
    try {
      await addToCart(item);
      await removeFromWishlist(item.id);
      toast.success("Sector deployment successful: Item moved to cart.");
    } catch (err) {
      toast.error(err.message || "Protocol failure: Failed to move item.");
    }
  };

  return (
    <UserLayout>
      <div className="min-h-screen bg-[#0A102E] text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          
          {/* HEADER */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-400 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(250,204,21,0.3)]">
                  <Heart size={20} className="text-black fill-black" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-yellow-400">Personnel Interests</p>
              </div>
              <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter leading-none">
                MY <span className="text-white/20">WISHLIST</span>
              </h1>
            </div>
            <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-full hidden md:block">
               <p className="text-xs font-bold uppercase tracking-widest text-white/60">
                 Active Assets: <span className="text-white">{wishlist.length}</span>
               </p>
            </div>
          </div>

          {wishlist.length === 0 ? (
            <div className="py-32 text-center space-y-8 bg-[#111836]/40 backdrop-blur-2xl border border-white/5 rounded-[3rem]">
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10">
                <Heart size={40} className="text-white/10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black uppercase tracking-tight">Registry Empty</h2>
                <p className="text-white/40 font-medium uppercase tracking-widest text-xs">No assets currently marked for secondary acquisition.</p>
              </div>
              <Link
                to="/shop"
                className="inline-flex items-center gap-3 bg-white text-black px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:bg-yellow-400 transition-all duration-300"
              >
                Access Collection <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {wishlist.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#111836]/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6 flex flex-col md:flex-row items-center gap-8 group hover:border-white/20 transition-all duration-500"
                >
                  {/* VISUAL */}
                  <div className="w-40 h-40 bg-[#1A2244] rounded-[2rem] overflow-hidden border border-white/5 grow-0 shrink-0">
                    <img
                      src={item.img || item.image || item.image_url}
                      alt={item.name}
                      className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>

                  {/* INTEL */}
                  <div className="flex-1 text-center md:text-left space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-yellow-400 opacity-60">Barca Authentic Asset</p>
                    <h3 className="text-2xl font-black uppercase tracking-tight group-hover:text-yellow-400 transition-colors">
                      {item.name}
                    </h3>
                    <div className="flex items-center justify-center md:justify-start gap-3">
                      <p className="text-2xl font-black text-white">₹{item.price}</p>
                      <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/20">In Stock Ready</p>
                    </div>
                  </div>

                  {/* COMMANDS */}
                  <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-64">
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="flex-1 flex items-center justify-center gap-3 bg-yellow-400 text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-yellow-500 transition-all shadow-xl active:scale-95"
                    >
                      <ShoppingCart size={14} />
                      Deploy to Cart
                    </button>
                    <button
                      onClick={() => {
                        removeFromWishlist(item.id);
                        toast.info("Registry updated: Asset removed.");
                      }}
                      className="flex-1 flex items-center justify-center gap-3 bg-white/5 border border-white/10 text-white/40 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500/20 hover:text-red-500 hover:border-red-500/40 transition-all active:scale-95"
                    >
                      <Trash2 size={14} />
                      Purge Asset
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </UserLayout>
  );
}
