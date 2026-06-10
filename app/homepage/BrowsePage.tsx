'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { getArtworks, addToCart } from '@/app/actions/index';
import { Loader2, ShoppingCart } from 'lucide-react';
import AddToCartModal from '../src/components/AddToCartModal';

interface Artwork {
  artwork_id: number;
  title: string;
  description: string;
  price: number;
  file_url: string;
  category: string;
  status: string;
  stock_quantity: number;
  created_at: string;
  users: { name: string } | null;
}

export default function BrowsePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('All Categories');
  const [sortBy, setSortBy] = useState('newest');
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartLoadingId, setCartLoadingId] = useState<number | null>(null);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [lastAddedTitle, setLastAddedTitle] = useState('');

  const categories = [
    'All Categories',
    'Digital',
    'Pottery',
    'Jewelry',
    'Paintings',
    'Weaving',
    'Wood Carving',
    'Embroidery',
    'Crafts'
  ];

  const sortOptions = [
    { label: 'Most Popular', value: 'popular' },
    { label: 'Price: Low to High', value: 'price_asc' },
    { label: 'Price: High to Low', value: 'price_desc' },
    { label: 'Newest Arrivals', value: 'newest' },
  ];

  const handleAddToCart = async (artworkId: number) => {
    setCartLoadingId(artworkId);
    try {
      await addToCart(artworkId);
      const art = artworks.find(a => a.artwork_id === artworkId);
      if (art) setLastAddedTitle(art.title);
      setIsCartModalOpen(true);
    } catch (error) {
      console.error("Failed to add to cart:", error);
      alert(error instanceof Error ? error.message : "Failed to add to cart");
    } finally {
      setCartLoadingId(null);
    }
  };

  const fetchArtworks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getArtworks({
        search: searchTerm,
        category: category,
        sortBy: sortBy as 'popular' | 'price_asc' | 'price_desc' | 'newest'
      });
      setArtworks(data as Artwork[]);
    } catch (error) {
      console.error('Error fetching artworks:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, category, sortBy]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchArtworks();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [fetchArtworks]);

  return (
    <div className="bg-[#FCFAF8] min-h-screen w-full text-slate-800 font-sans pb-20">
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6 md:pt-10">

        {/* --- Header Section --- */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#1C4A5C] mb-1 md:mb-2 tracking-tight">Browse Artworks</h1>
          <p className="text-xs md:text-sm text-gray-500 font-medium leading-relaxed">Discover handmade and original art from Baybay City artists</p>    
        </div>

        {/* --- Search and Filter Bar --- */}
        <div className="bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 md:gap-4 mb-6 md:mb-8">

          {/* Search Input */}
          <div className="relative w-full">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
            <input 
              type="text" 
              placeholder="Search artworks, artists..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3 md:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C87941]/10 focus:border-[#C87941] transition-all"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 md:py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#C87941]/10 transition-all cursor-pointer"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>

            <div className="relative flex-1">
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 md:py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#C87941]/10 transition-all cursor-pointer"
              >
                {sortOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
          </div>
        </div>

        {/* --- Results Count --- */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs md:text-sm text-gray-400 font-bold uppercase tracking-widest">
            {loading ? 'Searching...' : `${artworks.length} Masterpieces Found`}
          </p>
        </div>

        {/* --- Artwork Grid --- */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-10 h-10 border-4 border-[#C87941] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">Filtering Gallery...</p>
          </div>
        ) : artworks.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-gray-100">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
               <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            <h2 className="text-lg font-bold text-gray-400">No results found</h2>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {artworks.map((art) => (
              <div key={art.artwork_id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group flex flex-col">

                {/* Image Container */}
                <div className="relative aspect-square md:h-48 bg-gray-50 overflow-hidden shrink-0">
                  {art.file_url && (
                    <Image 
                      src={art.file_url} 
                      alt={art.title} 
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700" 
                    />
                  )}

                  {/* Status Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
                    <div className="bg-[#C87941] text-white text-[9px] font-black px-2.5 py-1 rounded-md shadow-lg shadow-[#C87941]/20 uppercase tracking-widest">
                      {art.category}
                    </div>
                  </div>

                  {/* Sold Out Overlay */}
                  {art.status === 'sold' && (
                    <div className="absolute inset-0 bg-black/60 z-[15] flex items-center justify-center backdrop-blur-[2px]">
                      <span className="bg-white text-black px-5 py-2 rounded-full text-[10px] font-black tracking-[0.2em] uppercase shadow-2xl">Sold Out</span>
                    </div>
                  )}

                  <button className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg text-gray-400 hover:text-red-500 hover:scale-110 transition-all z-20">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  </button>
                </div>

                {/* Card Content */}
                <div className="p-5 flex flex-col flex-1">
                  <div className="mb-4">
                    <h3 className="font-black text-gray-900 group-hover:text-[#1C4A5C] transition-colors truncate text-base tracking-tight">{art.title}</h3>
                    <button className="text-left text-[11px] text-gray-400 font-bold uppercase tracking-wider hover:text-[#1C4A5C] transition-colors mt-1">
                      by {art.users?.name || 'Unknown Artist'}
                    </button>
                  </div>

                  <div className="flex items-center gap-1 mb-4">
                    <div className="flex items-center gap-0.5 text-[#f2a83b]">
                       <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    </div>
                    <span className="font-black text-gray-900 text-xs">4.8</span>
                    <span className="text-[10px] text-gray-400 font-bold">(12 reviews)</span>
                  </div>

                  {/* Price and Action */}
                  <div className="mt-auto pt-5 border-t border-gray-50 flex items-center justify-between">
                    <span className="font-black text-xl text-[#C87941] tracking-tight">₱{art.price?.toLocaleString()}</span>     
                    <button 
                      onClick={() => handleAddToCart(art.artwork_id)}
                      disabled={art.status === 'sold' || (art.stock_quantity !== undefined && art.stock_quantity <= 0) || cartLoadingId === art.artwork_id}
                      className={`h-10 px-6 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                        art.status === 'sold' || (art.stock_quantity !== undefined && art.stock_quantity <= 0) || cartLoadingId === art.artwork_id
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-[#1C4A5C] hover:bg-[#143745] text-white shadow-xl shadow-[#1C4A5C]/20 active:scale-95'
                      }`}
                    >
                      {cartLoadingId === art.artwork_id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <>
                          <ShoppingCart size={14} strokeWidth={2.5} />
                          Add
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
}

      </div>

      <AddToCartModal 
        isOpen={isCartModalOpen} 
        onClose={() => setIsCartModalOpen(false)} 
        artworkTitle={lastAddedTitle} 
      />
    </div>
  );
}