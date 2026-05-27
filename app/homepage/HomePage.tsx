"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import SendMessageModal from '../src/components/SendMessageModal'; 

export default function HomePage() {
  const [artworks, setArtworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // NEW: State for the dynamic Top Artists
  const [topArtists, setTopArtists] = useState<any[]>([]);
  const [loadingArtists, setLoadingArtists] = useState(true);
  
  // State for the Message Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedArtistId, setSelectedArtistId] = useState('');
  const [selectedArtistName, setSelectedArtistName] = useState('');
  
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      // 1. Fetch available artworks dynamically on the client
      const { data: artData, error: artError } = await supabase
        .from('artworks')
        .select(`
          artwork_id,
          title,
          price,
          file_url,
          users ( name )
        `)
        .eq('status', 'available')
        .limit(6);

      if (!artError && artData) {
        setArtworks(artData);
      }
      setLoading(false);

      // 2. NEW: Fetch artists, their profiles, and their reviews
      const { data: artistsData, error: artistsError } = await supabase
        .from('users')
        .select(`
          user_id, 
          name, 
          avatar_url,
          artist_profiles ( specialty ),
          rating_reviews!artist_id ( rating )
        `)
        .eq('role', 'artist');

      if (!artistsError && artistsData) {
        // Calculate the average rating and sort them
        const ranked = artistsData.map((artist: any) => {
          const reviews = artist.rating_reviews || [];
          const totalStars = reviews.reduce((sum: number, r: any) => sum + r.rating, 0);
          const avg = reviews.length > 0 ? (totalStars / reviews.length).toFixed(1) : "0";
          
          return {
            id: artist.user_id,
            name: artist.name,
            avatar: artist.avatar_url,
            specialty: artist.artist_profiles?.[0]?.specialty || 'Creator',
            rating: parseFloat(avg),
            reviewCount: reviews.length
          };
        }).sort((a, b) => b.rating - a.rating).slice(0, 5); // Keep only the top 5
        
        setTopArtists(ranked);
      }
      setLoadingArtists(false);
    };

    fetchData();
  }, []); 

  // Function to trigger the modal
  const openMessageModal = (id: string, name: string) => {
    setSelectedArtistId(id);
    setSelectedArtistName(name);
    setIsModalOpen(true);
  };

  return (
    <div className="bg-[#FCFAF8] min-h-screen w-full text-slate-800 font-sans pb-20 relative">
      
      {/* --- Sticky Categories Header Section --- */}
      <div className="sticky top-0 z-50 bg-[#FCFAF8]/95 backdrop-blur-md py-4 border-b border-gray-200 shadow-sm mb-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-center gap-3">
          {/* Paintings */}
          <button className="group flex items-center gap-2 px-5 py-2 rounded-full border border-[#C87941]/30 text-[#C87941] bg-white hover:bg-[#C87941] hover:text-white transition-all shadow-sm hover:shadow-md">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.38 0 2.5-1.12 2.5-2.5 0-.61-.23-1.18-.64-1.64-.37-.41-.61-.96-.61-1.55 0-1.24 1.01-2.25 2.25-2.25h2.5c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8z"/></svg>
            <span className="font-semibold text-sm">Paintings</span>
          </button>
          
          {/* Weaving */}
          <button className="group flex items-center gap-2 px-5 py-2 rounded-full border border-[#1C4A5C]/30 text-[#1C4A5C] bg-white hover:bg-[#1C4A5C] hover:text-white transition-all shadow-sm hover:shadow-md">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
            <span className="font-semibold text-sm">Weaving</span>
          </button>
          
          {/* Pottery */}
          <button className="group flex items-center gap-2 px-5 py-2 rounded-full border border-[#8B5A2B]/30 text-[#8B5A2B] bg-white hover:bg-[#8B5A2B] hover:text-white transition-all shadow-sm hover:shadow-md">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 3h10v4c0 2.5-2 4-2 4s2 1.5 2 4v6H7v-6c0-2.5 2-4 2-4s-2-1.5-2-4V3z"/></svg>
            <span className="font-semibold text-sm">Pottery</span>
          </button>
          
          {/* Wood Carving */}
          <button className="group flex items-center gap-2 px-5 py-2 rounded-full border border-stone-500/30 text-stone-600 bg-white hover:bg-stone-600 hover:text-white transition-all shadow-sm hover:shadow-md">
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22v-8"/><path d="M12 14c-2.5-2-5-4-5-8 0-4 10-4 10 0 0 4-2.5 6-5 8z"/></svg>
            <span className="font-semibold text-sm">Wood Carving</span>
          </button>
          
          {/* Jewelry */}
          <button className="group flex items-center gap-2 px-5 py-2 rounded-full border border-[#f2a83b]/50 text-[#d48b1a] bg-white hover:bg-[#f2a83b] hover:text-white transition-all shadow-sm hover:shadow-md">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 22 22 7 12 2"/><polyline points="2 7 12 7 22 7"/><polyline points="12 22 12 7"/></svg>
            <span className="font-semibold text-sm">Jewelry</span>
          </button>
          
          {/* Digital Art */}
          <button className="group flex items-center gap-2 px-5 py-2 rounded-full border border-blue-500/30 text-blue-600 bg-white hover:bg-blue-600 hover:text-white transition-all shadow-sm hover:shadow-md">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            <span className="font-semibold text-sm">Digital Art</span>
          </button>
          
          {/* Embroidery */}
          <button className="group flex items-center gap-2 px-5 py-2 rounded-full border border-purple-500/30 text-purple-600 bg-white hover:bg-purple-600 hover:text-white transition-all shadow-sm hover:shadow-md">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>
            <span className="font-semibold text-sm">Embroidery</span>
          </button>
          
          {/* Photography */}
          <button className="group flex items-center gap-2 px-5 py-2 rounded-full border border-teal-600/30 text-teal-600 bg-white hover:bg-teal-600 hover:text-white transition-all shadow-sm hover:shadow-md">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            <span className="font-semibold text-sm">Photography</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {/* --- Quick Actions Cards Section --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Link href="/post-artwork" className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="w-14 h-14 rounded-full bg-[#C87941]/10 text-[#C87941] flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Post Artworks</h3>
            <p className="text-xs text-gray-500 font-medium">Share your creations</p>
          </Link>

          <Link href="/messages" className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="w-14 h-14 rounded-full bg-[#1C4A5C]/10 text-[#1C4A5C] flex items-center justify-center mb-4">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Direct Messaging</h3>
            <p className="text-xs text-gray-500 font-medium">Talk to artists</p>
          </Link>

          <Link href="/payments" className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="w-14 h-14 rounded-full bg-[#f2a83b]/20 text-[#d48b1a] flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Secure Payment</h3>
            <p className="text-xs text-gray-500 font-medium">Safe transactions</p>
          </Link>

          <Link href="/commissions" className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="w-14 h-14 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><polyline points="9 14 11 16 15 12"/></svg>
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Commissions</h3>
            <p className="text-xs text-gray-500 font-medium">Custom orders</p>
          </Link>
        </div>

        {/* --- Featured Artworks Section --- */}
        <div className="mb-16">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#1C4A5C]">Featured Artworks</h2>
              <p className="text-sm text-gray-500 mt-1 font-medium">Handpicked from local Baybayanon artists</p>
            </div>
            <button className="text-[#C87941] text-sm font-bold hover:text-[#a86536] transition-colors flex items-center gap-1">
              View All <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <p className="text-gray-500 col-span-3">Loading artworks...</p>
            ) : artworks && artworks.length > 0 ? (
              artworks.map((art) => (
                <div key={art.artwork_id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group">
                  <div className="relative h-56 bg-gray-100 overflow-hidden">
                     {/* Dynamic image loading */}
                     <img 
                        src={art.file_url || '/background.png'} 
                        alt={art.title}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                     <button className="absolute top-4 right-4 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md text-gray-400 hover:text-red-500 hover:scale-110 transition-all">
                       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                     </button>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-[#1C4A5C] transition-colors">{art.title}</h3>
                    <p className="text-sm text-gray-500 font-medium mb-3">
                      by <span className="text-[#3A6A7C]">{art.users?.name || 'Unknown Artist'}</span>
                    </p>
                    <div className="flex justify-between items-center mt-4">
                      <span className="font-extrabold text-xl text-[#C87941]">₱{art.price}</span>
                      <button className="bg-[#1C4A5C] hover:bg-[#143745] text-white px-5 py-2.5 rounded-full text-sm font-bold transition-all hover:shadow-md">
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 italic col-span-3">No artworks available right now. Check back soon!</p>
            )}
          </div>
        </div>

        {/* --- Bottom Layout: Feed & Sidebar --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Feed Column */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-[#1C4A5C] mb-6">Community Feed</h2>
            
            {/* Feed Post 1 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full border-2 border-white shadow-sm"></div>
                <div>
                  <h4 className="font-bold text-sm text-gray-900">Maria Santos</h4>
                  <p className="text-xs text-gray-400 font-medium">2 hours ago</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-4 leading-relaxed">Just finished my latest oil painting inspired by the Baybay coastline! The colors of the sunset were just too beautiful to ignore. Available for sale now. 🌊✨</p>
              <div className="h-72 bg-gray-100 rounded-xl mb-5 w-full"></div>
              <div className="flex items-center gap-6 text-sm text-gray-500 border-t border-gray-100 pt-4">
                <button className="flex items-center gap-2 hover:text-[#C87941] font-medium transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> 42
                </button>
                <button className="flex items-center gap-2 hover:text-[#1C4A5C] font-medium transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> 8
                </button>
                <button className="flex items-center gap-2 hover:text-[#1C4A5C] font-medium transition-colors ml-auto">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg> Share
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar Column: Dynamic Top Artists */}
          <div className="lg:col-span-1">
            <div className="flex justify-between items-end mb-6">
              <h2 className="text-2xl font-bold text-[#1C4A5C]">Top Artists</h2>
              <button className="text-[#C87941] text-sm font-bold hover:text-[#a86536] transition-colors">See All</button>
            </div>

            {/* Render Dynamic Top Artists List */}
            <div className="space-y-4 mb-8">
              {loadingArtists ? (
                <p className="text-gray-500 text-sm text-center py-4">Loading top creators...</p>
              ) : topArtists && topArtists.length > 0 ? (
                topArtists.map((artist) => (
                  <div key={artist.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      {artist.avatar ? (
                        <img src={artist.avatar} alt={artist.name} className="w-12 h-12 bg-gray-200 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-[#1C4A5C] to-[#3A6A7C] text-white flex items-center justify-center font-bold text-lg rounded-full">
                          {artist.name?.charAt(0) || '?'}
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-sm text-gray-900 flex items-center gap-1">
                          {artist.name} 
                          {artist.rating >= 4.5 && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="#3b82f6" stroke="white" strokeWidth="2" className="text-blue-500"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                          )}
                        </h4>
                        <p className="text-xs text-gray-500 font-medium">{artist.specialty}</p>
                        <p className="text-xs font-bold text-gray-700 mt-1 flex items-center gap-1">
                          <span className={artist.rating > 0 ? "text-[#f2a83b]" : "text-gray-300"}>★</span> 
                          {artist.rating > 0 ? artist.rating : "New"} 
                          {artist.reviewCount > 0 && <span className="text-gray-400 font-medium ml-1">· {artist.reviewCount} reviews</span>}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => openMessageModal(artist.id, artist.name)}
                      className="px-4 py-1.5 border-2 border-gray-100 rounded-full text-xs font-bold text-gray-600 hover:border-[#1C4A5C] hover:text-[#1C4A5C] transition-colors"
                    >
                      Message
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm text-center py-4 bg-white rounded-xl border border-gray-100">No rated artists yet.</p>
              )}
            </div>

            {/* Commission CTA Card */}
            <div className="bg-gradient-to-br from-[#1C4A5C] to-[#143745] rounded-2xl p-8 text-white text-center shadow-lg relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white opacity-10 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
              
              <div className="text-4xl mb-4 relative z-10">✨</div>
              <h3 className="font-extrabold text-xl mb-2 relative z-10">Need Something Custom?</h3>
              <p className="text-sm text-blue-50/90 mb-8 font-medium leading-relaxed relative z-10">
                Post a commission request and let talented Baybayanon artists come to you!
              </p>
              <Link href="/commissions">
                <button className="w-full bg-[#f2a83b] text-slate-900 font-bold py-3.5 rounded-full hover:bg-[#ffbd59] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 shadow-sm relative z-10">
                  Post Commission
                </button>
              </Link>
            </div>

          </div>
        </div>

        {/* --- Render the Modal --- */}
        <SendMessageModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          receiverId={selectedArtistId}
          receiverName={selectedArtistName}
        />
        
      </div>
    </div>
  );
}