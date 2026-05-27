'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { getArtworks } from '@/app/actions';

interface Artwork {
  artwork_id: number;
  title: string;
  description: string;
  price: number;
  file_url: string;
  category: string;
  status: string;
  created_at: string;
  users: { name: string } | null;
}

export default function BrowsePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('All Categories');
  const [sortBy, setSortBy] = useState('newest');
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);

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
      <div className="max-w-7xl mx-auto px-6 pt-10">
        
        {/* --- Header Section --- */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-[#1C4A5C] mb-2">Browse Artworks</h1>
          <p className="text-gray-500 font-medium">Discover handmade and original art from Baybay City artists</p>
        </div>

        {/* --- Search and Filter Bar --- */}
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 mb-8">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
            <input 
              type="text" 
              placeholder="Search artworks, artists..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#C87941] focus:border-[#C87941] transition-colors"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 min-w-[140px] focus:outline-none focus:ring-1 focus:ring-[#C87941]"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 min-w-[140px] focus:outline-none focus:ring-1 focus:ring-[#C87941]"
            >
              {sortOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* --- Results Count --- */}
        <p className="text-sm text-gray-500 font-medium mb-4">
          {loading ? 'Searching...' : `Showing ${artworks.length} results`}
        </p>

        {/* --- Artwork Grid --- */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C87941]"></div>
          </div>
        ) : artworks.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="text-xl font-bold text-gray-400">No results found</h2>
            <p className="text-gray-400">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {artworks.map((art) => (
              <div key={art.artwork_id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group flex flex-col">
                
                {/* Image Container */}
                <div className="relative h-48 bg-gray-200 overflow-hidden shrink-0">
                  {art.file_url && (
                    <Image 
                      src={art.file_url} 
                      alt={art.title} 
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  )}
                  {/* Gradient overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent z-0"></div>
                  
                  {/* Sold Out Overlay */}
                  {art.status === 'sold' && (
                    <div className="absolute inset-0 bg-black/40 z-10 flex items-center justify-center">
                      <span className="bg-black/70 text-white px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase">Sold Out</span>
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute bottom-3 left-3 bg-[#C87941] text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm z-10">
                    {art.category}
                  </div>
                  
                  <button className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm text-gray-400 hover:text-red-500 hover:scale-110 transition-all z-10">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  </button>
                </div>

                {/* Card Content */}
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-bold text-sm text-gray-900 group-hover:text-[#1C4A5C] transition-colors truncate">{art.title}</h3>
                  <button className="text-left text-xs text-[#3A6A7C] font-medium hover:underline mt-0.5">
                    {art.users?.name || 'Unknown Artist'}
                  </button>
                  
                  <div className="flex items-center gap-1 mt-2 text-xs">
                    <span className="text-[#f2a83b]">★</span> 
                    <span className="font-bold text-gray-700">4.8</span>
                    <span className="text-gray-400">(0)</span>
                  </div>
                  
                  {/* Spacer to push price to bottom if titles wrap differently */}
                  <div className="flex-1"></div>

                  <div className="flex justify-between items-center mt-4">
                    <span className="font-extrabold text-lg text-[#C87941]">₱{art.price?.toLocaleString()}</span>
                    <button 
                      disabled={art.status === 'sold'}
                      className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${
                        art.status === 'sold' 
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                          : 'bg-[#1C4A5C] hover:bg-[#143745] text-white shadow-sm hover:shadow'
                      }`}
                    >
                      Buy
                    </button>
                  </div>

                  {/* Card Footer (Likes, Comments, Ask) */}
                  <div className="flex items-center justify-between text-[11px] font-medium text-gray-400 mt-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 hover:text-[#C87941] cursor-pointer transition-colors">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                        0
                      </span>
                      <span className="flex items-center gap-1 hover:text-[#1C4A5C] cursor-pointer transition-colors">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        0
                      </span>
                    </div>
                    <button className="flex items-center gap-1 text-[#5c8a9c] hover:text-[#1C4A5C] transition-colors">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                      Ask Artist
                    </button>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}