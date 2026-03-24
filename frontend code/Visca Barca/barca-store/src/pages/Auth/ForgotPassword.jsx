import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../../api/api';
import UserLayout from '../../layouts/UserLayout';
import { toast } from 'react-toastify';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [step, setStep] = useState('request'); // 'request' or 'reset'
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const nav = useNavigate();

    const handleRequest = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.forgotPassword(email);
            toast.info("Password reset code sent to your email.");
            setStep('reset');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.resetPassword({ email, code: otp, password: newPassword });
            toast.success("Password reset successful. You can sign in now.");
            nav('/login');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <UserLayout>
            <div className="min-h-[70vh] flex justify-center items-center px-4 bg-white">
                <div className="w-full max-w-md bg-white p-8 rounded shadow-md text-center border">
                    <h1 className="text-xl font-bold text-black mb-2">FORGOT PASSWORD</h1>
                    <p className="text-sm text-gray-500 mb-6 font-medium uppercase tracking-wider">Spotify Camp Nou</p>

                    {step === 'request' ? (
                        <form onSubmit={handleRequest} className="text-left space-y-4">
                            <div>
                                <label className="text-[13px] text-black font-semibold uppercase">Email Address</label>
                                <input
                                    required
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className="w-full mt-1 px-3 py-2 border border-gray-400 rounded focus:ring-2 focus:ring-yellow-400 outline-none"
                                />
                            </div>

                            <button
                                disabled={loading}
                                type="submit"
                                className="w-full mt-2 bg-[#F7B600] text-black font-bold py-2 rounded transition hover:bg-[#e0a300]"
                            >
                                {loading ? "SENDING..." : "SEND RESET CODE"}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleReset} className="text-left space-y-4">
                            <div className="bg-blue-50 p-4 rounded text-xs text-blue-700 font-medium border border-blue-100 mb-4">
                                Enter the 6-digit code sent to your email along with your new password.
                            </div>

                            <div>
                                <label className="text-[13px] text-black font-semibold uppercase">Verification Code</label>
                                <input
                                    required
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    placeholder="6-digit code"
                                    className="w-full mt-1 px-3 py-2 border border-gray-400 rounded focus:ring-2 focus:ring-yellow-400 outline-none text-center font-bold tracking-widest"
                                />
                            </div>

                            <div>
                                <label className="text-[13px] text-black font-semibold uppercase">New Password</label>
                                <input
                                    required
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Min 6 characters"
                                    className="w-full mt-1 px-3 py-2 border border-gray-400 rounded focus:ring-2 focus:ring-yellow-400 outline-none"
                                />
                            </div>

                            <button
                                disabled={loading}
                                type="submit"
                                className="w-full mt-2 bg-black text-white font-bold py-2 rounded transition hover:bg-gray-800"
                            >
                                {loading ? "RESETTING..." : "RESET PASSWORD"}
                            </button>
                        </form>
                    )}

                    <button
                        onClick={() => nav('/login')}
                        className="mt-6 text-sm font-semibold text-blue-600 hover:underline"
                    >
                        ← BACK TO LOGIN
                    </button>
                </div>
            </div>
        </UserLayout>
    );
}
