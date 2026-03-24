export default function BarcaLoader({ text = "Loading..." }) {
  return (
    <div className="w-full py-16 flex flex-col items-center justify-center">

      <div className="relative w-14 h-14">
        <img
          src="/barca-logo.jpg"
          alt="FC Barcelona"
          className="w-full h-full object-contain animate-pulse"
        />

        <span className="absolute inset-0 rounded-full border-3 border-transparent border-t-[#0A102E] animate-spin"></span>
      </div>

      <p className="mt-3 text-xs text-gray-600 font-medium">
        {text}
      </p>
    </div>
  );
}
