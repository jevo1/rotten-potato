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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      {/* Modal Container */}
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-orange-50">
        
        {/* Close Button (Optional top right) */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full z-10"
        >
          <X size={20} />
        </button>

        <div className="p-8 text-center">
          {/* Success Icon */}
          <div className="relative mb-6 mx-auto w-20 h-20">
            <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-20"></div>
            <div className="relative w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center shadow-inner border border-green-100">
               <Check size={40} strokeWidth={3} />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-[#C87941] text-white p-2 rounded-full shadow-lg border-2 border-white">
                <ShoppingCart size={16} fill="currentColor" />
            </div>
          </div>

          <h4 className="text-2xl font-black text-gray-900 mb-2">Added to Cart!</h4>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            <span className="font-bold text-[#1C4A5C]">&quot;{artworkTitle}&quot;</span> has been successfully added to your shopping cart.
          </p>

          <div className="flex flex-col gap-3">
            <Link href="/cart" className="w-full">
                <button className="w-full bg-[#1C4A5C] text-white py-3.5 rounded-2xl font-black text-sm hover:bg-[#143745] hover:scale-[1.02] transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 group">
                    View My Cart
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </Link>
            
            <button
                onClick={onClose}
                className="w-full bg-gray-50 text-gray-600 py-3.5 rounded-2xl font-bold text-sm hover:bg-gray-100 transition-all active:scale-95"
            >
                Continue Shopping
            </button>
          </div>
        </div>

        {/* Footer Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#1C4A5C] via-[#C87941] to-[#f2a83b]"></div>
      </div>
    </div>
  );
}
