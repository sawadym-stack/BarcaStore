import { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import UserLayout from '../../layouts/UserLayout';
import { User, Mail, Lock, ShieldCheck, ArrowRight, ArrowLeft, Terminal } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('form'); // 'form' or 'otp'
  const [loading, setLoading] = useState(false);

  const { register, verifyOTP } = useContext(AuthContext);
  const nav = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({ name, email, password });
      setStep('otp');
    } catch (e) {
      // toast handled in context
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyOTP({ email, otp });
      nav("/login");
    } catch (e) {
      // toast handled in context
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserLayout>
      <div className="min-h-screen bg-[#0A102E] text-white flex items-center justify-center px-6 py-20 relative overflow-hidden">
        
        {/* DECORATIVE BLUR */}
        <div className="absolute top-1/4 -right-20 w-80 h-80 bg-[#A50044] rounded-full blur-[120px] opacity-10" />
        <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-[#004D98] rounded-full blur-[120px] opacity-15" />

        <div className="w-full max-w-lg relative animate-in fade-in zoom-in-95 duration-700">
           
           {/* GLASS CONTAINER */}
           <div className="bg-[#111836]/60 backdrop-blur-3xl border border-white/10 rounded-[3.5rem] p-10 md:p-14 shadow-2xl space-y-10">
              
              {/* HEADER */}
              <div className="text-center space-y-6">
                 <div className="relative inline-block">
                    <div className="absolute inset-0 bg-yellow-400 blur-2xl opacity-20 scale-125" />
                    <img
                      src="https://upload.wikimedia.org/wikipedia/sco/thumb/4/47/FC_Barcelona_%28crest%29.svg/2020px-FC_Barcelona_%28crest%29.svg.png"
                      alt="FCB"
                      className="w-16 mx-auto relative drop-shadow-[0_0_20px_rgba(250,204,21,0.3)]"
                    />
                 </div>
                 
                 <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-yellow-400">Identity Initialization</p>
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-white">
                      JOIN THE <span className="text-white/20">ELITE</span>
                    </h1>
                 </div>
              </div>

              {step === 'form' ? (
                <form onSubmit={handleRegister} className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/20 ml-4">Personnel Appellation</p>
                    <div className="relative group">
                       <User size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-yellow-400 transition-colors" />
                       <input required value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" className="w-full bg-white/5 border border-white/10 px-14 py-5 rounded-2xl text-xs font-bold text-white outline-none focus:border-yellow-400 focus:bg-white/[0.08] transition-all" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/20 ml-4">Communication Link (Email)</p>
                    <div className="relative group">
                       <Mail size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-yellow-400 transition-colors" />
                       <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@official.com" className="w-full bg-white/5 border border-white/10 px-14 py-5 rounded-2xl text-xs font-bold text-white outline-none focus:border-yellow-400 focus:bg-white/[0.08] transition-all" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/20 ml-4">Secure Passphrase</p>
                    <div className="relative group">
                       <Lock size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-yellow-400 transition-colors" />
                       <input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••••••" className="w-full bg-white/5 border border-white/10 px-14 py-5 rounded-2xl text-xs font-bold text-white outline-none focus:border-yellow-400 focus:bg-white/[0.08] transition-all" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-white text-black py-6 rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-yellow-400 transition-all duration-300 shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 group"
                  >
                    {loading ? "INITIALIZING..." : (<>Initialize Identity <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></>)}
                  </button>

                  <div className="text-center pt-4">
                    <button onClick={() => nav('/login')} type="button" className="text-[10px] font-black text-white/40 uppercase tracking-widest hover:text-white transition-colors">
                       Existing Personnel? <span className="text-white underline">Authorized Access</span>
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerify} className="space-y-10 animate-in slide-in-from-right-10 duration-500">
                  <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] text-center space-y-3">
                    <div className="w-10 h-10 bg-yellow-400/10 rounded-full flex items-center justify-center mx-auto text-yellow-400">
                       <ShieldCheck size={20} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Verification link sent to {email}</p>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/20 text-center">Enter 6-Digit Authorization Code</p>
                    <input
                      required
                      maxLength={6}
                      value={otp}
                      onChange={e => setOtp(e.target.value)}
                      placeholder="000 000"
                      className="w-full bg-white/5 border border-white/10 px-4 py-8 rounded-[2rem] text-4xl font-black text-white text-center tracking-[0.5em] outline-none focus:border-yellow-400 transition-all"
                    />
                  </div>

                  <div className="space-y-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-white text-black py-6 rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-yellow-400 transition-all duration-300 shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {loading ? "VERIFYING..." : "Verify Registry"}
                    </button>
                    
                    <button onClick={() => setStep('form')} className="w-full flex items-center justify-center gap-2 text-[10px] font-black text-white/20 uppercase tracking-widest hover:text-white transition-colors">
                       <ArrowLeft size={14} /> Back to Identity Form
                    </button>
                  </div>
                </form>
              )}

              <div className="pt-8 border-t border-white/5 flex items-center justify-center gap-4">
                  <Terminal size={16} className="text-white/20" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/20">Authorized Protocol Verification</p>
              </div>

           </div>
           
           <p className="mt-8 text-center text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">
             Visca Barça · Més Que Un Club
           </p>
        </div>
      </div>
    </UserLayout>
  );
}
