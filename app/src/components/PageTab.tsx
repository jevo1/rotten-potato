import React from 'react';

interface PageTabProps {
  activeTab: number;
  setActiveTab: (tab: number) => void;
}

export default function PageTab({ activeTab, setActiveTab }: PageTabProps) {
  
  // We define our tabs here with beautiful, matching SVG icons
  const tabs = [
    {
      id: 0,
      label: 'Home',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      )
    },
    {
      id: 1,
      label: 'Browse',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
      )
    },
    {
      id: 2,
      label: 'Commission', // Updated to match image text
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><line x1="8" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="16" y2="15"/></svg>
      )
    },
    {
      id: 3,
      label: 'Messages',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      )
    }
  ];

  return (
    <div className="bg-[#1C4A5C] w-full border-b shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6">
        
        {/* Left Side: Tabs */}
        <div className="flex">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-2 px-5 py-4 transition-all font-semibold text-sm border-b-[3px] ${
                  isActive 
                    ? 'border-[#f2a83b] text-[#f2a83b]' 
                    : 'border-transparent text-white/80 hover:text-white hover:border-white/30'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Right Side: Post Artwork Button */}
        <button className="bg-[#f2a83b] hover:bg-[#ffbd59] text-zinc-900 font-bold px-6 py-2 rounded-full text-sm transition-all shadow-sm hover:shadow hover:-translate-y-0.5">
          + Post Artwork
        </button>

      </div>
    </div>
  );
}