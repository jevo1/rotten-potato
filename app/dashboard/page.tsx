"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import PostArtworkModal from '../src/components/PostArtworkModal';
import PayoutModal from '../src/components/PayoutModal';
import DashboardNavBar from './DashboardNavBar';
import { ShoppingBag, ArrowUpRight, CheckCircle, Clock } from 'lucide-react';

interface Artwork {
  artwork_id: number;
  title: string;
  price: number;
  file_url: string;
  status: string;
}

interface UserProfile {
  role: string;
  name: string;
  avatar_url?: string | null;
}

interface SalesRecord {
  payment_id: number;
  amount: number;
  transaction_date: string;
  artworks?: { title: string } | null;
}

export default function DashboardPage() {
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [myArtworks, setMyArtworks] = useState<Artwork[]>([]);
  const [salesHistory, setSalesHistory] = useState<SalesRecord[]>([]);
  const [totalEarnings, setTotalEarnings] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      console.log("--- GAMALOKAL DEBUG LOGS ---");
      console.log("1. Currently Logged In User UUID:", user.id);

      // 1. Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role, name, avatar_url')
        .eq('user_id', user.id)
        .single();

      if (profileError) console.error("Profile Fetch Error:", profileError.message);

      if (profile?.role !== 'artist') {
        console.warn("User role is not 'artist'. Current role:", profile?.role);
        setUserData(profile);
        setLoading(false);
        return;
      }

      // 2. Fetch artist's listings
      const { data: artworks, error: artworksError } = await supabase
        .from('artworks')
        .select('*')
        .eq('user_id', user.id)
        .order('artwork_id', { ascending: false });

      if (artworksError) console.error("Artworks Fetch Error:", artworksError.message);

      // 3. Fetch successful payments matching this artist's ID
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          payment_id, 
          amount, 
          transaction_date,
          milestone_type,
          commission_requests ( title ),
          artworks ( title )
        `)
        .eq('artist_id', user.id)
        .eq('status', 'paid')
        .order('transaction_date', { ascending: false });

      if (paymentsError) {
        console.error("CRITICAL Payments Query Error (Check RLS):", paymentsError.message);
      } else {
        console.log("2. Raw Payments Found for this Artist:", payments);
      }

      // 4. Fetch payout requests matching this artist's ID
      const { data: payouts, error: payoutsError } = await supabase
        .from('payout_requests')
        .select('amount')
        .eq('artist_id', user.id)
        .or('status.eq.pending,status.eq.approved');

      if (payoutsError) console.error("Payouts Fetch Error:", payoutsError.message);

      // 5. Ledger Calculations
      const grossSales = payments?.reduce((sum, record) => sum + Number(record.amount), 0) || 0;
      const totalWithdrawn = payouts?.reduce((sum, record) => sum + Number(record.amount), 0) || 0;

      // 10% platform fee commission rule
      const platformFeePercent = 0.10;
      const netIntake = grossSales * (1 - platformFeePercent);
      const netAvailableBalance = Math.max(0, netIntake - totalWithdrawn);

      console.log("3. Gross Sales Total:", grossSales);
      console.log("4. Net Available Balance calculated:", netAvailableBalance);

      setUserData(profile);
      setMyArtworks(artworks || []);
      
      const formattedSales = (payments || []).map(p => ({
        payment_id: p.payment_id,
        amount: p.amount,
        transaction_date: p.transaction_date,
        artworks: { 
          title: (p as any).commission_requests?.title 
            ? `${(p as any).milestone_type === 'deposit' ? 'Deposit' : 'Final'}: ${(p as any).commission_requests.title}`
            : (p as any).artworks?.title || 'Marketplace Piece'
        }
      }));

      setSalesHistory(formattedSales);
      setTotalEarnings(netAvailableBalance);
    } catch (err) {
      console.error("Dashboard calculation lifecycle crashed:", err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchDashboardData();
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
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
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
      <DashboardNavBar
        displayName={userData?.name || 'User'}
        avatarUrl={userData?.avatar_url || null}
      />

      <main className="flex-1 font-sans text-slate-800 p-6 md:p-10">
        <div className="max-w-6xl mx-auto">

          {/* Header Dashboard Banner Layout */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
            <div>
              <h1 className="text-4xl font-black text-[#1C4A5C] tracking-tight">Creator Studio</h1>
              <p className="text-gray-500 font-medium mt-1">Manage your professional art portfolio and marketplace ledger.</p>
            </div>
            <div className="flex gap-3">
              <Link href="/profile" className="bg-white border-2 border-gray-100 text-gray-700 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm hover:border-[#1C4A5C] hover:text-[#1C4A5C] transition-all">
                View Profile
              </Link>
              <button
                onClick={() => setIsPostModalOpen(true)}
                className="bg-[#f2a83b] hover:bg-[#e09b36] text-slate-900 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm hover:shadow-md transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-95"
              >
                <ShoppingBag size={18} />
                New Artwork
              </button>
            </div>
          </div>

          {/* Core Analytics Metrics Grid Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

            {/* Sidebar Metrics Widget Panel */}
            <div className="md:col-span-1 space-y-6">
              {/* Box 1: Total Pieces */}
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Total Artworks</h3>
                <p className="text-5xl font-black text-[#1C4A5C]">{myArtworks?.length || 0}</p>
                <div className="mt-6 pt-6 border-t border-gray-50">
                  <p className="text-xs font-bold text-green-500 flex items-center gap-1">
                    <CheckCircle size={14} />
                    Active Portfolio
                  </p>
                </div>
              </div>

              {/* Box 2: Secure Real-time Available Cash Ledger balance tracking card */}
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#f2a83b]/10 rounded-full blur-2xl pointer-events-none"></div>
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Available Balance</h3>
                <p className="text-4xl font-black text-[#C87941]">₱{totalEarnings.toLocaleString()}</p>
                <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <Clock size={12} />
                    Net Artist Cut
                  </span>
                  <button
                    onClick={() => setIsPayoutModalOpen(true)}
                    disabled={totalEarnings <= 0}
                    className="bg-[#1C4A5C] hover:bg-[#12303c] disabled:bg-gray-100 disabled:text-gray-400 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-95 disabled:pointer-events-none"
                  >
                    Withdraw
                  </button>
                </div>
              </div>
            </div>

            {/* Main Section Content Pane Layout */}
            <div className="md:col-span-3 space-y-8">

              {/* Section A: Active Listings Render Block */}
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
                        <ShoppingBag className="text-[#1C4A5C]" size={32} />
                      </div>
                      <h3 className="text-xl font-black text-gray-900 mb-2 tracking-tight uppercase">Empty Gallery</h3>
                      <p className="text-gray-400 text-sm mb-10 font-medium">Your masterpieces are waiting to be listed on the market.</p>
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

              {/* Section B: Dynamic Marketplace Transaction Sales Logs Display Box */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
                <div className="p-8 border-b border-gray-50 bg-[#FCFAF8]/50">
                  <h2 className="text-xl font-black text-gray-900 tracking-tight">Sales & Earnings Log</h2>
                  <p className="text-xs text-gray-400 font-medium mt-1">Comprehensive settlement statements recorded from the payment gateway webhook.</p>
                </div>
                <div className="p-8">
                  {salesHistory.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-gray-100 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                            <th className="pb-4">Transaction ID</th>
                            <th className="pb-4">Masterpiece Title</th>
                            <th className="pb-4">Settlement Date</th>
                            <th className="pb-4 text-right">Net Credited Amount (90%)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm font-medium text-gray-700">
                          {salesHistory.map((sale) => (
                            <tr key={sale.payment_id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="py-4 font-mono text-xs text-gray-400 flex items-center gap-1">
                                <ArrowUpRight size={12} className="text-green-500" />
                                #PAY-{sale.payment_id}
                              </td>
                              <td className="py-4 font-bold text-[#1C4A5C]">{sale.artworks?.title || 'Custom Commission Workspace'}</td>
                              <td className="py-4 text-gray-500">{new Date(sale.transaction_date).toLocaleDateString('en-PH', { dateStyle: 'long' })}</td>
                              <td className="py-4 text-right font-black text-green-600">
                                +₱{(parseFloat(sale.amount.toString()) * 0.90).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-400 font-medium text-sm">
                      No customer transactions have logged into your workspace balance metrics statement index yet.
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>
      </main>

      {/* Dynamic Render Modals Controls Layer */}
      <PostArtworkModal isOpen={isPostModalOpen} onClose={() => setIsPostModalOpen(false)} />
      <PayoutModal isOpen={isPayoutModalOpen} onClose={() => setIsPayoutModalOpen(false)} maxBalance={totalEarnings} onSuccess={fetchDashboardData} />
    </div>
  );
}