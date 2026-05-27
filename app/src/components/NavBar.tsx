"use client";
import React, { useState } from 'react';
import { logout } from '@/app/actions';
import Image from 'next/image';
import Link from 'next/link';
import PostArtworkModal from './PostArtworkModal';
import { Search, MessageSquare, Bell, ShoppingCart, ChevronDown, UserRound, LayoutGrid, DollarSign, Sparkles, LogOut, Plus } from 'lucide-react';

interface NavBarProps {
    logoText?: string;
    onSearch?: (query: string) => void;
    userName?: string;
    profileImage?: string;
    isArtist?: boolean; 
}

export const NavBar: React.FC<NavBarProps> = ({
    logoText = 'GamâLokal',
    onSearch,
    userName = 'A',
    profileImage = '/user-default.svg',
    isArtist = false,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        onSearch?.(query);
    };

    return (
        <nav className="bg-white px-6 py-3 flex items-center justify-between border-b border-gray-100 shadow-sm w-full">
            {/* Logo Section */}
            <div className="flex items-center gap-3 min-w-fit">
                <a href="/homepage" className="flex items-center gap-3 no-underline">
                    <Image src="/logo.png" alt="GamâLokal Logo" width={40} height={40} className="object-contain" />
                    <div className="flex flex-col">
                        <span className="text-xl font-black text-[#C87941] leading-none tracking-tight">{logoText}</span>
                        <span className="text-[10px] font-medium text-[#1C4A5C] tracking-wide mt-0.5">Art & Craft Marketplace</span>
                    </div>
                </a>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-3xl mx-8">
                <div className="flex w-full">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Search artworks, artists, crafts..."
                            value={searchQuery}
                            onChange={handleSearch}
                            className="w-full border border-r-0 border-[#C87941] rounded-l-full pl-12 pr-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#C87941] focus:border-[#C87941] transition-colors"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} strokeWidth={2.5} />
                    </div>
                    <button className="bg-[#C87941] hover:bg-[#b06a39] text-white px-6 rounded-r-full border border-[#C87941] flex items-center justify-center transition-colors">
                        <Search size={18} strokeWidth={2.5} />
                    </button>
                </div>
            </div>

            {/* Right Side Icons & Profile */}
            <div className="flex items-center gap-6 min-w-fit">
                
                {/* Post Artwork Button (Artist Only) */}
                {isArtist && (
                  <button 
                    onClick={() => setIsPostModalOpen(true)}
                    className="flex items-center gap-2 bg-[#1C4A5C] text-white px-5 py-2.5 rounded-full font-bold text-sm hover:bg-[#143745] hover:scale-105 transition-all shadow-md active:scale-95"
                  >
                    <Plus size={18} strokeWidth={3} />
                    Post Artwork
                  </button>
                )}

                {/* Messages Icon */}
                <button className="relative text-[#C87941] hover:text-[#b06a39] transition-colors">
                    <MessageSquare size={22} strokeWidth={1.5} />
                    <span className="absolute -top-1.5 -right-1.5 bg-[#f2a83b] text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white">3</span>
                </button>

                {/* Notifications Icon */}
                <button className="relative text-[#C87941] hover:text-[#b06a39] transition-colors">
                    <Bell size={24} strokeWidth={1.5} />
                    <span className="absolute -top-1.5 -right-1.5 bg-[#1C4A5C] text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white">5</span>
                </button>

                {/* Cart/Bag Icon */}
                <button className="relative text-[#C87941] hover:text-[#b06a39] transition-colors">
                    <ShoppingCart size={24} strokeWidth={1.5} />
                    <span className="absolute -top-1.5 -right-1.5 bg-[#8B5A2B] text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white">2</span>
                </button>

                {/* Profile Dropdown */}
                <div className="relative ml-2">
                    <button 
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center gap-2 border border-[#C87941] rounded-full pl-1 pr-3 py-1 hover:bg-orange-50 transition-colors"
                    >
                        <Image src={profileImage} alt="Profile" width={28} height={28} className="rounded-full bg-gray-200" />
                        <span className="text-[#C87941] text-sm font-semibold">{userName}</span>
                        <ChevronDown size={14} strokeWidth={1.5} className={`transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isProfileOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden">
                            
                            <Link href="/profile" onClick={() => setIsProfileOpen(false)} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                                <UserRound size={16} strokeWidth={1.5} />
                                Profile
                            </Link>

                            {/* ARTIST ONLY LINKS */}
                            {isArtist && (
                                <>
                                    <Link href="/dashboard" onClick={() => setIsProfileOpen(false)} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 border-t border-gray-50">
                                        <LayoutGrid size={16} strokeWidth={2} />
                                        Dashboard
                                    </Link>

                                    <Link href="/dashboard/sales" onClick={() => setIsProfileOpen(false)} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 border-t border-gray-50">
                                        <DollarSign size={16} strokeWidth={2} />
                                        Sales
                                    </Link>
                                </>
                            )}

                            {/* NON-ARTIST ONLY LINK */}
                            {!isArtist && (
                                <Link href="/onboarding/artist" onClick={() => setIsProfileOpen(false)} className="w-full text-left px-4 py-3 text-sm text-[#1C4A5C] font-semibold hover:bg-[#e8ecef] flex items-center gap-3 border-t border-gray-100 bg-gray-50/50">
                                    <Sparkles size={16} strokeWidth={2} />
                                    Become an Artist
                                </Link>
                            )}

                            <form action={logout}>
                                <button type="submit" className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 border-t border-gray-100 font-medium">
                                    <LogOut size={16} strokeWidth={2} />
                                    Logout
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
            
            <PostArtworkModal 
              isOpen={isPostModalOpen} 
              onClose={() => setIsPostModalOpen(false)} 
            />
        </nav>
    );
};
