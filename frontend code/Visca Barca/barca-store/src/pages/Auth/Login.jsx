import { useState, useContext, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AuthContext } from '../../contexts/AuthContext'
import UserLayout from '../../layouts/UserLayout'
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login } = useContext(AuthContext)
  const nav = useNavigate()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login({ email, password })
      const isAdmin = ['admin', 'superadmin'].includes(user.role)
      if (isAdmin) nav('/admin')
      else nav('/')
    } catch (e) {
      // alert replaced by toast in context/backend if implemented, 
      // but keeping basic error catch if context doesn't toast
    } finally {
      setLoading(false)
    }
  }

  return (
    <UserLayout>
      <div className="min-h-screen bg-[#0A102E] flex items-center justify-center px-6 py-20 relative overflow-hidden">
        
        {/* DECORATIVE ELEMENTS */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-[#A50044] rounded-full blur-[120px] opacity-20" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-[#004D98] rounded-full blur-[120px] opacity-20" />

        <div className="w-full max-w-lg relative">
          
          {/* GLASS CARD */}
          <div className="bg-[#111836]/60 backdrop-blur-3xl border border-white/10 rounded-[3.5rem] p-10 md:p-14 shadow-2xl space-y-10">
            
            {/* LOGO & HEADER */}
            <div className="text-center space-y-6">
               <div className="relative inline-block">
                  <div className="absolute inset-0 bg-yellow-400 blur-2xl opacity-20 scale-125" />
                  <img
                    src="https://upload.wikimedia.org/wikipedia/sco/thumb/4/47/FC_Barcelona_%28crest%29.svg/2020px-FC_Barcelona_%28crest%29.svg.png"
                    alt="FCB"
                    className="w-20 mx-auto relative drop-shadow-[0_0_20px_rgba(250,204,21,0.3)]"
                  />
               </div>
               
               <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-yellow-400">Official Portal</p>
                  <h1 className="text-4xl font-black uppercase tracking-tighter text-white">
                    IDENTITY <span className="text-white/20">ACCESS</span>
                  </h1>
               </div>
            </div>

            {/* FORM */}
            <form onSubmit={submit} className="space-y-6">
              <div className="space-y-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-white/20 ml-4">Authorized Email</p>
                <div className="relative group">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-yellow-400 transition-colors" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@official.com"
                    className="w-full bg-white/5 border border-white/10 px-14 py-5 rounded-2xl text-xs font-bold text-white outline-none focus:border-yellow-400 focus:bg-white/[0.08] transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-4 mr-2">
                   <p className="text-[9px] font-black uppercase tracking-widest text-white/20">Secure Passphrase</p>
                   <Link to="/forgot-password" size="sm" className="text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">Recover</Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-yellow-400 transition-colors" size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-white/5 border border-white/10 px-14 py-5 rounded-2xl text-xs font-bold text-white outline-none focus:border-yellow-400 focus:bg-white/[0.08] transition-all"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black py-6 rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-yellow-400 transition-all duration-300 shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {loading ? "Verifying..." : (<>Authorize Access <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></>)}
              </button>
            </form>

            <div className="pt-4 text-center">
              <button
                onClick={() => nav('/register')}
                className="text-[10px] font-black text-white/40 uppercase tracking-widest hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto"
              >
                New Personnel? <span className="text-white underline">Initialize Identity</span>
              </button>
            </div>
            
            <div className="pt-8 border-t border-white/5 flex items-center justify-center gap-4">
                <ShieldCheck size={16} className="text-green-500" />
                <p className="text-[9px] font-black uppercase tracking-widest text-white/20">End-to-End Encrypted Session</p>
            </div>
          </div>

          <p className="mt-8 text-center text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">
            Visca Barça · Més Que Un Club
          </p>
        </div>
      </div>
    </UserLayout>
  )
}
