import UserLayout from '../../layouts/UserLayout'
import { useParams, Link } from 'react-router-dom'
import { useContext, useState, useEffect } from 'react'
import { ProductContext } from '../../contexts/ProductContext'
import { StoreContext } from '../../contexts/StoreContext'
import ProductCard from '../../components/ProductCard'
import { Star, User as UserIcon, ShieldCheck, Truck, Lock, ArrowLeft } from 'lucide-react'
import * as api from '../../api/api'

export default function ProductDetails() {
  const { id } = useParams()
  const { products } = useContext(ProductContext)
  const { cart, addToCart } = useContext(StoreContext);

  const product = products.find(p => String(p.id) === String(id))
  const [selectedSize, setSelectedSize] = useState('M')
  const [reviews, setReviews] = useState([])
  const [stats, setStats] = useState({ average_rating: 0 })
  const [loadingReviews, setLoadingReviews] = useState(true)

  useEffect(() => {
    window.scrollTo(0, 0);
    if (id) {
      setLoadingReviews(true)
      api.getProductReviews(id)
        .then(data => {
          setReviews(data.reviews || [])
          setStats(data.stats || { average_rating: 0 })
        })
        .catch(() => {})
        .finally(() => setLoadingReviews(false))
    }
  }, [id])

  if (!product) return (
    <UserLayout>
      <div className="min-h-screen bg-[#0A102E] flex items-center justify-center text-white">
        <div className="text-center space-y-6">
          <p className="text-sm font-black uppercase tracking-[0.5em] text-yellow-400">Error Protocol</p>
          <h1 className="text-4xl font-black uppercase">Asset Not Found</h1>
          <Link to="/shop" className="inline-block bg-white text-black px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest">Return to Base</Link>
        </div>
      </div>
    </UserLayout>
  )

  const related = products.filter(p => p.id !== product.id && p.category === product.category).slice(0, 4)

  const getStockForSize = (size) => {
    switch (size) {
      case 'S': return product.stock_s || 0;
      case 'M': return product.stock_m || 0;
      case 'L': return product.stock_l || 0;
      case 'XL': return product.stock_xl || 0;
      default: return 0;
    }
  };

  const currentStock = getStockForSize(selectedSize);
  const isOutOfStock = currentStock === 0;

  const isInCart = cart.some(
    (item) => item.id === product.id && item.selectedSize === selectedSize
  );

  const getDisplayCategory = (item, size) => {
    const isAccessory = ["caps", "accessories"].includes((item.category || "").toLowerCase());
    if (size === "S" && !isAccessory) return "JUNIOR SQUAD KIT";

    const nameLower = (item.name || "").toLowerCase();
    if (nameLower.includes("home")) return "OFFICIAL HOME KIT";
    if (nameLower.includes("away")) return "OFFICIAL AWAY KIT";
    if (nameLower.includes("training")) return "TACTICAL TRAINING";
    if (nameLower.includes("sleeve")) return "SLEEVE COMPONENT";

    return (item.category || "EQUIPMENT").toUpperCase();
  };

  return (
    <UserLayout>
      <div className="min-h-screen bg-[#0A102E] text-white">
        {/* BREADCRUMB / BACK */}
        <div className="max-w-7xl mx-auto px-6 pt-12 pb-6">
          <Link to="/shop" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors group">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Return to Collection
          </Link>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-12 xl:gap-20">
          
          {/* LEFT: VISUAL ASSET */}
          <div className="lg:col-span-7 space-y-8">
            <div className="relative aspect-square bg-[#111836] rounded-[3rem] overflow-hidden border border-white/10 group shadow-2xl">
              <img 
                src={product.image_url || product.img} 
                alt={product.name} 
                className="w-full h-full object-contain p-12 transition-transform duration-1000 group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
              
              {isOutOfStock && (
                <div className="absolute top-8 left-8 bg-red-600 text-white text-[10px] font-bold px-4 py-2 rounded-full shadow-lg">
                  DEPLETED
                </div>
              )}
            </div>

            {/* SPECS GRID */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Material Composition</p>
                <p className="text-sm font-bold uppercase">100% Recycled Polyester</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Care Protocol</p>
                <p className="text-sm font-bold uppercase">Machine Wash Cold</p>
              </div>
            </div>
          </div>

          {/* RIGHT: INTELLIGENCE PANEL */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-yellow-400">{getDisplayCategory(product, selectedSize)}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">v.2025.0</span>
              </div>
              <h1 className="text-5xl font-black uppercase tracking-tighter leading-none">{product.name}</h1>
              
              <div className="flex items-end gap-4">
                <p className="text-4xl font-black text-white">₹{product.price}</p>
                <p className="text-white/20 text-xs font-bold uppercase tracking-widest pb-1 mb-1 border-b border-white/10">Authorized Price</p>
              </div>
            </div>

            <p className="text-white/60 text-sm leading-relaxed font-medium uppercase tracking-wide">
              {product.description}
            </p>

            {/* SIZE SELECTOR */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Select Dimension</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-yellow-400">Inventory: {currentStock} Units</p>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {['S', 'M', 'L', 'XL'].map(size => {
                    const sizeStock = getStockForSize(size);
                    const disabled = sizeStock === 0;
                    return (
                        <button
                          key={size}
                          disabled={disabled}
                          onClick={() => setSelectedSize(size)}
                          className={`
                            py-4 rounded-2xl font-black text-xs transition-all duration-300 border
                            ${selectedSize === size 
                                ? 'bg-yellow-400 border-yellow-400 text-black shadow-[0_0_20px_rgba(250,204,21,0.3)]' 
                                : disabled
                                    ? 'bg-transparent border-white/5 text-white/10 cursor-not-allowed'
                                    : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20'}
                          `}
                        >
                          {size}
                        </button>
                    )
                })}
              </div>
            </div>

            {/* ACTION CENTER */}
            <div className="pt-4 space-y-4">
              <button
                disabled={isOutOfStock}
                onClick={() => {
                  if (!isInCart) {
                    addToCart(product, selectedSize);
                  } else {
                    window.location.href = "/cart";
                  }
                }}
                className={`
                  w-full py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] transition-all duration-300 shadow-2xl
                  ${isOutOfStock
                    ? "bg-white/5 text-white/20 border border-white/5 cursor-not-allowed"
                    : isInCart
                      ? "bg-white text-black hover:bg-yellow-400 transition-colors"
                      : "bg-yellow-400 text-black hover:bg-yellow-500 scale-[1.02] hover:scale-[1.05]"
                  }
                `}
              >
                {isOutOfStock ? "Depleted Stock" : isInCart ? "Access Cart Protocol" : "Authorize Add to Cart"}
              </button>

              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="flex flex-col items-center gap-2 text-center">
                    <Truck size={18} className="text-yellow-400 opacity-50" />
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40 leading-tight">Priority<br/>Deployment</p>
                </div>
                <div className="flex flex-col items-center gap-2 text-center">
                    <ShieldCheck size={18} className="text-yellow-400 opacity-50" />
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40 leading-tight">Authentic<br/>Guaranteed</p>
                </div>
                <div className="flex flex-col items-center gap-2 text-center">
                    <Lock size={18} className="text-yellow-400 opacity-50" />
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40 leading-tight">Secure<br/>Transmission</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* REVIEWS PROTOCOL */}
        <section className="max-w-7xl mx-auto px-6 py-24 border-t border-white/5">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-yellow-400">Intelligence Briefings</p>
              <h2 className="text-5xl font-black uppercase tracking-tighter">Personnel Reviews</h2>
            </div>
            <div className="flex items-center gap-6 bg-white/5 px-6 py-3 rounded-full border border-white/10">
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        size={12}
                        className={Number(stats.average_rating) >= star ? "fill-yellow-400 text-yellow-400" : "text-white/10"}
                    />
                    ))}
                </div>
                <span className="text-sm font-black">{Number(stats.average_rating || 0).toFixed(1)}</span>
                <span className="text-xs font-bold text-white/40 uppercase tracking-widest">{reviews.length} Responses</span>
            </div>
          </div>

          {loadingReviews ? (
            <div className="flex justify-center py-24">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-yellow-400 border-transparent"></div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-24 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
              <p className="text-white/20 font-black uppercase tracking-[0.4em] text-sm">No briefings submitted for this asset.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {reviews.map((review) => (
                <div key={review.id} className="p-8 rounded-[3rem] bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-500 group">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden bg-[#111836] border border-white/10 flex items-center justify-center grow-0 shrink-0">
                        {review.user_photo ? (
                          <img
                            src={api.profilePhotoUrl(review.user_photo)}
                            alt={review.user_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <UserIcon size={20} className="text-white/20" />
                        )}
                      </div>
                      <div>
                        <p className="font-black text-xs uppercase tracking-widest text-white">{review.user_name || "REDACTED"}</p>
                        <div className="flex gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={10}
                              className={review.rating >= star ? "fill-yellow-400 text-yellow-400" : "text-white/10"}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/20">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-white/60 leading-relaxed font-medium italic">"{review.comment}"</p>
                  <div className="mt-6 flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    <span className="text-[10px] text-green-500 font-black uppercase tracking-[0.2em]">Verified Transaction</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* RELATED SECTOR */}
        <section className="bg-[#0A102E] pb-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col mb-12">
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-yellow-400 mb-2">Adjacent Intelligence</p>
               <h2 className="text-4xl font-black uppercase tracking-tighter">COMPLETE THE LOADOUT</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {related.map(p => <ProductCard key={p.id} p={p} />)}
            </div>
          </div>
        </section>
      </div>
    </UserLayout>
  )
}
