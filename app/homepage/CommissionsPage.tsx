"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { submitCommissionOffer, createCommissionRequest, completeCommissionAndReview, acceptCommissionOffer } from '@/app/actions/index'; 
import { processCommissionPayment } from '../actions/payments';

interface CommissionOffer {
  offer_id: number;
  message: string;
  offer_amount: number;
  status: string;
  artist_id: string;
  deposit_percentage: number;
  artist: {
    name: string;
    avatar_url: string;
  };
}

interface CommissionRequest {
  request_id: number;
  title: string;
  description: string;
  budget: number;
  deadline: string;
  status: string;
  client_id: string;
  artist_id?: string;
  client: {
    name: string;
    avatar_url: string;
  };
  artist?: {
    name: string;
  };
  offers?: CommissionOffer[];
}

export default function CommissionsPage() {
  const router = useRouter();
  const [activeSubTab, setActiveSubTab] = useState('Browse Requests');
  const [openRequests, setOpenRequests] = useState<CommissionRequest[]>([]);
  const [myRequests, setMyRequests] = useState<CommissionRequest[]>([]);
  const [myJobs, setMyJobs] = useState<CommissionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  
  // State for Artist Offer Form
  const [activeOfferForm, setActiveOfferForm] = useState<number | null>(null);
  const [offerAmount, setOfferAmount] = useState<string>('');
  const [offerMessage, setOfferMessage] = useState<string>('');
  const [depositPercentage, setDepositPercentage] = useState<number>(50);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isPostingModalOpen, setIsPostingModalOpen] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  const [reviewJob, setReviewJob] = useState<CommissionRequest | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  const [isPaying, setIsPaying] = useState(false);
  const [successModal, setSuccessModal] = useState<{ isOpen: boolean; title: string; message: string }>({
    isOpen: false,
    title: "",
    message: "",
  });

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('user_id', user.id)
        .single();
        
      if (userData) setCurrentUserRole(userData.role);

      const { data: myReqData } = await supabase
        .from('commission_requests')
        .select(`
          *,
          artist:users!artist_id ( name ),
          offers:commission_offers (
            offer_id, message, offer_amount, status, artist_id, deposit_percentage,
            artist:users!artist_id ( name, avatar_url )
          )
        `)
        .eq('client_id', user.id)
        .order('request_id', { ascending: false });
        
      if (myReqData) setMyRequests(myReqData as unknown as CommissionRequest[]);

      // Fetch artist's active jobs (including direct requests in 'open' status)
      const { data: myJobData } = await supabase
        .from('commission_requests')
        .select(`
          *,
          client:users!client_id ( name, avatar_url )
        `)
        .eq('artist_id', user.id)
        .order('request_id', { ascending: false });

      if (myJobData) setMyJobs(myJobData as unknown as CommissionRequest[]);
    }

    const { data, error } = await supabase
      .from('commission_requests')
      .select(`
        request_id, title, description, budget, deadline, status, client_id,
        client:users!client_id ( name, avatar_url )
      `)
      .eq('status', 'open')
      .is('artist_id', null)
      .order('request_id', { ascending: false });

    if (!error && data) setOpenRequests(data as unknown as CommissionRequest[]);
    
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [isPostingModalOpen, isReviewing, fetchData]);

  const handleSendOffer = async (requestId: number) => {
    if (!offerAmount || !offerMessage) return alert("Please enter a price and message.");
    setIsSubmitting(true);
    try {
      await submitCommissionOffer(requestId, parseFloat(offerAmount), offerMessage, depositPercentage);
      setSuccessModal({
        isOpen: true,
        title: "Offer Submitted!",
        message: "Your offer has been sent to the client. You will be notified if they accept.",
      });
      setActiveOfferForm(null); 
      setOfferAmount('');
      setOfferMessage('');
      setDepositPercentage(50);
      fetchData(); 
    } catch {
      alert("Failed to submit offer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPosting(true);
    try {
      const formData = new FormData(e.currentTarget);
      await createCommissionRequest(formData);
      setSuccessModal({
        isOpen: true,
        title: "Request Posted!",
        message: "Your commission request is now live on the board. Artists can now submit offers.",
      });
      setIsPostingModalOpen(false);
    } catch (error) {
      alert("Failed to post request.");
      console.error(error);
    } finally {
      setIsPosting(false);
    }
  };

  const handleAcceptOffer = async (requestId: number, offerId: number, artistId: string) => {
    if (!confirm("Are you sure you want to hire this artist? A deposit payment session will be created.")) return;
    setIsAccepting(true);
    try {
      await acceptCommissionOffer(requestId, offerId, artistId);
      setSuccessModal({
        isOpen: true,
        title: "Artist Hired!",
        message: "The status has been updated to 'Awaiting Deposit'. You can now proceed with the initial payment.",
      });
      fetchData(); 
    } catch (error) {
      console.error(error);
      alert("Failed to accept offer.");
    } finally {
      setIsAccepting(false);
    }
  };

  const handleCommissionPayment = async (job: CommissionRequest, type: 'deposit' | 'final') => {
    if (!job.offers || !job.artist_id) return;
    const acceptedOffer = job.offers.find(o => o.status === 'accepted');
    if (!acceptedOffer) return;

    setIsPaying(true);
    try {
      const amount = type === 'deposit' 
        ? (acceptedOffer.offer_amount * acceptedOffer.deposit_percentage) / 100
        : acceptedOffer.offer_amount * (1 - acceptedOffer.deposit_percentage / 100);

      await processCommissionPayment({
        requestId: job.request_id,
        artistId: job.artist_id,
        amount,
        title: job.title || `Commission #${job.request_id}`,
        milestoneType: type
      });
    } catch (error) {
      console.error(error);
      alert("Payment redirection failed.");
    } finally {
      setIsPaying(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewJob || !reviewJob.artist_id) return;
    setIsReviewing(true);
    
    try {
      await completeCommissionAndReview(reviewJob.request_id, reviewJob.artist_id, rating, comment);
      setSuccessModal({
        isOpen: true,
        title: "Review Submitted!",
        message: "Thank you for your feedback! The commission is now officially closed.",
      });
      setReviewJob(null);
      setRating(5);
      setComment('');
      fetchData();
    } catch (error) {
      console.error(error);
      alert("Failed to submit review.");
    } finally {
      setIsReviewing(false);
    }
  };

  return (
    <div className="bg-[#FCFAF8] min-h-screen w-full text-slate-800 font-sans pb-32 md:pb-20 relative">
      
      {/* Success Modal */}
      {successModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-0 md:p-4 backdrop-blur-sm">
          <div className="bg-white w-full h-full md:h-auto md:max-w-sm md:rounded-[2rem] p-8 shadow-2xl text-center flex flex-col items-center justify-center md:justify-start gap-6 animate-in fade-in zoom-in duration-200">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-green-600 animate-pulse">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#1C4A5C] mb-2">{successModal.title}</h2>
              <p className="text-gray-500 text-sm font-medium leading-relaxed">{successModal.message}</p>
            </div>
            <button 
              onClick={() => setSuccessModal({ ...successModal, isOpen: false })}
              className="w-full max-w-[240px] bg-[#1C4A5C] text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-[#1C4A5C]/20 transition-transform active:scale-95"
            >
              Great, thanks!
            </button>
          </div>
        </div>
      )}

      {/* Post Commission Modal */}
      {isPostingModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-0 md:p-4">
          <div className="bg-white w-full h-full md:h-auto md:max-w-lg md:rounded-2xl p-6 md:p-8 shadow-xl flex flex-col animate-in fade-in zoom-in duration-200 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#1C4A5C]">Post a Request</h2>
              <button onClick={() => setIsPostingModalOpen(false)} className="text-gray-400 hover:text-gray-800 transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            
            <form onSubmit={handlePostRequest} className="flex flex-col gap-6">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Project Title</label>
                <input type="text" name="title" required placeholder="e.g. Custom Watercolor Portrait" className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-[#1C4A5C]/10 transition-all font-medium" />
              </div>
              
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Detailed Description</label>
                <textarea name="description" required rows={4} placeholder="Describe the style, size, references, etc." className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-[#1C4A5C]/10 transition-all font-medium resize-none"></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Budget (₱)</label>
                  <input type="number" name="budget" required placeholder="e.g. 1500" className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-[#1C4A5C]/10 transition-all font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Deadline</label>
                  <input type="date" name="deadline" required className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-[#1C4A5C]/10 transition-all font-medium" />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isPosting}
                className="w-full bg-[#C87941] hover:bg-[#b06a39] text-white py-4 rounded-xl font-black uppercase tracking-widest mt-4 transition-all shadow-lg shadow-[#C87941]/20 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
              >
                {isPosting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Posting...</span>
                  </>
                ) : 'Post Commission'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewJob && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-0 md:p-4 backdrop-blur-sm">
          <div className="bg-white w-full h-full md:h-auto md:max-w-md md:rounded-[2rem] p-8 shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200 overflow-y-auto">
            <h2 className="text-2xl font-extrabold text-[#1C4A5C] mb-1">Complete Commission</h2>
            <p className="text-gray-500 text-sm mb-8">Leave a review for <strong className="text-gray-700">{reviewJob.artist?.name || 'the artist'}</strong>.</p>
            
            <form onSubmit={handleSubmitReview} className="flex flex-col gap-6">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Your Rating</label>
                <div className="flex gap-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`text-4xl transition-all hover:scale-110 active:scale-90 ${star <= rating ? 'text-[#C87941] drop-shadow-sm' : 'text-gray-200'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Your Review</label>
                <textarea 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required 
                  rows={4} 
                  placeholder="How was it working with this artist?" 
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-[#1C4A5C]/10 transition-all resize-none font-medium text-sm"
                ></textarea>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-4 pb-10 md:pb-0">
                <button 
                  type="button" 
                  onClick={() => setReviewJob(null)}
                  className="flex-1 px-6 py-4 rounded-xl text-sm font-black text-gray-400 hover:bg-gray-50 transition-all uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isReviewing}
                  className="flex-[2] bg-[#1C4A5C] hover:bg-[#143745] text-white py-4 rounded-xl font-black uppercase tracking-widest transition-all shadow-lg shadow-[#1C4A5C]/20 disabled:opacity-50 active:scale-95"
                >
                  {isReviewing ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 md:px-6 pt-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#1C4A5C] mb-2">Commission Board</h1>
            <p className="text-sm md:text-gray-500 font-medium">Find clients looking for your specific art style</p>
          </div>
          <button 
            onClick={() => setIsPostingModalOpen(true)}
            className="w-full md:w-auto bg-[#C87941] hover:bg-[#b06a39] text-white px-6 py-3 md:py-2.5 rounded-full font-bold shadow-sm hover:shadow-md transition-all text-sm"
          >
            Post Commission Request
          </button>
        </div>

        {/* Sub-Tabs */}
        <div className="flex overflow-x-auto pb-2 mb-8 scrollbar-hide md:pb-0">
          <div className="flex gap-2 bg-gray-100/50 p-1 rounded-xl w-fit border border-gray-200 whitespace-nowrap">
            <button 
              onClick={() => setActiveSubTab('Browse Requests')}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeSubTab === 'Browse Requests' ? 'bg-white text-[#1C4A5C] shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Browse Requests
            </button>
            <button 
              onClick={() => setActiveSubTab('My Requests')}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeSubTab === 'My Requests' ? 'bg-white text-[#1C4A5C] shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              My Requests
            </button>
            {currentUserRole === 'artist' && (
              <button 
                onClick={() => setActiveSubTab('My Jobs')}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeSubTab === 'My Jobs' ? 'bg-white text-[#1C4A5C] shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                My Jobs
              </button>
            )}
          </div>
        </div>

        {/* Browse Requests Tab */}
        {activeSubTab === 'Browse Requests' && (
          <div className="flex flex-col gap-5">
            {isLoading ? (
              <p className="text-center py-10 text-gray-500 font-medium">Loading open commissions...</p>
            ) : openRequests.length === 0 ? (
              <p className="text-center py-10 text-gray-500 font-medium">No open commission requests right now.</p>
            ) : (
              openRequests.map((job) => (
                <div key={job.request_id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 transition-shadow">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4">
                    <div className="flex gap-4">
                      {job.client?.avatar_url ? (
                        <img src={job.client.avatar_url} alt="avatar" className="w-12 h-12 rounded-full border border-gray-100 object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-[#1C4A5C]/10 shrink-0 border border-gray-100 flex items-center justify-center text-[#1C4A5C] font-bold text-xl">
                          {job.client?.name?.charAt(0) || '?'}
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{job.title ? job.title : `Request #${job.request_id}`}</h3>
                        <p className="text-sm text-gray-500 font-medium">by {job.client?.name || 'Unknown Client'}</p>
                      </div>
                    </div>
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                      {job.status}
                    </span>
                  </div>

                  <div className="pl-0 md:pl-16">
                    <p className="text-sm text-gray-700 mb-5 whitespace-pre-wrap">{job.description}</p>
                    <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 text-xs font-medium text-gray-500 mb-6">
                      <span className="text-[#C87941] font-bold text-sm">Client Budget: ₱{job.budget}</span>
                      <span>Deadline: {job.deadline ? new Date(job.deadline).toLocaleDateString() : 'Flexible'}</span>
                    </div>

                    {job.client_id === currentUserId ? (
                      <button disabled className="w-full md:w-auto bg-gray-100 text-gray-500 border border-gray-200 px-5 py-2.5 rounded-full text-sm font-bold cursor-not-allowed">Your Request</button>
                    ) : currentUserRole !== 'artist' ? (
                      <button disabled className="w-full md:w-auto bg-gray-100 text-gray-500 border border-gray-200 px-5 py-2.5 rounded-full text-sm font-bold cursor-not-allowed">Artists Only</button>
                    ) : activeOfferForm === job.request_id ? (
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mt-4">
                        <h4 className="font-bold text-[#1C4A5C] mb-3">Submit Your Offer</h4>
                        <div className="flex flex-col gap-3">
                          <input type="number" placeholder="Your Price (₱)" className="p-2 border border-gray-200 rounded-md outline-none" value={offerAmount} onChange={(e) => setOfferAmount(e.target.value)} disabled={isSubmitting} />
                          
                          <div className="bg-white p-3 rounded-lg border border-gray-100">
                            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-tight">Required Deposit: {depositPercentage}% (₱{(parseFloat(offerAmount) || 0) * (depositPercentage / 100)})</label>
                            <input 
                              type="range" 
                              min="10" 
                              max="100" 
                              step="5"
                              value={depositPercentage} 
                              onChange={(e) => setDepositPercentage(parseInt(e.target.value))}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#C87941]"
                            />
                            <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-bold">
                              <span>10%</span>
                              <span>50%</span>
                              <span>100%</span>
                            </div>
                          </div>

                          <textarea placeholder="Pitch your ideas to the client..." className="p-2 border border-gray-200 rounded-md min-h-[80px] outline-none" value={offerMessage} onChange={(e) => setOfferMessage(e.target.value)} disabled={isSubmitting} />
                          <div className="flex flex-col sm:flex-row gap-2 mt-2">
                            <button onClick={() => handleSendOffer(job.request_id)} disabled={isSubmitting} className="flex-1 bg-[#C87941] text-white px-4 py-2.5 rounded-md font-bold text-sm hover:bg-[#b06a39]">{isSubmitting ? 'Sending...' : 'Confirm Offer'}</button>
                            <button onClick={() => setActiveOfferForm(null)} disabled={isSubmitting} className="flex-1 bg-gray-200 text-gray-700 px-4 py-2.5 rounded-md font-bold text-sm hover:bg-gray-300">Cancel</button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setActiveOfferForm(job.request_id)} className="w-full md:w-auto bg-[#C87941] hover:bg-[#b06a39] text-white px-6 py-2.5 rounded-full text-sm font-bold transition-colors shadow-sm">Send Offer</button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* My Requests Tab */}
        {activeSubTab === 'My Requests' && (
          <div className="flex flex-col gap-5">
            {isLoading ? (
              <p className="text-center py-10 text-gray-500 font-medium">Loading your requests...</p>
            ) : myRequests.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 border-dashed">
                <div className="text-4xl mb-3">📝</div>
                <h3 className="text-lg font-bold text-gray-900">You haven&apos;t posted any requests</h3>
                <p className="text-gray-500 text-sm mt-1 mb-4">Need custom art? Post a request for artists to bid on.</p>
                <button onClick={() => setIsPostingModalOpen(true)} className="text-[#C87941] font-bold hover:underline">Post your first request</button>
              </div>
            ) : (
              myRequests.map((job) => (
                <div key={job.request_id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-4">
                    <div className="w-full">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-1">
                        <h3 className="text-xl font-bold text-[#1C4A5C]">{job.title || `Request #${job.request_id}`}</h3>
                        <span className={`w-fit px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          job.status === 'open' ? 'bg-blue-50 text-blue-600' :
                          job.status === 'awaiting_deposit' ? 'bg-yellow-50 text-yellow-600' :
                          job.status === 'in_progress' ? 'bg-orange-50 text-orange-600' :
                          job.status === 'awaiting_final_payment' ? 'bg-purple-50 text-purple-600' :
                          'bg-green-50 text-green-600'
                        }`}>
                          {job.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-gray-500 text-sm mb-3">Budget: ₱{job.budget} • Deadline: {new Date(job.deadline).toLocaleDateString()}</p>
                      
                      {job.artist_id && (
                        <p className="text-sm font-medium text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 inline-block">
                          🎨 Working with: <span className="font-bold text-[#1C4A5C]">{job.artist?.name || 'Unknown Artist'}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                      {job.status === 'awaiting_deposit' && (
                        <button 
                          disabled={isPaying}
                          className="w-full sm:w-auto bg-[#C87941] hover:bg-[#b06a39] text-white px-6 py-2.5 rounded-full font-bold shadow-sm transition-all whitespace-nowrap disabled:opacity-50"
                          onClick={() => handleCommissionPayment(job, 'deposit')}
                        >
                          {isPaying ? 'Redirecting...' : 'Pay Deposit'}
                        </button>
                      )}

                      {job.status === 'in_progress' && (
                        <>
                          <button 
                            className="w-full sm:w-auto bg-[#1C4A5C] hover:bg-[#143745] text-white px-6 py-2.5 rounded-full font-bold shadow-sm transition-all whitespace-nowrap"
                            onClick={() => router.push(`/commissions/${job.request_id}`)}
                          >
                            Workspace
                          </button>
                          <button 
                            onClick={() => setReviewJob(job)}
                            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-full font-bold shadow-sm transition-all whitespace-nowrap"
                          >
                            Complete & Review
                          </button>
                        </>
                      )}

                      {job.status === 'awaiting_final_payment' && (
                        <button 
                          disabled={isPaying}
                          className="w-full sm:w-auto bg-[#C87941] hover:bg-[#b06a39] text-white px-6 py-2.5 rounded-full font-bold shadow-sm transition-all whitespace-nowrap disabled:opacity-50"
                          onClick={() => handleCommissionPayment(job, 'final')}
                        >
                          {isPaying ? 'Redirecting...' : 'Pay Balance'}
                        </button>
                      )}

                      {job.status === 'completed' && (
                        <button 
                          className="w-full sm:w-auto bg-[#1C4A5C] hover:bg-[#143745] text-white px-6 py-2.5 rounded-full font-bold shadow-sm transition-all whitespace-nowrap"
                          onClick={() => router.push(`/commissions/${job.request_id}`)}
                        >
                          Workspace
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Offers Section for Client */}
                  {job.status === 'open' && job.offers && job.offers.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <h4 className="text-sm font-bold text-gray-900 mb-4">Offers from Artists ({job.offers.length})</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {job.offers.map((offer) => (
                          <div key={offer.offer_id} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <div className="flex items-center gap-3 mb-3">
                              {offer.artist?.avatar_url ? (
                                <img src={offer.artist.avatar_url} alt="avatar" className="w-8 h-8 rounded-full border border-gray-200" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold">
                                  {offer.artist?.name?.charAt(0) || '?'}
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-bold text-gray-900">{offer.artist?.name || 'Unknown Artist'}</p>
                                <p className="text-[10px] text-gray-500">Proposed Price: ₱{offer.offer_amount} • Deposit: {offer.deposit_percentage}%</p>
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 mb-4 line-clamp-3 italic">&quot;{offer.message}&quot;</p>
                            <button 
                              onClick={() => handleAcceptOffer(job.request_id, offer.offer_id, offer.artist_id)}
                              disabled={isAccepting}
                              className="w-full bg-[#1C4A5C] hover:bg-[#143745] text-white py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                            >
                              {isAccepting ? 'Accepting...' : 'Accept Offer'}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
        {/* My Jobs Tab */}
        {activeSubTab === 'My Jobs' && (
          <div className="flex flex-col gap-5">
            {isLoading ? (
              <p className="text-center py-10 text-gray-500 font-medium">Loading your jobs...</p>
            ) : myJobs.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 border-dashed">
                <div className="text-4xl mb-3">🎨</div>
                <h3 className="text-lg font-bold text-gray-900">No active jobs yet</h3>
                <p className="text-gray-500 text-sm mt-1 mb-4">Submit offers to clients on the job board to find work.</p>
                <button onClick={() => setActiveSubTab('Browse Requests')} className="text-[#C87941] font-bold hover:underline">Browse job board</button>
              </div>
            ) : (
              myJobs.map((job) => (
                <div key={job.request_id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl font-bold text-[#1C4A5C]">{job.title || `Job #${job.request_id}`}</h3>
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          job.status === 'awaiting_deposit' ? 'bg-yellow-50 text-yellow-600' :
                          job.status === 'in_progress' ? 'bg-orange-50 text-orange-600' :
                          job.status === 'awaiting_final_payment' ? 'bg-purple-50 text-purple-600' :
                          'bg-green-50 text-green-600'
                        }`}>
                          {job.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-gray-500 text-sm mb-3">Budget: ₱{job.budget} • Deadline: {new Date(job.deadline).toLocaleDateString()}</p>
                      
                      <p className="text-sm font-medium text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 inline-block">
                        👤 Client: <span className="font-bold text-[#1C4A5C]">{job.client?.name || 'Unknown Client'}</span>
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      {job.status === 'open' && (
                        <button 
                          onClick={() => setActiveOfferForm(job.request_id)}
                          className="bg-[#C87941] hover:bg-[#b06a39] text-white px-6 py-2.5 rounded-full font-bold shadow-sm transition-all whitespace-nowrap"
                        >
                          Send Offer
                        </button>
                      )}

                      {job.status === 'awaiting_deposit' && (
                        <span className="text-yellow-600 font-bold text-sm italic">Awaiting client deposit...</span>
                      )}
                      
                      {(job.status === 'in_progress' || job.status === 'awaiting_final_payment' || job.status === 'completed') && (
                        <button 
                          className="bg-[#1C4A5C] hover:bg-[#143745] text-white px-6 py-2.5 rounded-full font-bold shadow-sm transition-all whitespace-nowrap"
                          onClick={() => router.push(`/commissions/${job.request_id}`)}
                        >
                          Workspace
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Direct Request Offer Form */}
                  {activeOfferForm === job.request_id && (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mt-4">
                      <h4 className="font-bold text-[#1C4A5C] mb-3">Submit Your Offer</h4>
                      <div className="flex flex-col gap-3">
                        <input type="number" placeholder="Your Price (₱)" className="p-2 border border-gray-200 rounded-md outline-none" value={offerAmount} onChange={(e) => setOfferAmount(e.target.value)} disabled={isSubmitting} />
                        
                        <div className="bg-white p-3 rounded-lg border border-gray-100">
                          <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-tight">Required Deposit: {depositPercentage}% (₱{(parseFloat(offerAmount) || 0) * (depositPercentage / 100)})</label>
                          <input 
                            type="range" 
                            min="10" 
                            max="100" 
                            step="5"
                            value={depositPercentage} 
                            onChange={(e) => setDepositPercentage(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#C87941]"
                          />
                          <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-bold">
                            <span>10%</span>
                            <span>50%</span>
                            <span>100%</span>
                          </div>
                        </div>

                        <textarea placeholder="Pitch your ideas to the client..." className="p-2 border border-gray-200 rounded-md min-h-[80px] outline-none" value={offerMessage} onChange={(e) => setOfferMessage(e.target.value)} disabled={isSubmitting} />
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => handleSendOffer(job.request_id)} disabled={isSubmitting} className="bg-[#C87941] text-white px-4 py-2 rounded-md font-bold text-sm hover:bg-[#b06a39]">{isSubmitting ? 'Sending...' : 'Confirm Offer'}</button>
                          <button onClick={() => setActiveOfferForm(null)} disabled={isSubmitting} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md font-bold text-sm hover:bg-gray-300">Cancel</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}