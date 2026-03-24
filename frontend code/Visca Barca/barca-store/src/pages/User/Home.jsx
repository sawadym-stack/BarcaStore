// src/pages/User/Home.jsx
import UserLayout from "../../layouts/UserLayout";
import { Link } from "react-router-dom";
import { useContext, useState } from "react";
import { ProductContext } from "../../contexts/ProductContext";
import emailjs from "@emailjs/browser";
import { toast } from "react-toastify";
import ProductCard from "../../components/ProductCard";

function Home() {
  const { products } = useContext(ProductContext);
  const featuredProductIds = [131, 132, 133, 136];
  const featuredProducts = products.filter((p) =>
    featuredProductIds.includes(p.id)
  );

  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterName, setNewsletterName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterName) {
      toast.error("Please enter your name and email.");
      return;
    }

    setIsSubmitting(true);

    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) {
      console.error("EmailJS credentials missing in .env");
      toast.error("Newsletter service is currently unavailable.");
      setIsSubmitting(false);
      return;
    }

    try {
      await emailjs.send(
        serviceId,
        templateId,
        {
          name: newsletterName,
          email: newsletterEmail,
        },
        publicKey
      );
      toast.success("Thank you for subscribing!");
      setNewsletterEmail("");
      setNewsletterName("");
    } catch (error) {
      console.error("EmailJS Error:", error);
      toast.error("Failed to subscribe. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <UserLayout>
      {/* HERO SECTION */}
      <section className="relative w-full h-screen overflow-hidden">
        {/* 🎥 VIDEO BACKGROUND */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover brightness-[0.7] contrast-110 saturate-[1.1]"
        >
          <source src="https://assets.mixkit.co/videos/preview/mixkit-stadium-lights-and-atmosphere-at-night-4416-large.mp4" type="video/mp4" />
          <source src="/barca-store-project-video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* 🎬 CINEMATIC OVERLAY */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#0A102E] flex flex-col justify-center items-center text-center px-4">
          <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black uppercase tracking-tight leading-none text-white drop-shadow-2xl">
             VISCA <br/>
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-500">BARÇA</span>
          </h1>

          <p className="mt-6 text-sm sm:text-base font-bold uppercase tracking-[0.4em] text-white/60">
            Official Merchandise Protocol 2025
          </p>

          <div className="w-20 h-1.5 bg-yellow-400 rounded-full mt-8 mb-10 shadow-[0_0_20px_rgba(250,204,21,0.5)]" />

          <Link
            to="/shop"
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-black px-12 py-4 rounded-full text-xs uppercase tracking-widest shadow-[0_20px_40px_rgba(0,0,0,0.5)] hover:scale-105 active:scale-95 transition-all duration-300"
          >
            Enter the Store
          </Link>
        </div>
      </section>

      {/* MARQUEE STRIP */}
      <div className="bg-black text-white py-4 text-2xl font-black overflow-hidden whitespace-nowrap w-full border-y border-white/5">
        <marquee scrollamount="12">
          <span className="mx-12 opacity-50">MÉS QUE UN CLUB</span>
          <span className="mx-12 text-yellow-400">VISCA BARÇA</span>
          <span className="mx-12 opacity-50">MÉS QUE UN CLUB</span>
          <span className="mx-12 text-yellow-400">VISCA BARÇA</span>
          <span className="mx-12 opacity-50">MÉS QUE UN CLUB</span>
          <span className="mx-12 text-yellow-400">VISCA BARÇA</span>
        </marquee>
      </div>

      {/* NEW COLLECTION */}
      <section className="bg-[#0A102E] text-white py-24 w-full">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-yellow-400">Seasonal Intelligence</p>
              <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tighter">
                NEW RELEASES
              </h2>
            </div>
            <Link to="/shop" className="text-xs font-black uppercase tracking-widest text-white/50 hover:text-white transition-colors border-b border-white/10 pb-1">
              Analyze All Kits
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </div>
      </section>

      {/* SECOND HERO SECTION */}
      <section className="relative w-full h-[80vh] overflow-hidden">
        <img
          src="https://i.ytimg.com/vi/GG6GBtgUhFA/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLDFV4WPSfQtJ6R1KjjD62q6nqcbCQ"
          alt="Partnership"
          className="w-full h-full object-cover brightness-50"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <p className="text-yellow-400 font-black text-xs uppercase tracking-[0.5em] mb-4">Limited Collaboration</p>
          <h2 className="text-white text-4xl md:text-6xl font-black tracking-tight uppercase max-w-4xl">
            FC BARCELONA X NEW ERA
          </h2>
          <Link
            to="/shop"
            className="mt-10 bg-white text-black font-black px-10 py-4 rounded-full text-xs uppercase tracking-widest shadow-xl hover:bg-yellow-400 transition-all duration-300 hover:scale-105"
          >
            Explore Capsule
          </Link>
        </div>
      </section>

      {/* CAPS COLLECTION */}
      <section className="bg-[#0A102E] text-white py-24 w-full">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-black mb-16 uppercase tracking-tighter border-l-8 border-yellow-400 pl-8">
            Headwear Protocol
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              {
                img: "https://neweracap.co.th/cdn/shop/files/60846902_59FIFTY_SOCCER25_FCBARCA_FALLEXCLUSIVES_FCBARC_MULTI_3QL.jpg?v=1761977121",
                name: "59FIFTY SOCCER25 EXCLUSIVE",
                price: "10900",
                tag: "LIMITED"
              },
              {
                img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQaaAZW-lEz06GcvqPmHQrizW_0uxWBhrO75A&s",
                name: "9FORTY BLAUGRANA STRIPE",
                price: "3900",
                tag: "NEW"
              },
              {
                img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR8CKhmz4CINljGplp505K9dCpG_TyrlvVURQ&s",
                name: "TRUCKER BLACK/GOLD CREST",
                price: "4500",
                tag: "TRENDING"
              },
              {
                img: "https://m.media-amazon.com/images/I/61hXTLb2jtL._AC_SL1500_.jpg",
                name: "9TWENTY YOUTH BLAUGRANA",
                price: "3000",
                tag: "YOUTH"
              }
            ].map((cap, idx) => (
              <div key={idx} className="group cursor-pointer">
                <div className="relative aspect-square bg-[#111836] rounded-[2rem] overflow-hidden border border-white/5 mb-6">
                  <span className="absolute top-4 left-4 bg-yellow-400 text-black text-[8px] font-black px-2 py-1 rounded-full z-10 shadow-lg">
                    {cap.tag}
                  </span>
                  <img src={cap.img} alt={cap.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-white text-sm uppercase leading-tight group-hover:text-yellow-400 transition-colors">{cap.name}</h3>
                  <p className="text-white/50 font-black text-sm">₹{cap.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0A102E] text-white py-24 w-full border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-center mb-24">
            <h1 className="font-bebas text-center uppercase text-[15vw] md:text-[10vw] leading-none tracking-tighter transition-all duration-700 group cursor-default">
              <span className="text-white/10 group-hover:text-transparent bg-clip-text bg-gradient-to-r from-[#A50044] via-[#004D98] to-[#FDB913] transition-all duration-700">
                BARCA STORE
              </span>
            </h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 text-sm">
            <div>
              <h3 className="font-black mb-8 uppercase tracking-widest text-yellow-400">Newsletter Protocol</h3>
              <form onSubmit={handleNewsletterSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="IDENTIFIER"
                  value={newsletterName}
                  onChange={(e) => setNewsletterName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 p-4 text-white rounded-xl outline-none text-xs focus:border-yellow-400 transition-colors"
                  required
                />
                <input
                  type="email"
                  placeholder="COMMUNICATION CHANNEL"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 p-4 text-white rounded-xl outline-none text-xs focus:border-yellow-400 transition-colors"
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-black py-4 rounded-xl transition-all disabled:opacity-50 text-xs uppercase tracking-widest"
                >
                  {isSubmitting ? "TRANSMITTING..." : "AUTHORIZE ACCESS"}
                </button>
              </form>
            </div>

            <div>
              <h3 className="font-black mb-8 uppercase tracking-widest opacity-40">Intelligence</h3>
              <ul className="space-y-3 text-white/60 font-medium text-xs uppercase tracking-wider">
                <li className="hover:text-yellow-400 cursor-pointer transition-colors">Order Status</li>
                <li className="hover:text-yellow-400 cursor-pointer transition-colors">Return Portal</li>
                <li className="hover:text-yellow-400 cursor-pointer transition-colors">Support Intelligence</li>
                <li className="hover:text-yellow-400 cursor-pointer transition-colors">Shipping Logistics</li>
              </ul>
            </div>

            <div>
              <h3 className="font-black mb-8 uppercase tracking-widest opacity-40">Social Channels</h3>
              <ul className="space-y-3 text-white/60 font-medium text-xs uppercase tracking-wider">
                <li className="hover:text-yellow-400 cursor-pointer transition-colors">Instagram</li>
                <li className="hover:text-yellow-400 cursor-pointer transition-colors">Twitter // X</li>
                <li className="hover:text-yellow-400 cursor-pointer transition-colors">YouTube Official</li>
                <li className="hover:text-yellow-400 cursor-pointer transition-colors">TikTok Protocol</li>
              </ul>
            </div>

            <div>
              <h3 className="font-black mb-8 uppercase tracking-widest opacity-40">Legal Framework</h3>
              <ul className="space-y-3 text-white/60 font-medium text-xs uppercase tracking-wider">
                <li className="hover:text-yellow-400 cursor-pointer transition-colors">Privacy Policy</li>
                <li className="hover:text-yellow-400 cursor-pointer transition-colors">Service Terms</li>
                <li className="hover:text-yellow-400 cursor-pointer transition-colors">Purchase Conditions</li>
                <li className="hover:text-yellow-400 cursor-pointer transition-colors">Accessibility</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </UserLayout>
  );
}

export default Home;