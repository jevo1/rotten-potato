import React, { useState } from 'react';
import PostArtworkModal from './PostArtworkModal';
import { Home, Globe, ClipboardList, MessageSquare, Plus } from 'lucide-react';

interface PageTabProps {
  activeTab: number;
  setActiveTab: (tab: number) => void;
}

export default function PageTab({ activeTab, setActiveTab }: PageTabProps) {
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  
  const tabs = [
    {
      id: 0,
      label: 'Home',
      icon: <Home size={18} strokeWidth={2.5} />
    },
    {
      id: 1,
      label: 'Browse',
      icon: <Globe size={18} strokeWidth={2.5} />
    },
    {
      id: 2,
      label: 'Commission',
      icon: <ClipboardList size={18} strokeWidth={2.5} />
    },
    {
      id: 3,
      label: 'Messages',
      icon: <MessageSquare size={18} strokeWidth={2.5} />
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
        <button 
          onClick={() => setIsPostModalOpen(true)}
          className="bg-[#f2a83b] hover:bg-[#ffbd59] text-zinc-900 font-bold px-6 py-2 rounded-full text-sm transition-all shadow-sm hover:shadow hover:-translate-y-0.5 flex items-center gap-2"
        >
          <Plus size={16} strokeWidth={3} />
          Post Artwork
        </button>

      </div>
      <PostArtworkModal isOpen={isPostModalOpen} onClose={() => setIsPostModalOpen(false)} />
    </div>
  );
}
