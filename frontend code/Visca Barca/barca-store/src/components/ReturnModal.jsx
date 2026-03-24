import React, { useState, useEffect } from "react";
import { X, Loader2, Undo2 } from "lucide-react";
import { toast } from "react-toastify";
import * as api from "../api/api";

export default function ReturnModal({ isOpen, onClose, orderItem, onSuccess }) {
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setReason("");
      setComment("");
    }
  }, [isOpen]);

  if (!isOpen || !orderItem) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) {
      toast.error("Please select a reason for return");
      return;
    }
    setLoading(true);
    try {
      await api.returnOrderItem(orderItem.id, { reason, comment });
      toast.success("Return request submitted successfully");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to submit return request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#111836] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-white/10 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/5">
          <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Undo2 size={18} className="text-orange-500" />
            Return Asset Request
          </h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/10">
            <img
              src={orderItem.image_url}
              className="w-12 h-12 object-contain rounded-lg shadow-sm"
              alt={orderItem.name}
            />
            <div className="min-w-0 flex-1">
              <p className="font-bold text-white text-sm truncate uppercase tracking-widest">{orderItem.name}</p>
              <p className="text-xs text-white/40 font-bold uppercase">Size: {orderItem.size} · Qty: {orderItem.quantity}</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-white/50 uppercase tracking-widest mb-3">
              Reason for Return
            </label>
            <select
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-bold uppercase tracking-widest outline-none focus:border-orange-500 transition-all"
            >
              <option value="" className="text-black">Select a Reason</option>
              <option value="Defective / Damaged" className="text-black">Defective / Damaged</option>
              <option value="Wrong Size" className="text-black">Wrong Size</option>
              <option value="Item Not As Expected" className="text-black">Item Not As Expected</option>
              <option value="Other" className="text-black">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-black text-white/50 uppercase tracking-widest mb-2">
              Additional Details (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-bold outline-none focus:border-orange-500 transition-all min-h-[100px] resize-none"
              placeholder="Provide more context..."
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500/20 border border-orange-500/50 text-orange-500 font-black py-4 rounded-xl hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all uppercase tracking-[0.2em] shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="animate-spin" size={18} />}
              SUBMIT RETURN REQUEST
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
