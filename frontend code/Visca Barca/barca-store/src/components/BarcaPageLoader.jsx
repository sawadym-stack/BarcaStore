export default function BarcaPageLoader({
  text = "Loading Barça Store...",
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/75 backdrop-blur-md">
      <div className="flex flex-col items-center">

        {/* LOGO */}
        <div className="relative w-20 h-20 mb-4">
          <img
            src="/barca-logo.jpg"  // 🔴 put logo in public/
            alt="FC Barcelona"
            className="w-full h-full object-contain animate-pulse"
          />

          {/* ROTATING RING */}
          <span className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#0A102E] border-r-[#A50044] animate-spin"></span>
        </div>

        {/* TEXT */}
        <p className="text-sm font-semibold tracking-wide text-gray-700">
          {text}
        </p>
      </div>
    </div>
  );
}
