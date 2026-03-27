import Navbar from "../components/Navbar";

function UserLayout({ children, isHero = false }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#0A102E] selection:bg-yellow-400 selection:text-black relative overflow-hidden">
      {/* GLOBAL CINEMATIC BACKGROUND GRADIENT */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#A50044] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#004D98] rounded-full blur-[120px]" />
      </div>

      <Navbar />

      {/* OFFSET FOR FLOATING NAVBAR */}
      <main className={`flex-grow w-full ${isHero ? "pt-0" : "pt-28"} pb-12 relative`}>
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-[#0A102E] text-center text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] py-12 border-t border-white/5">
        © 2025 Barça Store • Més que un club
      </footer>
    </div>
  );
}

export default UserLayout;
