"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { postArtwork } from '@/app/actions/index';
import Image from 'next/image';

interface PostArtworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: {
    name?: string;
    avatar_url?: string;
    email?: string;
  } | null;
}

export default function PostArtworkModal({ isOpen, onClose, currentUser }: PostArtworkModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const router = useRouter();

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      await postArtwork(formData);
      onClose();
      // Optionally refresh or redirect
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Something went wrong while posting your artwork.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      {/* Modal Container - Fixed Height within Viewport */}
      <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* Header - Fixed */}
        <div className="bg-[#1C4A5C] p-6 text-white flex items-center justify-between flex-none">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-full overflow-hidden relative shrink-0 border-2 border-white/20">
              {currentUser?.avatar_url ? (
                <Image src={currentUser.avatar_url} alt="Me" fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-lg">
                  {currentUser?.name?.charAt(0) || '?'}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-xl font-black leading-tight">List an Artwork</h1>
              <p className="text-xs text-blue-50/70 font-medium mt-0.5">Posting as <span className="text-white font-bold">{currentUser?.name || 'Artist'}</span></p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors bg-white/10 p-2 rounded-full hover:bg-white/20"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <form action={handleSubmit} className="space-y-6">
            
            {/* Image Upload Area */}
            <div className="space-y-2">
              <label className="block text-sm font-black text-gray-700 uppercase tracking-wider">Artwork Image *</label>
              <div className="relative border-2 border-dashed border-gray-200 rounded-2xl h-72 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-all cursor-pointer overflow-hidden group">
                {previewUrl ? (
                  <div className="relative w-full h-full">
                    <Image src={previewUrl} alt="Preview" fill className="object-contain" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mb-2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      <span className="text-xs font-black uppercase tracking-widest">Change Image</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-4">
                    <div className="w-14 h-14 bg-[#1C4A5C]/5 text-[#1C4A5C] rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    </div>
                    <p className="text-sm font-black text-gray-600">Click to upload image</p>
                    <p className="text-xs text-gray-400 mt-1.5 font-medium">PNG, JPG, or WEBP (Max 5MB)</p>
                  </div>
                )}
                <input 
                  type="file" 
                  name="image" 
                  accept="image/*" 
                  required 
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-black text-gray-700 uppercase tracking-wider">Title *</label>
                <input 
                  type="text" 
                  name="title" 
                  required 
                  placeholder="e.g. Sunset in Lintaon"
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none text-sm text-gray-900 font-medium focus:ring-2 focus:ring-[#1C4A5C]/10 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-black text-gray-700 uppercase tracking-wider">Category *</label>
                <div className="relative">
                  <select 
                    name="category" 
                    required 
                    defaultValue=""
                    className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none text-sm text-gray-900 font-medium focus:ring-2 focus:ring-[#1C4A5C]/10 outline-none transition-all appearance-none"
                  >
                    <option value="" disabled>Select a category</option>
                    <option value="Digital">Digital</option>
                    <option value="Pottery">Pottery</option>
                    <option value="Jewelry">Jewelry</option>
                    <option value="Paintings">Paintings</option>
                    <option value="Weaving">Weaving</option>
                    <option value="Wood Carving">Wood Carving</option>
                    <option value="Embroidery">Embroidery</option>
                    <option value="Crafts">Crafts</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-black text-gray-700 uppercase tracking-wider">Price (₱) *</label>
                <input 
                  type="number" 
                  name="price" 
                  required 
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none text-sm text-gray-900 font-bold focus:ring-2 focus:ring-[#1C4A5C]/10 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-black text-gray-700 uppercase tracking-wider">Stock Quantity *</label>
                <input 
                  type="number" 
                  name="stock_quantity" 
                  required 
                  min="1"
                  defaultValue="1"
                  placeholder="e.g. 5"
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none text-sm text-gray-900 font-bold focus:ring-2 focus:ring-[#1C4A5C]/10 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-black text-gray-700 uppercase tracking-wider">Description</label>
              <textarea 
                name="description" 
                rows={4}
                placeholder="Tell us about the inspiration, materials used, or dimensions..."
                className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none text-sm text-gray-900 font-medium focus:ring-2 focus:ring-[#1C4A5C]/10 outline-none transition-all resize-none placeholder:text-gray-400"
              ></textarea>
            </div>

            {/* Sticky/Fixed Footer Action */}
            <div className="pt-6 border-t border-gray-100 flex gap-4">
              <button 
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-4 rounded-2xl text-sm font-black text-gray-500 hover:bg-gray-100 transition-all uppercase tracking-widest"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-[2] bg-[#1C4A5C] text-white font-black py-4 rounded-2xl hover:bg-[#143745] hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-[#1C4A5C]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Listing...</span>
                  </>
                ) : (
                  'List Artwork'
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
