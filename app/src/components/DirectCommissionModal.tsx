"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Send, PhilippinePeso, Calendar, FileText, Info } from 'lucide-react';
import { createCommissionRequest } from '@/app/actions/index';

interface DirectCommissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  artistId: string;
  artistName: string;
}

export default function DirectCommissionModal({ isOpen, onClose, artistId, artistName }: DirectCommissionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  if (!isOpen) return null;

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      // We append the artistId to the formData so the server action knows this is a direct request
      formData.append('artist_id', artistId);
      await createCommissionRequest(formData);
      
      onClose();
      // Redirect to the commissions tab on the homepage or a dedicated commissions list
      router.push('/homepage?tab=commissions');
      router.refresh();
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Failed to send commission request.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-[#C87941] p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <PhilippinePeso size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-black">Commission {artistName}</h1>
              <p className="text-xs text-orange-50/80 font-medium">Send a direct project proposal</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors bg-white/10 p-2 rounded-full hover:bg-white/20"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-8 overflow-y-auto custom-scrollbar">
          <form action={handleSubmit} className="space-y-6">
            
            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3 mb-2">
              <Info className="text-blue-500 shrink-0" size={18} />
              <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
                This request will be sent directly to <span className="font-bold">{artistName}</span>. 
                Once they accept, you&apos;ll be able to proceed with a deposit in the secure workspace.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black text-gray-700 uppercase tracking-wider">Project Title</label>
              <div className="relative">
                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  name="title" 
                  required 
                  placeholder="e.g. Custom Portrait for Anniversary"
                  className="w-full pl-12 pr-5 py-4 rounded-2xl bg-gray-50 border-none text-sm text-gray-900 font-medium focus:ring-2 focus:ring-[#C87941]/20 outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-black text-gray-700 uppercase tracking-wider">My Budget (₱)</label>
                <div className="relative">
                  <PhilippinePeso className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="number" 
                    name="budget" 
                    required 
                    min="1"
                    placeholder="0.00"
                    className="w-full pl-12 pr-5 py-4 rounded-2xl bg-gray-50 border-none text-sm text-gray-900 font-bold focus:ring-2 focus:ring-[#C87941]/20 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-black text-gray-700 uppercase tracking-wider">Target Deadline</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="date" 
                    name="deadline" 
                    required 
                    className="w-full pl-12 pr-5 py-4 rounded-2xl bg-gray-50 border-none text-sm text-gray-900 font-medium focus:ring-2 focus:ring-[#C87941]/20 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black text-gray-700 uppercase tracking-wider">Detailed Description</label>
              <textarea 
                name="description" 
                rows={4}
                required
                placeholder="Describe your vision, dimensions, color preferences, etc..."
                className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none text-sm text-gray-900 font-medium focus:ring-2 focus:ring-[#C87941]/20 outline-none transition-all resize-none placeholder:text-gray-400"
              ></textarea>
            </div>

            {/* Actions */}
            <div className="pt-4 flex gap-3">
              <button 
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-4 rounded-2xl text-xs font-black text-gray-500 hover:bg-gray-100 transition-all uppercase tracking-widest"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-[2] bg-[#1C4A5C] text-white font-black py-4 rounded-2xl hover:bg-[#143745] hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-[#1C4A5C]/20 transition-all disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Send size={16} />
                    Send Request
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
