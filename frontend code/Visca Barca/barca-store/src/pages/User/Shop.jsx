import UserLayout from "../../layouts/UserLayout";
import { useContext, useState } from "react";
import { ProductContext } from "../../contexts/ProductContext";
import { StoreContext } from "../../contexts/StoreContext";
import FilterDropdown from "../../components/FilterDropdown";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../../components/ProductCard";
import { X } from "lucide-react";


export default function Shop() {
  const { products } = useContext(ProductContext);
  const { wishlist } = useContext(StoreContext);

  const [filter, setFilter] = useState("all");
  const [gender, setGender] = useState("all");
  const [kitType, setKitType] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("");

  const [searchParams, setSearchParams] = useSearchParams();

  const currentPage = Number(searchParams.get("page")) || 1;

  const setCurrentPage = (page) => {
    setSearchParams((prev) => {
      prev.set("page", page);
      return prev;
    });
  };


  // FILTER PRODUCTS
  let filteredProducts = [...products];

  // CATEGORY
  if (filter !== "all") {
    filteredProducts = filteredProducts.filter(
      (p) => p.category?.toLowerCase() === filter
    );
  }

  // GENDER
  if (gender !== "all") {
    filteredProducts = filteredProducts.filter(
      (p) => p.gender?.toLowerCase() === gender
    );
  }

  // KIT TYPE (name-based) - This filtering logic is kept, but the dropdown is removed from JSX
  if (kitType !== "all") {
    filteredProducts = filteredProducts.filter((p) => {
      const nameLower = (p.name || "").toLowerCase();
      switch (kitType) {
        case "home":
          return nameLower.includes("home");
        case "away":
          return nameLower.includes("away");
        case "training":
          return nameLower.includes("training");
        case "sleeves":
          return nameLower.includes("sleeve");
        default:
          return true;
      }
    });
  }

  // SEARCH
  filteredProducts = filteredProducts.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  // SORT
  const normalizePrice = (p) =>
    typeof p.price === "string"
      ? parseInt(p.price.replace(/\D/g, ""), 10)
      : p.price;

  if (sort === "low-high") {
    filteredProducts.sort(
      (a, b) => normalizePrice(a) - normalizePrice(b)
    );
  }

  if (sort === "high-low") {
    filteredProducts.sort(
      (a, b) => normalizePrice(b) - normalizePrice(a)
    );
  }


  const ITEMS_PER_PAGE = 16;
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);


  const resetToFirstPage = () => {
    setSearchParams((prev) => {
      prev.set("page", 1);
      return prev;
    });
  };


  return (
    <UserLayout>
      <div className="min-h-screen bg-[#0A102E] text-white">
        {/* Title */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-yellow-400">Inventory Registry</p>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black uppercase tracking-tighter leading-none">
              THE <span className="text-white/20">COLLECTION</span>
            </h1>
          </div>
        </div>

        {/* FILTER BAR - Floating Glass style */}
        <div className="sticky top-24 z-40 max-w-7xl mx-auto px-6 mb-12">
          <div className="bg-[#111836]/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-4 shadow-2xl flex flex-wrap items-center gap-4">
            {/* SEARCH */}
            <div className="relative flex-grow min-w-[200px]">
              <input
                type="text"
                placeholder="Search Protocol..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  resetToFirstPage();
                }}
                className="w-full bg-white/5 border border-white/10 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-widest outline-none focus:border-yellow-400 transition-all"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <FilterDropdown
                value={filter}
                onChange={(val) => { setFilter(val); resetToFirstPage(); }}
                placeholder="Sector"
                options={[
                  { value: "all", label: "All Sectors" },
                  { value: "jerseys", label: "Jerseys" },
                  { value: "caps", label: "Headwear" },
                  { value: "jackets", label: "Jackets" },
                  { value: "training", label: "Operational" },
                ]}
              />

              <FilterDropdown
                value={gender}
                onChange={(val) => { setGender(val); resetToFirstPage(); }}
                placeholder="Audience"
                options={[
                  { value: "all", label: "All Personnel" },
                  { value: "men", label: "Men" },
                  { value: "women", label: "Women" },
                  { value: "kids", label: "Junior Squad" },
                ]}
              />

              <FilterDropdown
                value={sort}
                onChange={(val) => { setSort(val); resetToFirstPage(); }}
                placeholder="Sort Metric"
                options={[
                  { value: "", label: "Sequence" },
                  { value: "low-high", label: "Value: Low → High" },
                  { value: "high-low", label: "Value: High → Low" },
                ]}
              />

              {(filter !== "all" || gender !== "all" || search || sort) && (
                <button
                  onClick={() => {
                    setFilter("all");
                    setGender("all");
                    setKitType("all");
                    setSort("");
                    setSearch("");
                    resetToFirstPage();
                  }}
                  className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all border border-white/5"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>

        {/* PRODUCT GRID */}
        <div className="max-w-7xl mx-auto px-6 py-10">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {paginatedProducts.map((p) => (
                <ProductCard key={p.id} p={p} wishlist={wishlist} />
              ))}
            </div>
          ) : (
            <div className="py-24 text-center space-y-4">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10">
                <X size={32} className="text-white/20" />
              </div>
              <p className="text-white/40 font-black uppercase tracking-[0.4em] text-sm">
                No Intelligence Found Matching Your Query
              </p>
            </div>
          )}
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-6 py-20">
            <button
              onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
              className="w-12 h-12 rounded-2xl flex items-center justify-center border border-white/10 transition-all disabled:opacity-20 hover:bg-white/10 active:scale-95"
            >
              <span className="text-xl">‹</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-yellow-400 text-black font-black text-sm shadow-xl">
                {currentPage}
              </div>
              <span className="text-white/20 font-black text-xs uppercase tracking-widest">of {totalPages}</span>
            </div>

            <button
              onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="w-12 h-12 rounded-2xl flex items-center justify-center border border-white/10 transition-all disabled:opacity-20 hover:bg-white/10 active:scale-95"
            >
              <span className="text-xl">›</span>
            </button>
          </div>
        )}
      </div>
    </UserLayout>
  );
}
