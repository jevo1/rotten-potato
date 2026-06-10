"use client";
import React from 'react';
import Link from 'next/link';
import { ShoppingCart, Check, ArrowRight, X } from 'lucide-react';

interface AddToCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  artworkTitle: string;
}

export default function AddToCartModal({ isOpen, onClose, artworkTitle }: AddToCartModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-0 md:p-4">
      {/* Modal Container */}
      <div className="bg-white w-full h-full md:h-auto md:max-w-sm md:rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-orange-50 flex flex-col justify-center">
        
        {/* Close Button (Optional top right) */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full z-10"
        >
          <X size={20} />
        </button>

        <div className="p-6 md:p-8 text-center">
          {/* Success Icon */}
          <div className="relative mb-6 mx-auto w-16 h-16 md:w-20 md:h-20">
            <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-20"></div>
            <div className="relative w-16 h-16 md:w-20 md:h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center shadow-inner border border-green-100">
               <Check strokeWidth={3} className="w-8 h-8 md:w-10 md:h-10" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-[#C87941] text-white p-1.5 md:p-2 rounded-full shadow-lg border-2 border-white">
                <ShoppingCart fill="currentColor" className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </div>
          </div>

          <h4 className="text-xl md:text-2xl font-black text-gray-900 mb-2">Added to Cart!</h4>
          <p className="text-gray-500 text-xs md:text-sm mb-8 leading-relaxed px-4 md:px-0">
            <span className="font-bold text-[#1C4A5C]">&quot;{artworkTitle}&quot;</span> has been successfully added to your shopping cart.
          </p>

          <div className="flex flex-col gap-3 max-w-[280px] mx-auto w-full">
            <Link href="/cart" className="w-full">
                <button className="w-full bg-[#1C4A5C] text-white py-3 md:py-3.5 rounded-2xl font-black text-xs md:text-sm hover:bg-[#143745] hover:scale-[1.02] transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 group">
                    View My Cart
                    <ArrowRight className="w-4 h-4 md:w-[18px] md:h-[18px] group-hover:translate-x-1 transition-transform" />
                </button>
            </Link>
            
            <button
                onClick={onClose}
                className="w-full bg-gray-50 text-gray-600 py-3 md:py-3.5 rounded-2xl font-bold text-xs md:text-sm hover:bg-gray-100 transition-all active:scale-95"
            >
                Continue Shopping
            </button>
          </div>
        </div>

        {/* Footer Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#1C4A5C] via-[#C87941] to-[#f2a83b] shrink-0"></div>
      </div>
    </div>
  );
}
