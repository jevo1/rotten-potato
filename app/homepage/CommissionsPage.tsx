'use client'

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { submitCommissionOffer } from '../actions'; // Ensure correct path

export default function CommissionsPage() {
  const [activeSubTab, setActiveSubTab] = useState('Browse Requests');
  const [openRequests, setOpenRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for the Offer Form
  const [activeOfferForm, setActiveOfferForm] = useState<number | null>(null);
  const [offerAmount, setOfferAmount] = useState<string>('');
  const [offerMessage, setOfferMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createClient();

  // 1. Fetch Open Requests from the Job Board
  useEffect(() => {
    const fetchOpenJobs = async () => {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('commission_requests')
        .select(`
          *,
          client:users!commission_requests_client_id_fkey(name, avatar_url)
        `)
        .eq('status', 'open')
        .order('deadline', { ascending: true });

      if (!error && data) {
        setOpenRequests(data);
      } else {
        console.error("Error fetching open requests:", error);
      }
      setIsLoading(false);
    };

    fetchOpenJobs();
  }, []);

  // 2. Handle the Offer Submission
  const handleSendOffer = async (requestId: number) => {
    if (!offerAmount || !offerMessage) {
      alert("Please enter both a price and a message.");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitCommissionOffer(requestId, parseFloat(offerAmount), offerMessage);
      alert("Offer submitted successfully!");
      setActiveOfferForm(null); // Close the form
      setOfferAmount('');
      setOfferMessage('');
    } catch (error) {
      alert("Failed to submit offer. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#FCFAF8] min-h-screen w-full text-slate-800 font-sans pb-20">
      <div className="max-w-5xl mx-auto px-6 pt-10">
        
        {/* --- Header Section --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-[#1C4A5C] mb-2">Commission Board</h1>
            <p className="text-gray-500 font-medium">Find clients looking for your specific art style</p>
          </div>
          <button className="bg-[#C87941] hover:bg-[#b06a39] text-white px-6 py-2.5 rounded-full font-bold shadow-sm hover:shadow-md transition-all">
            Post Commission Request
          </button>
        </div>

        {/* --- Sub-Tabs --- */}
        <div className="flex gap-2 mb-8 bg-gray-100/50 p-1 rounded-xl w-fit border border-gray-200">
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
        </div>

        {/* --- Public Job Board View --- */}
        {activeSubTab === 'Browse Requests' && (
          <div className="flex flex-col gap-5">
            {isLoading ? (
              <p className="text-center py-10 text-gray-500">Loading open commissions...</p>
            ) : openRequests.length === 0 ? (
              <p className="text-center py-10 text-gray-500">No open commission requests right now.</p>
            ) : (
              openRequests.map((job) => (
                <div key={job.request_id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 transition-shadow">
                  
                  {/* Job Header */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex gap-4">
                      {job.client?.avatar_url ? (
                        <img src={job.client.avatar_url} alt="avatar" className="w-12 h-12 rounded-full border border-gray-100" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0 border border-gray-100 flex items-center justify-center text-gray-400 font-bold">
                          {job.client?.name?.charAt(0) || '?'}
                        </div>
                      )}
                      
                      <div>
                        <h3 className="text-lg font-bold text-[#1C4A5C]">Request #{job.request_id}</h3>
                        <p className="text-sm text-gray-500 font-medium">by {job.client?.name || 'Unknown Client'}</p>
                      </div>
                    </div>
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase">
                      {job.status}
                    </span>
                  </div>

                  {/* Job Details */}
                  <div className="pl-16">
                    <p className="text-sm text-gray-700 mb-5 whitespace-pre-wrap">
                      {job.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-6 text-xs font-medium text-gray-500 mb-6">
                      <span className="text-[#C87941] font-bold">
                        Client Budget: ₱{job.budget}
                      </span>
                      <span>
                        Deadline: {job.deadline ? new Date(job.deadline).toLocaleDateString() : 'Flexible'}
                      </span>
                    </div>

                    {/* Offer Form Toggle */}
                    {activeOfferForm === job.request_id ? (
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mt-4">
                        <h4 className="font-bold text-[#1C4A5C] mb-3">Submit Your Offer</h4>
                        <div className="flex flex-col gap-3">
                          <input 
                            type="number" 
                            placeholder="Your Price (₱)" 
                            className="p-2 border rounded-md"
                            value={offerAmount}
                            onChange={(e) => setOfferAmount(e.target.value)}
                            disabled={isSubmitting}
                          />
                          <textarea 
                            placeholder="Pitch your ideas to the client..." 
                            className="p-2 border rounded-md min-h-[80px]"
                            value={offerMessage}
                            onChange={(e) => setOfferMessage(e.target.value)}
                            disabled={isSubmitting}
                          />
                          <div className="flex gap-2 mt-2">
                            <button 
                              onClick={() => handleSendOffer(job.request_id)}
                              disabled={isSubmitting}
                              className="bg-[#C87941] text-white px-4 py-2 rounded-md font-bold text-sm hover:bg-[#b06a39]"
                            >
                              {isSubmitting ? 'Sending...' : 'Confirm Offer'}
                            </button>
                            <button 
                              onClick={() => setActiveOfferForm(null)}
                              disabled={isSubmitting}
                              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md font-bold text-sm hover:bg-gray-300"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setActiveOfferForm(job.request_id)}
                        className="bg-[#C87941] hover:bg-[#b06a39] text-white px-5 py-2 rounded-full text-sm font-bold transition-colors shadow-sm"
                      >
                        Send Offer
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Placeholder for 'My Requests' Tab */}
        {activeSubTab === 'My Requests' && (
          <div className="text-center py-10 text-gray-500">
            We will wire up the client's offer review dashboard here next!
          </div>
        )}

      </div>
    </div>
  );
}