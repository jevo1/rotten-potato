"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import SendMessageModal from '../src/components/SendMessageModal'; 

interface Artwork {
  artwork_id: number;
  title: string;
  price: number;
  file_url: string;
  users: {
    name: string;
  } | null;
}

interface ArtistRanked {
  id: string;
  name: string;
  avatar: string;
  specialty: string;
  rating: number;
  reviewCount: number;
}

export default function HomePage() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [topArtists, setTopArtists] = useState<ArtistRanked[]>([]);
  const [loadingArtists, setLoadingArtists] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedArtistId, setSelectedArtistId] = useState('');
  const [selectedArtistName, setSelectedArtistName] = useState('');
  
  const supabase = createClient();

  useEffect(() => {
    const fetchArtworks = async () => {
      setLoading(true);
      const { data, error } = await supabase
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

      if (!error && data) {
        setArtworks(data as unknown as Artwork[]);
      }
      setLoading(false);
    };

    fetchArtworks();
  }, [supabase]);

  useEffect(() => {
    const fetchArtists = async () => {
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

      interface ArtistData {
        user_id: string;
        name: string;
        avatar_url: string;
        artist_profiles: { specialty: string }[];
        rating_reviews: { rating: number }[];
      }

      if (!artistsError && artistsData) {
        const ranked = (artistsData as unknown as ArtistData[]).map((artist) => {
          const reviews = artist.rating_reviews || [];
          const totalStars = reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0);
          const avg = reviews.length > 0 ? (totalStars / reviews.length).toFixed(1) : "0";
          
          return {
            id: artist.user_id,
            name: artist.name,
            avatar: artist.avatar_url,
            specialty: artist.artist_profiles?.[0]?.specialty || 'Creator',
            rating: parseFloat(avg),
            reviewCount: reviews.length
          };
        }).sort((a, b) => b.rating - a.rating).slice(0, 5);
        
        setTopArtists(ranked);
      }
      setLoadingArtists(false);
    };

    fetchArtists();
  }, [supabase]); 

  const openMessageModal = (id: string, name: string) => {
    setSelectedArtistId(id);
    setSelectedArtistName(name);
    setIsModalOpen(true);
  };

  return (
    <div className="bg-[#FCFAF8] h-[calc(100vh-76px)] overflow-hidden">
      <div className="max-w-[1600px] mx-auto h-full grid grid-cols-12">
        {/* Left Column (8 units) */}
        <div className="col-span-12 lg:col-span-8 overflow-y-auto custom-scrollbar h-full px-6 pt-8 pb-20">
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
                       <Image 
                          src={art.file_url || '/background.png'} 
                          alt={art.title}
                          fill
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

        {/* Right Column (4 units) */}
        <div className="hidden lg:block lg:col-span-4 h-full border-l border-gray-100 bg-white/50 px-8 pt-8 sticky top-0 overflow-y-auto">
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
                      <Image src={artist.avatar} alt={artist.name} width={48} height={48} className="bg-gray-200 rounded-full object-cover" />
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
  );
}