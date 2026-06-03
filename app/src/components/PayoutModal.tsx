"use client";

import React, { useState } from "react";
import { Loader2, X } from "lucide-react";
import { createPayoutRequest } from "@/app/actions";

interface PayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  maxBalance: number;
  onSuccess: () => void;
}

export default function PayoutModal({ isOpen, onClose, maxBalance, onSuccess }: PayoutModalProps) {
  const [gcashName, setGcashName] = useState("");
  const [gcashNumber, setGcashNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const withdrawAmount = parseFloat(amount);

    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      alert("Please enter a valid numeric amount.");
      return;
    }

    if (withdrawAmount > maxBalance) {
      alert("Requested amount exceeds your available balance.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createPayoutRequest(withdrawAmount, gcashName, gcashNumber);
      alert("Withdrawal request submitted successfully! Our team will process your GCash transfer shortly.");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Withdrawal error detail:", error);
      alert(error.message || "Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white w-full max-w-md rounded-3xl p-8 border border-gray-100 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors">
          <X size={20} />
        </button>

        <h2 className="text-2xl font-black text-[#1C4A5C] tracking-tight uppercase mb-2">Request GCash Payout</h2>
        <p className="text-xs text-gray-400 font-bold mb-6 tracking-wide uppercase">Available Balance: ₱{maxBalance.toLocaleString()}</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">GCash Registered Full Name</label>
            <input 
              type="text" 
              required 
              value={gcashName} 
              onChange={(e) => setGcashName(e.target.value)} 
              placeholder="e.g. JUAN DELA CRUZ" 
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#1C4A5C] uppercase placeholder:text-gray-400" 
            />
          </div>

          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">GCash Phone Number</label>
            <input 
              type="text" 
              required 
              value={gcashNumber} 
              onChange={(e) => setGcashNumber(e.target.value)} 
              placeholder="e.g. 09123456789" 
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#1C4A5C] placeholder:text-gray-400" 
            />
          </div>

          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Withdrawal Amount (₱)</label>
            <input 
              type="number" 
              required 
              min="1" 
              max={maxBalance} 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              placeholder={`Max: ₱${maxBalance}`} 
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#1C4A5C] placeholder:text-gray-400" 
            />
          </div>

          <button type="submit" disabled={isSubmitting || maxBalance <= 0} className="w-full bg-[#C87941] hover:bg-[#a86536] disabled:bg-gray-100 disabled:text-gray-400 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 mt-2">
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Confirm Withdrawal Request"}
          </button>
        </form>
      </div>
    </div>
  );
}