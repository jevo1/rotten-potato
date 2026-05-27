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

const supabase = createClient();

export default function HomePage() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [topArtists, setTopArtists] = useState<ArtistRanked[]>([]);
  const [loadingArtists, setLoadingArtists] = useState(true);
  
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    // Hide body scrollbar
    document.body.style.overflow = 'hidden';
    return () => {
      // Restore body scrollbar on unmount
      document.body.style.overflow = 'unset';
    };
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedArtistId, setSelectedArtistId] = useState('');
  const [selectedArtistName, setSelectedArtistName] = useState('');

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
  }, []);

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
  }, []); 

  const openMessageModal = (id: string, name: string) => {
    setSelectedArtistId(id);
    setSelectedArtistName(name);
    setIsModalOpen(true);
  };

  return (
    <div className="bg-[#FCFAF8] h-[calc(100vh-116px)] overflow-hidden">
      <div className="w-full h-full grid grid-cols-12 pl-0 lg:pl-6">
        {/* Left Column (9 units) */}
        <div className="col-span-12 lg:col-span-9 overflow-y-auto custom-scrollbar h-full px-6 pt-8 pb-20">
          {/* Artwork Carousel */}
          <div className="relative h-[450px] rounded-3xl overflow-hidden mb-10 shadow-xl group">
            {loading ? (
              <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center">
                <p className="text-gray-400 font-medium">Loading featured artworks...</p>
              </div>
            ) : artworks.length > 0 ? (
              <>
                {artworks.map((art, index) => (
                  <div 
                    key={art.artwork_id}
                    className={`absolute inset-0 transition-all duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'}`}
                  >
                    <Image 
                      src={art.file_url || '/background.png'} 
                      alt={art.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
                    <div className="absolute bottom-12 left-12 text-white max-w-xl">
                      <span className="inline-block bg-[#f2a83b] text-slate-900 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4">Featured Artwork</span>
                      <h2 className="text-5xl font-black mb-3 leading-tight">{art.title}</h2>
                      <p className="text-lg font-medium opacity-90 mb-8 flex items-center gap-2">
                         by <span className="text-[#f2a83b] font-bold">{art.users?.name}</span>
                      </p>
                      <div className="flex items-center gap-4">
                          <button className="bg-[#f2a83b] text-slate-900 px-10 py-4 rounded-full font-black hover:bg-[#ffbd59] transition-all hover:scale-105 active:scale-95 shadow-lg">
                              View Artwork
                          </button>
                          <span className="text-2xl font-black text-white">₱{art.price}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {/* Slide Indicators */}
                <div className="absolute bottom-8 right-12 flex gap-3">
                  {artworks.map((_, i) => (
                    <button 
                      key={i} 
                      onClick={() => setCurrentSlide(i)}
                      className={`h-1.5 rounded-full transition-all duration-500 ${i === currentSlide ? 'bg-[#f2a83b] w-12' : 'bg-white/30 w-6 hover:bg-white/60'}`}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <p className="text-gray-400 italic">No featured artworks available.</p>
              </div>
            )}
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
            <div className="relative w-full overflow-hidden rounded-xl mb-5 bg-gray-50 border border-gray-100 flex items-center justify-center">
              <Image 
                src="/portait.jpg" 
                alt="Post content"
                width={800}
                height={1000}
                className="w-full h-auto max-h-[550px] object-contain"
              />
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500 border-t border-gray-100 pt-4">              <button className="flex items-center gap-2 hover:text-[#C87941] font-medium transition-colors">
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

        {/* Right Column (3 units) */}
        <div className="hidden lg:flex lg:col-span-3 h-full border-l border-gray-100 bg-white/50 pl-6 pr-2 py-6 sticky top-0 flex-col overflow-hidden">
          <div className="flex justify-between items-end mb-5 flex-none pr-4">
            <h2 className="text-lg font-bold text-[#1C4A5C]">Top Artists</h2>
            <button className="text-[#C87941] text-[10px] font-bold hover:text-[#a86536] transition-colors">See All</button>
          </div>

          {/* Render Dynamic Top Artists List */}
          <div className="space-y-2 mb-6 max-h-[280px] overflow-y-auto custom-scrollbar pr-3">
            {loadingArtists ? (
              <p className="text-gray-500 text-[10px] text-center py-4">Loading top creators...</p>
            ) : topArtists && topArtists.length > 0 ? (
              topArtists.map((artist) => (
                <div key={artist.id} className="bg-white p-2.5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2.5">
                    {artist.avatar ? (
                      <div className="w-8 h-8 relative flex-none">
                        <Image src={artist.avatar} alt={artist.name} fill className="bg-gray-200 rounded-full object-cover aspect-square" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-[#1C4A5C] to-[#3A6A7C] text-white flex items-center justify-center font-bold text-sm rounded-full flex-none aspect-square">
                        {artist.name?.charAt(0) || '?'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="font-bold text-[11px] text-gray-900 flex items-center gap-1 truncate">
                        {artist.name} 
                        {artist.rating >= 4.5 && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="#3b82f6" stroke="white" strokeWidth="2" className="text-blue-500 flex-none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        )}
                      </h4>
                      <p className="text-[9px] text-gray-500 font-medium truncate">{artist.specialty}</p>
                      <p className="text-[9px] font-bold text-gray-700 mt-0.5 flex items-center gap-1">
                        <span className={artist.rating > 0 ? "text-[#f2a83b]" : "text-gray-300"}>★</span> 
                        {artist.rating > 0 ? artist.rating : "New"} 
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => openMessageModal(artist.id, artist.name)}
                    className="px-2.5 py-1 border border-gray-100 rounded-full text-[9px] font-bold text-gray-600 hover:border-[#1C4A5C] hover:text-[#1C4A5C] transition-colors flex-none"
                  >
                    Message
                  </button>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-[10px] text-center py-4 bg-white rounded-xl border border-gray-100">No rated artists yet.</p>
            )}
          </div>

          {/* Commission CTA Card */}
          <div className="bg-gradient-to-br from-[#1C4A5C] to-[#143745] rounded-xl p-5 text-white text-center shadow-lg relative overflow-hidden group flex-none mt-auto mr-3">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-white opacity-10 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
            
            <div className="text-2xl mb-2 relative z-10">✨</div>
            <h3 className="font-extrabold text-base mb-1 relative z-10">Custom Art?</h3>
            <p className="text-[10px] text-blue-50/90 mb-4 font-medium leading-tight relative z-10">
              Post a commission and let local artists come to you!
            </p>
            <Link href="/commissions">
              <button className="w-full bg-[#f2a83b] text-slate-900 font-bold py-2.5 rounded-full hover:bg-[#ffbd59] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 shadow-sm relative z-10 text-[11px]">
                Post Commission
              </button>
            </Link>
          </div>
        </div>
      </div>

      <SendMessageModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        receiverId={selectedArtistId}
        receiverName={selectedArtistName}
      />
    </div>
  );
}