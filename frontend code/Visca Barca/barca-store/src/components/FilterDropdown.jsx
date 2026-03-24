import { useEffect, useRef, useState } from "react";

export default function FilterDropdown({
  value,
  options,
  onChange,
  placeholder = "Select",
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () =>
      document.removeEventListener("mousedown", handler);
  }, []);

  const selectedLabel =
    options.find((o) => o.value === value)?.label ||
    placeholder;

  return (
    <div ref={ref} className="relative">
      {/* BUTTON */}
      <button
        onClick={() => setOpen(!open)}
        className="
          px-4 py-2 pr-10
          text-[10px] font-black uppercase tracking-[0.2em]
          text-white/80
          bg-white/5
          backdrop-blur-md
          border border-white/10
          rounded-xl
          shadow-lg
          hover:bg-white/10
          hover:border-white/20
          focus:outline-none
          transition-all duration-300
          relative
          whitespace-nowrap
        "
      >
        {selectedLabel}
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] text-white/40">
          {open ? "▲" : "▼"}
        </span>
      </button>

      {/* GLASS MODAL LIST */}
      {open && (
        <div
          className="
            absolute left-0 mt-3 z-50
            w-48
            rounded-2xl
            bg-[#0F172A]/95
            backdrop-blur-2xl
            border border-white/10
            shadow-[0_20px_50px_rgba(0,0,0,0.5)]
            overflow-hidden
            animate-[reveal_0.2s_ease-out]
          "
        >
          <div className="py-2">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`
                  w-full text-left
                  px-5 py-3
                  text-[10px] font-bold uppercase tracking-widest
                  transition-all duration-300
                  ${
                    value === opt.value
                      ? "bg-yellow-400 text-black shadow-inner"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  }
                `}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
