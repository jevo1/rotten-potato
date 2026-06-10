"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { X, ShoppingCart, Tag, Clock, ChevronRight } from 'lucide-react';
import { addToCart } from '@/app/actions/index';
import AddToCartModal from './AddToCartModal';

interface ArtworkDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  artwork: {
    artwork_id: string;
    title: string;
    description: string | null;
    file_url: string;
    price: number;
    created_at?: string;
    category?: string;
  } | null;
}

export default function ArtworkDetailModal({ isOpen, onClose, artwork }: ArtworkDetailModalProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  if (!isOpen || !artwork) return null;

  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      await addToCart(Number(artwork.artwork_id));
      setShowSuccess(true);
    } catch (error: any) {
      alert(error.message || "Failed to add to cart");
    } finally {
      setIsAdding(false);
    }
  };

  if (showSuccess) {
    return (
      <AddToCartModal 
        isOpen={true} 
        onClose={() => {
          setShowSuccess(false);
          onClose();
        }} 
        artworkTitle={artwork.title} 
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-0 md:p-8">
      <div className="bg-white w-full h-full md:h-auto md:max-w-5xl md:max-h-[90vh] md:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in duration-300">
        
        {/* Image Section */}
        <div className="md:w-3/5 bg-gray-50 relative min-h-[40vh] md:min-h-0 shrink-0">
          <Image 
            src={artwork.file_url} 
            alt={artwork.title} 
            fill 
            className="object-contain p-4 md:p-8"
          />
          <button 
            onClick={onClose}
            className="absolute top-4 left-4 md:hidden bg-white/80 backdrop-blur-sm p-2 rounded-full text-gray-900 shadow-md z-20"
          >
            <X size={20} />
          </button>
        </div>

        {/* Info Section */}
        <div className="md:w-2/5 p-6 md:p-12 overflow-y-auto custom-scrollbar flex flex-col bg-white">
          <div className="flex justify-between items-start mb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-orange-50 text-orange-600 text-[9px] md:text-[10px] font-black uppercase tracking-widest px-2 md:px-2.5 py-0.5 md:py-1 rounded-md">
                  Artwork
                </span>
                {artwork.category && (
                  <span className="text-gray-400 text-[9px] md:text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                    <ChevronRight size={10} /> {artwork.category}
                  </span>
                )}
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">{artwork.title}</h2>
            </div>
            <button 
              onClick={onClose}
              className="hidden md:flex text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex items-center gap-6 mb-6 md:mb-8 py-4 border-y border-gray-100">
            <div className="flex flex-col">
              <span className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                <Tag size={10} /> Price
              </span>
              <span className="text-xl md:text-2xl font-black text-[#C87941]">₱{artwork.price}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock size={10} /> Listed on
              </span>
              <span className="text-xs md:text-sm font-bold text-gray-700">
                {artwork.created_at ? new Date(artwork.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}
              </span>
            </div>
          </div>

          <div className="space-y-3 md:space-y-4 mb-8 md:mb-10 flex-1">
            <h4 className="text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-widest">Description</h4>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line text-xs md:text-sm font-medium">
              {artwork.description || "No description provided by the artist."}
            </p>
          </div>

          <div className="pb-8 md:pb-0">
            <button 
              onClick={handleAddToCart}
              disabled={isAdding}
              className="w-full bg-[#1C4A5C] text-white py-3.5 md:py-4 rounded-2xl font-black text-xs md:text-sm hover:bg-[#143745] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-[#1C4A5C]/20 flex items-center justify-center gap-2 md:gap-3 group disabled:opacity-50"
            >
              {isAdding ? (
                <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                <>
                  <ShoppingCart className="w-4 h-4 md:w-[18px] md:h-[18px] group-hover:-translate-y-0.5 transition-transform" />
                  Add to Cart
                </>
                )}

            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
