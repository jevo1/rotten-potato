"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { postArtwork } from '@/app/actions';

export default function PostArtworkPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Helper to show a preview of the image before uploading
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Wrapper for the server action to handle the loading state
  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      await postArtwork(formData);
    } catch (error) {
      console.error(error);
      alert("Something went wrong while posting your artwork.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#FCFAF8] min-h-screen w-full flex items-center justify-center p-6 font-sans text-slate-800">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#1C4A5C] p-6 text-white flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold">Post an Artwork</h1>
            <p className="text-sm text-blue-50/80 font-medium mt-1">Share your creation with the Baybay community</p>
          </div>
          <Link href="/homepage" className="text-white/70 hover:text-white transition-colors bg-white/10 p-2 rounded-full hover:bg-white/20">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </Link>
        </div>

        {/* Upload Form */}
        <form action={handleSubmit} className="p-8 space-y-6">
          
          {/* Image Upload Area */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">Artwork Image *</label>
            <div className="relative border-2 border-dashed border-gray-300 rounded-2xl h-64 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer overflow-hidden group">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="Preview" className="object-cover w-full h-full" />
              ) : (
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-[#C87941]/10 text-[#C87941] rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  </div>
                  <p className="text-sm font-bold text-gray-600">Click to upload image</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, or WEBP (Max 5MB)</p>
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
              <label className="block text-sm font-bold text-gray-700">Title *</label>
              <input 
                type="text" 
                name="title" 
                required 
                placeholder="e.g. Sunset in Lintaon"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1C4A5C] focus:ring-2 focus:ring-[#1C4A5C]/20 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">Price (₱) *</label>
              <input 
                type="number" 
                name="price" 
                required 
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1C4A5C] focus:ring-2 focus:ring-[#1C4A5C]/20 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">Description</label>
            <textarea 
              name="description" 
              rows={4}
              placeholder="Tell us about the inspiration, materials used, or dimensions..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1C4A5C] focus:ring-2 focus:ring-[#1C4A5C]/20 outline-none transition-all resize-none"
            ></textarea>
          </div>

          <div className="pt-4 border-t border-gray-100 flex gap-4">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1 bg-[#C87941] text-white font-bold py-3.5 rounded-full hover:bg-[#a86536] hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Posting...' : 'Post to Marketplace'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}