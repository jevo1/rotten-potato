import React from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  // 1. Verify the user is logged in
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/login');
  }

  // 2. Double-check they are actually an artist
  const { data: userData } = await supabase
    .from('users')
    .select('role, name')
    .eq('user_id', user.id)
    .single();

  if (userData?.role !== 'artist') {
    return (
      <div className="min-h-screen bg-[#FCFAF8] flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold text-[#1C4A5C] mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6">The Studio Dashboard is only available for verified artists.</p>
        <Link href="/profile" className="bg-[#C87941] text-white px-6 py-2 rounded-full font-bold">
          Back to Profile
        </Link>
      </div>
    );
  }

  // 3. Fetch all artworks posted by this artist
  const { data: myArtworks } = await supabase
    .from('artworks')
    .select('*')
    .eq('user_id', user.id)
    .order('artwork_id', { ascending: false });

  return (
    <div className="bg-[#FCFAF8] min-h-screen w-full font-sans text-slate-800 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-extrabold text-[#1C4A5C]">Creator Studio</h1>
            <p className="text-gray-500 font-medium mt-1">Welcome back, {userData?.name || 'Artist'}. Manage your artworks and sales here.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/profile" className="bg-white border-2 border-gray-200 text-gray-700 px-6 py-2.5 rounded-full font-bold shadow-sm hover:border-[#1C4A5C] hover:text-[#1C4A5C] transition-all">
              View Public Profile
            </Link>
            <Link href="/post-artwork" className="bg-[#C87941] hover:bg-[#a86536] text-white px-6 py-2.5 rounded-full font-bold shadow-sm transition-all flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Artwork
            </Link>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* Left Sidebar: Quick Stats */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Total Artworks</h3>
              <p className="text-4xl font-black text-[#1C4A5C]">{myArtworks?.length || 0}</p>
            </div>
            {/* You can add more stat cards here later for Total Sales, Pending Orders, etc. */}
          </div>

          {/* Right Area: Artworks Management */}
          <div className="md:col-span-3">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-xl font-bold text-gray-900">Manage Artworks</h2>
              </div>
              
              <div className="p-6">
                {myArtworks && myArtworks.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {myArtworks.map((art) => (
                      <div key={art.artwork_id} className="border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
                        <div className="h-40 bg-gray-100 relative overflow-hidden">
                           <img 
                              src={art.file_url || '/background.png'} 
                              alt={art.title}
                              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                           />
                           <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md text-xs font-bold shadow-sm uppercase tracking-wider">
                             {art.status}
                           </div>
                        </div>
                        <div className="p-4 flex-1 flex flex-col">
                          <h3 className="font-bold text-gray-900 truncate">{art.title}</h3>
                          <p className="text-[#C87941] font-extrabold mt-1">₱{art.price}</p>
                          <div className="mt-auto pt-4 flex gap-2">
                            <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-bold transition-colors">Edit</button>
                            <button className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-lg text-sm font-bold transition-colors">Delete</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="text-4xl mb-4">🖼️</div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">No artworks posted yet</h3>
                    <p className="text-gray-500 text-sm mb-6">Upload your first piece to start selling on GamâLokal.</p>
                    <Link href="/post-artwork" className="bg-[#1C4A5C] text-white px-6 py-2.5 rounded-full font-bold shadow-sm">
                      Post an Artwork
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}