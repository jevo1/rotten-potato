"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import PostArtworkModal from '../src/components/PostArtworkModal';
import DashboardNavBar from './DashboardNavBar';

interface Artwork {
  artwork_id: number;
  title: string;
  price: number;
  file_url: string;
  status: string;
}

// Added avatar_url to the local user type interface
interface UserProfile {
  role: string;
  name: string;
  avatar_url?: string | null;
}

export default function DashboardPage() {
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [myArtworks, setMyArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Updated query to pull the real-time avatar_url alongside your profile data
      const { data: profile } = await supabase
        .from('users')
        .select('role, name, avatar_url')
        .eq('user_id', user.id)
        .single();

      if (profile?.role !== 'artist') {
        setUserData(profile);
        setLoading(false);
        return;
      }

      const { data: artworks } = await supabase
        .from('artworks')
        .select('*')
        .eq('user_id', user.id)
        .order('artwork_id', { ascending: false });

      setUserData(profile);
      setMyArtworks(artworks || []);
      setLoading(false);
    }
    init();
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FCFAF8] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#1C4A5C] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-bold text-sm uppercase tracking-widest">Loading Studio...</p>
        </div>
      </div>
    );
  }

  if (userData?.role !== 'artist') {
    return (
      <div className="min-h-screen bg-[#FCFAF8] flex flex-col">
        <DashboardNavBar 
          displayName={userData?.name || 'User'} 
          avatarUrl={userData?.avatar_url || null} 
        />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-red-100/50">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          </div>
          <h1 className="text-2xl font-black text-[#1C4A5C] mb-2 uppercase tracking-tight">Access Denied</h1>
          <p className="text-gray-500 mb-8 font-medium max-w-xs">The Studio Dashboard is exclusively for verified artists.</p>
          <Link href="/profile" className="bg-[#C87941] hover:bg-[#a86536] text-white px-8 py-3 rounded-full font-black text-sm uppercase tracking-widest transition-all shadow-lg active:scale-95">
            Back to Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FCFAF8] min-h-screen w-full flex flex-col">
      {/* Universal Global Navigation Bar */}
      <DashboardNavBar 
        displayName={userData?.name || 'User'} 
        avatarUrl={userData?.avatar_url || null} 
      />

      {/* Main Panel Content Container */}
      <main className="flex-1 font-sans text-slate-800 p-6 md:p-10">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
            <div>
              <h1 className="text-4xl font-black text-[#1C4A5C] tracking-tight">Creator Studio</h1>
              <p className="text-gray-500 font-medium mt-1">Manage your professional art portfolio and sales.</p>
            </div>
            <div className="flex gap-3">
              <Link href="/profile" className="bg-white border-2 border-gray-100 text-gray-700 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm hover:border-[#1C4A5C] hover:text-[#1C4A5C] transition-all">
                View Profile
              </Link>
              <button 
                onClick={() => setIsPostModalOpen(true)}
                className="bg-[#f2a83b] hover:bg-[#e09b36] text-slate-900 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm hover:shadow-md transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-95"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                New Artwork
              </button>
            </div>
          </div>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* Left Sidebar: Quick Stats */}
            <div className="md:col-span-1 space-y-6">
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Total Artworks</h3>
                <p className="text-5xl font-black text-[#1C4A5C]">{myArtworks?.length || 0}</p>
                <div className="mt-6 pt-6 border-t border-gray-50">
                   <p className="text-xs font-bold text-green-500 flex items-center gap-1">
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 17 8.5 11.5 1 19"/><polyline points="17 6 23 6 23 12"/></svg>
                     Active Portfolio
                   </p>
                </div>
              </div>
            </div>

            {/* Right Area: Artworks Management */}
            <div className="md:col-span-3">
              <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
                <div className="p-8 border-b border-gray-50 bg-[#FCFAF8]/50 flex justify-between items-center">
                  <h2 className="text-xl font-black text-gray-900 tracking-tight">Active Listings</h2>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-gray-100">Live on Market</span>
                </div>
                
                <div className="p-8">
                  {myArtworks && myArtworks.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      {myArtworks.map((art) => (
                        <div key={art.artwork_id} className="bg-[#FCFAF8]/30 border border-gray-100 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-gray-200/80 transition-all duration-300 group flex flex-col">
                          <div className="h-48 bg-gray-100 relative overflow-hidden">
                             <Image 
                                src={art.file_url || '/background.png'} 
                                alt={art.title}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-700"
                             />
                             <div className="absolute top-4 left-4 bg-white px-3 py-1 rounded-full text-[10px] font-black shadow-xl uppercase tracking-widest z-10 text-[#1C4A5C]">
                               {art.status}
                             </div>
                          </div>
                          <div className="p-6 flex-1 flex flex-col">
                            <h3 className="font-black text-lg text-gray-900 truncate tracking-tight">{art.title}</h3>
                            <p className="text-[#C87941] font-black text-xl mt-1 tracking-tight">₱{art.price.toLocaleString()}</p>
                            <div className="mt-auto pt-6 flex gap-3">
                              <button className="flex-1 bg-white hover:bg-gray-50 text-gray-700 py-3 rounded-xl text-xs font-black uppercase tracking-widest border border-gray-100 transition-all shadow-sm">Edit</button>
                              <button className="flex-1 bg-red-50 hover:bg-red-100 text-red-500 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all">Delete</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 bg-[#FCFAF8]/50 rounded-2xl border-2 border-dashed border-gray-100">
                      <div className="w-20 h-20 bg-white rounded-3xl shadow-xl shadow-gray-200/50 flex items-center justify-center mx-auto mb-6">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1C4A5C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                      </div>
                      <h3 className="text-xl font-black text-gray-900 mb-2 tracking-tight uppercase">Empty Gallery</h3>
                      <p className="text-gray-400 text-sm mb-10 font-medium">Your masterpieces are waiting to be seen.</p>
                      <button 
                        onClick={() => setIsPostModalOpen(true)}
                        className="bg-[#1C4A5C] text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-[#1C4A5C]/20 hover:scale-105 active:scale-95 transition-all"
                      >
                        Post First Artwork
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
      
      <PostArtworkModal isOpen={isPostModalOpen} onClose={() => setIsPostModalOpen(false)} />
    </div>
  );
}