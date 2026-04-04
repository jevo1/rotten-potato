import React, { useState } from 'react';

export default function CommissionsPage() {
  const [activeSubTab, setActiveSubTab] = useState('Browse Requests');

  // Mock data
  const commissions = [
    {
      id: 1,
      title: 'Custom Family Portrait',
      client: 'Pedro Alcazar',
      status: 'Open',
      category: 'Painting',
      description: 'Looking for an oil or watercolor portrait of my family (4 members). Traditional Filipino attire preferred. Size: 18x24 inches.',
      budget: '₱3,000 - ₱5,000',
      dueDate: 'March 15, 2026',
      posted: '2 hours ago',
      offers: 3,
    },
    {
      id: 2,
      title: 'Hand-woven Table Runner',
      client: 'Elena Vidal',
      status: 'Open',
      category: 'Weaving',
      description: 'Need a traditional abaca table runner, 12x72 inches, in earth tones. Must be using traditional Leyte weaving patterns.',
      budget: '₱800 - ₱1,200',
      dueDate: 'February 28, 2026',
      posted: '5 hours ago',
      offers: 7,
    },
    {
      id: 3,
      title: 'Handmade Ceramic Coffee Mugs (Set of 6)',
      client: 'Roberto Santos',
      status: 'Open',
      category: 'Pottery',
      description: 'Custom ceramic mugs with a nautical theme. Each mug should be unique. Dishwasher-safe glaze required.',
      budget: '₱2,500 - ₱4,000',
      dueDate: 'March 30, 2026',
      posted: '1 day ago',
      offers: 2,
    },
  ];

  return (
    <div className="bg-[#FCFAF8] min-h-screen w-full text-slate-800 font-sans pb-20">
      <div className="max-w-5xl mx-auto px-6 pt-10">
        
        {/* --- Header Section --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-[#1C4A5C] mb-2">Commission Board</h1>
            <p className="text-gray-500 font-medium">Clients post what they need — artists send their offers</p>
          </div>
          <button className="bg-[#C87941] hover:bg-[#b06a39] text-white px-6 py-2.5 rounded-full font-bold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Post Commission Request
          </button>
        </div>

        {/* --- Sub-Tabs --- */}
        <div className="flex gap-2 mb-8 bg-gray-100/50 p-1 rounded-xl w-fit border border-gray-200">
          <button 
            onClick={() => setActiveSubTab('Browse Requests')}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeSubTab === 'Browse Requests' 
                ? 'bg-white text-[#1C4A5C] shadow-sm border border-gray-200' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Browse Requests
          </button>
          <button 
            onClick={() => setActiveSubTab('My Requests')}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeSubTab === 'My Requests' 
                ? 'bg-white text-[#1C4A5C] shadow-sm border border-gray-200' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            My Requests
          </button>
        </div>

        {/* --- Commission Requests List --- */}
        <div className="flex flex-col gap-5">
          {commissions.map((job) => (
            <div key={job.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex gap-4">
                  {/* Avatar Placeholder */}
                  <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0 border border-gray-100"></div>
                  
                  <div>
                    <h3 className="text-lg font-bold text-[#1C4A5C]">{job.title}</h3>
                    <p className="text-sm text-gray-500 font-medium">by {job.client}</p>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    {job.status}
                  </span>
                  <span className="bg-sky-50 text-sky-700 border border-sky-100 px-3 py-1 rounded-full text-xs font-semibold">
                    {job.category}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-700 mb-5 leading-relaxed pl-16">
                {job.description}
              </p>

              {/* Metadata row */}
              <div className="flex flex-wrap items-center gap-6 text-xs font-medium text-gray-500 mb-6 pl-16">
                <span className="flex items-center gap-1.5 text-[#C87941] font-bold">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  {job.budget}
                </span>
                <span className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  Due: {job.dueDate}
                </span>
                <span className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {job.posted}
                </span>
                <span className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  {job.offers} offers
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pl-16">
                <button className="bg-[#C87941] hover:bg-[#b06a39] text-white px-5 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  Send Offer
                </button>
                <button className="bg-white border-2 border-[#1C4A5C]/20 text-[#1C4A5C] hover:border-[#1C4A5C] hover:bg-slate-50 px-5 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  Message Client
                </button>
              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
}