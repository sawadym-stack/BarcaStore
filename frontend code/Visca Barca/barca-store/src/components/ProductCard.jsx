import { Link, useNavigate } from "react-router-dom";
import { Heart, ArrowRight } from "lucide-react";
import { useContext, useMemo } from "react";
import { StoreContext } from "../contexts/StoreContext";
import { toast } from "react-toastify";

export default function ProductCard({ p }) {
  const isOutOfStock = p.stock === 0 || p.outOfStock;
  const navigate = useNavigate();

  const {
    wishlist,
    addToWishlist,
    removeFromWishlist,
  } = useContext(StoreContext);

  // ✅ SOURCE OF TRUTH (sync with context)
  const wishlisted = useMemo(
    () => wishlist.some((item) => item.id === p.id),
    [wishlist, p.id]
  );

  const goToDetail = () => {
    navigate(`/product/${p.id}`);
  };

  const handleWishlist = (e) => {
    e.stopPropagation();

    if (wishlisted) {
      removeFromWishlist(p.id);
      toast.info("Removed from wishlist.");
    } else {
      addToWishlist(p);
      toast.success("Added to wishlist.");
    }
  };

  return (
    <div
      onClick={goToDetail}
      className="group relative bg-[#111836] border border-white/5 rounded-[2rem] shadow-xl hover:shadow-[0_20px_50px_rgba(0,0,0,0.4)] transition-all duration-500 overflow-hidden cursor-pointer"
    >
      {/* ===== PREMIUM WISHLIST BUTTON ===== */}
      <button
        onClick={handleWishlist}
        aria-label="Toggle wishlist"
        className="absolute top-5 right-5 z-20 transition-all duration-300 hover:scale-110 active:scale-90"
      >
        <div className="bg-black/20 backdrop-blur-md border border-white/10 p-2.5 rounded-full shadow-lg group/heart">
          <Heart
            size={18}
            className={`
              transition-all duration-300
              ${wishlisted
                ? "fill-red-500 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                : "text-white/70 group-hover/heart:text-red-400"
              }
            `}
          />
        </div>
      </button>

      {/* STATUS BADGES */}
      {isOutOfStock && (
        <div className="absolute top-5 left-5 z-20">
          <span className="bg-red-600/90 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-red-500/50 shadow-lg">
            Sold Out
          </span>
        </div>
      )}

      {/* IMAGE CONTAINER */}
      <div className="relative w-full h-64 flex items-center justify-center p-8 bg-gradient-to-br from-white/5 to-transparent overflow-hidden">
        <div className="absolute inset-0 bg-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <img
          src={p.image_url || p.img}
          alt={p.name}
          className="h-full object-contain transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-3"
        />
      </div>

      {/* CONTENT */}
      <div className="p-6 pt-2 space-y-3">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400/80">
            {p.category || "Official Kit"}
          </p>
          <h3 className="font-bold text-white text-base leading-tight group-hover:text-yellow-400 transition-colors">
            {p.name}
          </h3>
        </div>

        <div className="flex items-center justify-between pt-2">
          <p className="text-xl font-black text-white tracking-tighter">
            ₹{p.price?.toLocaleString()}
          </p>
          <div className="text-[10px] font-black text-yellow-400 uppercase tracking-widest flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
            Analyze Details <ArrowRight size={12} />
          </div>
        </div>
      </div>
    </div>
  );
}
