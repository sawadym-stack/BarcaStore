// src/components/TopMarquee.jsx
import React from "react";

export default function TopMarquee({ text = "MÉS QUE UN CLUB" }) {
  // We'll render two copies for a seamless loop
  return (
    <div className="w-full overflow-hidden bg-white/90">
      <div className="relative">
        <div className="marquee whitespace-nowrap ">
          <span className="mx-8 font-semibold tracking-wider text-sm">{text}</span>
          <span className="mx-8 font-semibold tracking-wider text-sm">{text}</span>
          <span className="mx-8 font-semibold tracking-wider text-sm">{text}</span>
        </div>
      </div>
    </div>
  );
}
