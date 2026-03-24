import React, { useState, useEffect } from "react";
import { Star, X, Loader2, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import * as api from "../api/api";

export default function ReviewModal({ isOpen, onClose, productId, orderItem, initialReview, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (initialReview) {
      setRating(initialReview.rating);
      setComment(initialReview.comment);
    } else {
      setRating(0);
      setComment("");
    }
  }, [initialReview, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    setLoading(true);
    try {
      if (initialReview) {
        await api.updateReview(initialReview.id, { rating, comment });
        toast.success("Review updated successfully");
      } else {
        await api.addReview(productId, { rating, comment });
        toast.success("Review submitted successfully");
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    setDeleting(true);
    try {
      await api.deleteReview(initialReview.id);
      toast.success("Review deleted");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to delete review");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800">
            {initialReview ? "Edit Your Review" : "Write a Review"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Product Info */}
          {orderItem && (
            <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
              <img
                src={orderItem.image_url.startsWith("http") ? orderItem.image_url : `http://localhost:3000${orderItem.image_url}`}
                className="w-12 h-12 object-cover rounded-lg shadow-sm"
                alt={orderItem.name}
              />
              <div className="min-w-0">
                <p className="font-bold text-gray-800 text-sm truncate">{orderItem.name}</p>
                <p className="text-xs text-gray-500">How was your experience?</p>
              </div>
            </div>
          )}

          {/* Star Rating */}
          <div className="text-center">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Overall Rating</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                  className="transition transform hover:scale-110 active:scale-95"
                >
                  <Star
                    size={36}
                    className={`transition-colors duration-150 ${
                      (hover || rating) >= star
                        ? "fill-[#F7B600] text-[#F7B600]"
                        : "text-gray-200"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="mt-2 text-sm font-medium text-[#F7B600]">
              {rating === 1 && "Poor"}
              {rating === 2 && "Fair"}
              {rating === 3 && "Good"}
              {rating === 4 && "Great"}
              {rating === 5 && "Excellent"}
            </p>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
              Review Comment
            </label>
            <textarea
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition min-h-[120px] resize-none"
              placeholder="Tell us what you liked or disliked about the product..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {initialReview && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || loading}
                className="flex-none p-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition disabled:opacity-50"
              >
                {deleting ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={20} />}
              </button>
            )}
            <button
              type="submit"
              disabled={loading || deleting}
              className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="animate-spin" size={18} />}
              {initialReview ? "UPDATE REVIEW" : "SUBMIT REVIEW"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
